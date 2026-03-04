import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { sendSchedulingLink, sendMeasurementConfirmation, sendSms } from '../services/sms';

const router = Router();

// ─── Mid-call tool handler ─────────────────────────────────────────────────
// Called by Vapi when Emma uses the schedule_measurement tool
router.post('/tool', async (req: Request, res: Response) => {
  try {
    const message = req.body?.message;
    const toolCalls = message?.toolCalls as any[];

    if (!toolCalls?.length) {
      return res.json({ results: [] });
    }

    const results = [];

    for (const call of toolCalls) {
      const { id: toolCallId, function: fn } = call;

      if (fn?.name === 'schedule_measurement') {
        const { date, time, quoteId } = fn.arguments || {};

        try {
          // Parse date + time into a DateTime
          const scheduledAt = new Date(`${date}T${time}:00`);

          // Look up quote to get customerId
          const quote = await prisma.quote.findUnique({
            where: { id: quoteId },
            include: { customer: true },
          });

          if (!quote) {
            results.push({ toolCallId, result: 'Quote not found. Please confirm the booking manually.' });
            continue;
          }

          // Create appointment
          await prisma.measurementAppointment.create({
            data: {
              quoteId: quote.id,
              customerId: quote.customerId,
              scheduledAt,
              source: 'CALL',
              status: 'PENDING',
            },
          });

          // Update quote call outcome
          await prisma.quote.update({
            where: { id: quoteId },
            data: {
              callAttemptedAt: new Date(),
              callOutcome: 'scheduled',
            },
          });

          // Send SMS confirmation to customer
          sendMeasurementConfirmation(quote.customer.phone, quote.customer.firstName, scheduledAt)
            .catch(e => console.error('[SMS] Measurement confirmation failed:', e.message));

          const dateStr = scheduledAt.toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric',
          });
          const timeStr = scheduledAt.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true,
          });

          results.push({
            toolCallId,
            result: `Appointment booked for ${dateStr} at ${timeStr}. A confirmation text has been sent to the customer.`,
          });
        } catch (err: any) {
          console.error('[Vapi Tool] schedule_measurement error:', err);
          results.push({ toolCallId, result: 'Booking failed. Please try again.' });
        }
      } else {
        results.push({ toolCallId, result: 'Unknown tool.' });
      }
    }

    res.json({ results });
  } catch (err) {
    console.error('[Vapi Tool] Handler error:', err);
    res.json({ results: [] });
  }
});

// ─── End-of-call webhook ───────────────────────────────────────────────────
// Called by Vapi when a call ends — handles no-answer → SMS follow-up
router.post('/webhook', async (req: Request, res: Response) => {
  // Always 200 immediately — Vapi retries on non-200
  res.sendStatus(200);

  try {
    const { message } = req.body;
    if (message?.type !== 'end-of-call-report') return;

    const endedReason: string = message?.endedReason || '';
    const callId: string = message?.call?.id || '';
    const variableValues = message?.call?.assistantOverrides?.variableValues || {};
    const { quoteId, customerName } = variableValues;

    if (!quoteId) {
      console.log('[Vapi Webhook] No quoteId in variableValues, skipping');
      return;
    }

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { customer: true },
    });

    if (!quote) {
      console.log(`[Vapi Webhook] Quote ${quoteId} not found`);
      return;
    }

    // Map Vapi endedReason to outcome
    const noAnswerReasons = ['no-answer', 'voicemail', 'silence-timed-out', 'exceeded-max-duration'];
    const isNoAnswer = noAnswerReasons.some(r => endedReason.includes(r));

    // Only update if not already marked as scheduled (tool call already set it)
    if (quote.callOutcome !== 'scheduled') {
      const outcome = isNoAnswer ? 'no_answer' : 'declined';

      await prisma.quote.update({
        where: { id: quoteId },
        data: {
          callAttemptedAt: new Date(),
          callOutcome: outcome,
        },
      });

      // Send SMS with scheduling link if no answer
      if (isNoAnswer) {
        sendSchedulingLink(quote.customer.phone, quote.customer.firstName, quote.quoteNumber)
          .catch(e => console.error('[SMS] Scheduling link failed:', e.message));

        console.log(`[Vapi Webhook] No answer for ${quote.quoteNumber} — scheduling link SMS sent`);
      } else {
        console.log(`[Vapi Webhook] Call ended (${endedReason}) for ${quote.quoteNumber} — outcome: ${outcome}`);
      }
    }
  } catch (err) {
    console.error('[Vapi Webhook] Error:', err);
  }
});

export default router;
