/**
 * Vapi Outbound Call Service — Cabinets of Orlando
 * Triggers AI outbound calls via Vapi API
 *
 * Env vars required:
 *   VAPI_API_KEY                  — Vapi API key (from Vapi dashboard)
 *   VAPI_CABINET_PHONE_NUMBER_ID  — Twilio number ID registered in Vapi
 *   VAPI_CABINET_AGENT_ID         — Emma agent ID from Vapi dashboard
 */

const VAPI_API_URL = 'https://api.vapi.ai/call/phone';

export async function triggerOutboundCall(
  customerPhone: string,
  customerName: string,
  quoteNumber: string,
  quoteId: string
): Promise<void> {
  const apiKey = process.env.VAPI_API_KEY;
  const phoneNumberId = process.env.VAPI_CABINET_PHONE_NUMBER_ID;
  const assistantId = process.env.VAPI_CABINET_AGENT_ID;

  if (!apiKey || !phoneNumberId || !assistantId) {
    throw new Error('Vapi env vars not configured (VAPI_API_KEY, VAPI_CABINET_PHONE_NUMBER_ID, VAPI_CABINET_AGENT_ID)');
  }

  const payload = {
    phoneNumberId,
    assistantId,
    customer: {
      number: customerPhone,
      name: customerName,
    },
    assistantOverrides: {
      variableValues: {
        customerName,
        quoteNumber,
        quoteId,
      },
    },
  };

  const res = await fetch(VAPI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi API error ${res.status}: ${text}`);
  }
}
