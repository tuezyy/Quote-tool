/**
 * ClickSend SMS Service
 * Docs: https://developers.clicksend.com/docs/rest/v3/
 * Auth: Basic Auth (username:api_key)
 *
 * Env vars required:
 *   CLICKSEND_USERNAME   — your ClickSend account email
 *   CLICKSEND_API_KEY    — your ClickSend API key
 *   CLICKSEND_FROM       — your dedicated ClickSend number (+18332017849)
 *   INSTALLER_PHONE      — installer's mobile number (+13214242981)
 */

const CLICKSEND_URL = 'https://rest.clicksend.com/v3/sms/send';

export interface BusinessSmsConfig {
  name?: string;
  clicksendFrom?: string | null;
}

function getAuth(): string {
  const user = process.env.CLICKSEND_USERNAME;
  const key  = process.env.CLICKSEND_API_KEY;
  if (!user || !key) throw new Error('ClickSend credentials not configured');
  return 'Basic ' + Buffer.from(`${user}:${key}`).toString('base64');
}

export async function sendSms(to: string, body: string, fromOverride?: string | null): Promise<void> {
  const from = fromOverride || process.env.CLICKSEND_FROM || '+18332017849';

  const payload = {
    messages: [
      {
        source: 'sdk',
        from,
        body,
        to,
      },
    ],
  };

  const res = await fetch(CLICKSEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuth(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClickSend error ${res.status}: ${text}`);
  }

  const data = await res.json() as any;
  const msgStatus = data?.data?.messages?.[0]?.status;
  if (msgStatus && msgStatus !== 'SUCCESS') {
    console.warn(`[SMS] Non-success status: ${msgStatus}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Message templates
// ─────────────────────────────────────────────────────────────────────────────

// First SMS after quote submission — conversational opener, not a confirmation blast
export async function sendCustomerOpener(
  firstName: string,
  phone: string,
  quoteNumber: string,
  business?: BusinessSmsConfig,
): Promise<void> {
  const bname = business?.name || 'Cabinets of Orlando';
  const body =
    `Hey ${firstName}! This is Emma from ${bname} — saw your cabinet request. ` +
    `Quick question: are you planning to fully replace all your cabinets, or more of a partial update?`;
  await sendSms(phone, body, business?.clicksendFrom);
}

// 10-min follow-up if customer hasn't replied to the opener
export async function sendFollowUpSms(
  firstName: string,
  phone: string,
  quoteNumber: string,
  business?: BusinessSmsConfig,
): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL || 'https://cabinet-quoting-production.up.railway.app';
  const link = `${baseUrl}/schedule?quote=${quoteNumber}&name=${encodeURIComponent(firstName)}`;
  const body =
    `Hey ${firstName}, just following up on your cabinet request! ` +
    `Happy to answer any questions, or you can grab a time here: ${link}`;
  await sendSms(phone, body, business?.clicksendFrom);
}

export async function sendInstallerNotification(
  installerPhone: string,
  customerName: string,
  customerPhone: string,
  kitchenSize: string,
  collection: string,
  quoteNumber: string,
  business?: BusinessSmsConfig,
): Promise<void> {
  const body =
    `NEW JOB REQUEST - ${quoteNumber}\n` +
    `Customer: ${customerName}\n` +
    `Phone: ${customerPhone}\n` +
    `Kitchen: ${kitchenSize}\n` +
    `Style: ${collection}\n` +
    `Reply YES to confirm availability or NO to decline.`;
  await sendSms(installerPhone, body, business?.clicksendFrom);
}

export async function sendSchedulingLink(
  phone: string,
  firstName: string,
  quoteNumber: string,
  business?: BusinessSmsConfig,
): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL || 'https://cabinet-quoting-production.up.railway.app';
  const link = `${baseUrl}/schedule?quote=${quoteNumber}&name=${encodeURIComponent(firstName)}`;
  const bname = business?.name || 'Cabinets of Orlando';
  const body =
    `Hey ${firstName}! This is Emma from ${bname} — I just tried calling about your free cabinet measurement. ` +
    `Pick a time that works for you here: ${link} Takes 30 seconds!`;
  await sendSms(phone, body, business?.clicksendFrom);
}

export async function sendMeasurementConfirmation(
  phone: string,
  firstName: string,
  scheduledAt: Date,
  business?: BusinessSmsConfig,
): Promise<void> {
  const dateStr = scheduledAt.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const timeStr = scheduledAt.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
  const body =
    `You're all set, ${firstName}! Your free cabinet measurement is scheduled for ` +
    `${dateStr} at ${timeStr}. We'll see you then!`;
  await sendSms(phone, body, business?.clicksendFrom);
}

export async function sendReviewRequest(
  customerPhone: string,
  firstName: string,
  business?: BusinessSmsConfig,
): Promise<void> {
  const bname = business?.name || 'Cabinets of Orlando';
  const reviewUrl = business?.clicksendFrom
    ? `https://g.page/r/cabinetsoforlando/review`
    : `https://g.page/r/cabinetsoforlando/review`;
  const body =
    `Hi ${firstName}, it's ${bname}! Hope you're loving your new cabinets. ` +
    `If you have a moment, a Google review would mean the world to us: ` +
    reviewUrl;
  await sendSms(customerPhone, body, business?.clicksendFrom);
}
