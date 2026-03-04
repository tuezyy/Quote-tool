import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { sendMeasurementConfirmation, sendSms } from '../services/sms';

const router = Router();

// Available time slots (24hr format)
const TIME_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00'];

// ─── GET /api/public/slots?date=YYYY-MM-DD ────────────────────────────────
// Returns available time slots for a given date
router.get('/slots', async (req: Request, res: Response) => {
  try {
    const { date } = req.query as { date?: string };

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date param required (YYYY-MM-DD)' });
    }

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd   = new Date(`${date}T23:59:59`);

    // Find already-booked slots for this date
    const booked = await prisma.measurementAppointment.findMany({
      where: {
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { not: 'CANCELLED' },
      },
      select: { scheduledAt: true },
    });

    const bookedTimes = new Set(
      booked.map(a => a.scheduledAt.toTimeString().slice(0, 5))
    );

    const available = TIME_SLOTS.filter(t => !bookedTimes.has(t)).map(t => {
      const [h, m] = t.split(':').map(Number);
      const d = new Date(`${date}T${t}:00`);
      return {
        value: t,
        label: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      };
    });

    res.json({ date, slots: available });
  } catch (err) {
    console.error('[Scheduling] Slots error:', err);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// ─── POST /api/public/schedule ────────────────────────────────────────────
// Books a measurement appointment from the web scheduling page
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, quoteNumber, date, time, notes } = req.body;

    if (!firstName || !phone || !date || !time) {
      return res.status(400).json({ error: 'firstName, phone, date, and time are required' });
    }

    const scheduledAt = new Date(`${date}T${time}:00`);

    if (isNaN(scheduledAt.getTime())) {
      return res.status(400).json({ error: 'Invalid date or time' });
    }

    // Look up quote by quote number if provided
    let quoteId: string | null = null;
    let customerId: string | null = null;

    if (quoteNumber) {
      const quote = await prisma.quote.findUnique({
        where: { quoteNumber },
        include: { customer: true },
      });

      if (quote) {
        quoteId = quote.id;
        customerId = quote.customerId;

        // Update call outcome if not already scheduled
        if (quote.callOutcome !== 'scheduled') {
          await prisma.quote.update({
            where: { id: quote.id },
            data: { callOutcome: 'scheduled' },
          });
        }
      }
    }

    // If no quote found, find or create customer
    if (!customerId && email) {
      const customer = await prisma.customer.upsert({
        where: { email },
        update: { phone: phone || undefined },
        create: {
          firstName,
          lastName: lastName || '',
          email,
          phone,
          city: 'Orlando',
          state: 'FL',
          zipCode: '',
        },
      });
      customerId = customer.id;
    }

    if (!customerId) {
      return res.status(400).json({ error: 'Could not identify customer. Please provide email or a valid quote number.' });
    }

    // Create appointment
    const appointment = await prisma.measurementAppointment.create({
      data: {
        quoteId: quoteId!,
        customerId,
        scheduledAt,
        notes: notes || null,
        source: 'WEB',
        status: 'PENDING',
      },
    });

    // Send SMS confirmation to customer (non-blocking)
    sendMeasurementConfirmation(phone, firstName, scheduledAt)
      .catch(e => console.error('[SMS] Measurement confirmation failed:', e.message));

    // Notify installer (non-blocking)
    const installerPhone = process.env.INSTALLER_PHONE;
    if (installerPhone) {
      const dateStr = scheduledAt.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      });
      const timeStr = scheduledAt.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
      });
      sendSms(installerPhone,
        `MEASUREMENT SCHEDULED\n` +
        `Customer: ${firstName} ${lastName || ''}\n` +
        `Phone: ${phone}\n` +
        `When: ${dateStr} at ${timeStr}\n` +
        `Quote: ${quoteNumber || 'N/A'}\n` +
        `Notes: ${notes || 'None'}`
      ).catch(e => console.error('[SMS] Installer schedule notify failed:', e.message));
    }

    res.json({ success: true, appointmentId: appointment.id });
  } catch (err) {
    console.error('[Scheduling] Book error:', err);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

export default router;
