/**
 * Inbound SMS webhook — receives replies from ClickSend
 *
 * ClickSend configuration:
 *   Console → SMS → Inbound Numbers → set Delivery URL to:
 *   https://cabinet-quoting-production.up.railway.app/api/sms/inbound
 *
 * Payload from ClickSend:
 *   {
 *     from: "+13214242981",
 *     body: "YES",
 *     to: "+18332017849",
 *     message_id: "...",
 *     timestamp: 1234567890
 *   }
 */

import { Router } from 'express';
import prisma from '../utils/prisma';
import { sendSms, sendInstallerNotification } from '../services/sms';

const router = Router();

// ─────────────────────────────────────────────
// POST /api/sms/inbound
// ClickSend webhook — installer replies YES or NO
// ─────────────────────────────────────────────
router.post('/inbound', async (req: any, res: any) => {
  // Always 200 — ClickSend retries on non-200
  res.status(200).json({ success: true });

  try {
    const { from, body: msgBody } = req.body;

    if (!from || !msgBody) return;

    const normalized = msgBody.trim().toUpperCase();
    const isYes = normalized === 'YES' || normalized.startsWith('YES');
    const isNo  = normalized === 'NO'  || normalized.startsWith('NO');

    if (!isYes && !isNo) {
      console.log(`[SMS inbound] Unrecognised reply from ${from}: "${msgBody}"`);
      return;
    }

    // Find the most recent DRAFT quote that was sent to this installer number
    const quote = await prisma.quote.findFirst({
      where: {
        installerPhone: from,
        installerConfirmed: false,
        status: 'DRAFT',
      },
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!quote) {
      console.log(`[SMS inbound] No matching quote for ${from}`);
      return;
    }

    if (isYes) {
      await prisma.quote.update({
        where: { id: quote.id },
        data: {
          installerConfirmed: true,
          installerConfirmedAt: new Date(),
          status: 'APPROVED',
        },
      });

      // Confirm back to installer
      await sendSms(
        from,
        `Got it! You're confirmed for ${quote.customer.firstName} ${quote.customer.lastName} (${quote.quoteNumber}). ` +
        `Customer phone: ${quote.customer.phone}. We'll be in touch with details.`
      ).catch((e) => console.error('[SMS] Installer confirm reply failed:', e.message));

      console.log(`[SMS inbound] Installer confirmed quote ${quote.quoteNumber}`);

    } else {
      // Installer declined — ack them, find next available installer
      await sendSms(
        from,
        `No worries! We'll reassign ${quote.quoteNumber}.`
      ).catch((e) => console.error('[SMS] Installer decline reply failed:', e.message));

      // Find next available installer with a phone, excluding the one who just declined
      const nextInstaller = await prisma.user.findFirst({
        where: {
          role: 'INSTALLER',
          isAvailable: true,
          phone: { not: null },
          NOT: { phone: from },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (nextInstaller?.phone) {
        // Re-notify next installer and update quote
        await prisma.quote.update({
          where: { id: quote.id },
          data: { installerPhone: nextInstaller.phone },
        });

        await sendInstallerNotification(
          nextInstaller.phone,
          `${quote.customer.firstName} ${quote.customer.lastName}`,
          quote.customer.phone,
          'See quote notes',
          'See quote notes',
          quote.quoteNumber
        ).catch((e) => console.error('[SMS] Re-notify installer failed:', e.message));

        console.log(`[SMS inbound] Reassigned ${quote.quoteNumber} to ${nextInstaller.phone}`);
      } else {
        // No other installer available — alert admin fallback
        const adminPhone = process.env.INSTALLER_PHONE || '';
        if (adminPhone && adminPhone !== from) {
          await sendSms(
            adminPhone,
            `ALL INSTALLERS DECLINED: ${quote.quoteNumber} for ` +
            `${quote.customer.firstName} ${quote.customer.lastName} (${quote.customer.phone}). Manual assignment needed.`
          ).catch((e) => console.error('[SMS] Admin fallback alert failed:', e.message));
        }
        console.log(`[SMS inbound] No next installer available for ${quote.quoteNumber}`);
      }
    }
  } catch (err: any) {
    console.error('[SMS inbound] Error processing webhook:', err.message);
  }
});

export default router;
