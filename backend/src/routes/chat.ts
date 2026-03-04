import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import prisma from '../utils/prisma';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(business: any): string {
  const name    = business?.name    || 'the cabinet company';
  const phone   = business?.phone   || '(833) 201-7849';
  const email   = business?.email   || 'info@cabinetquoting.com';
  const city    = business?.city    || 'Orlando';
  const state   = business?.state   || 'FL';

  return `You are a friendly AI assistant for ${name} — a cabinet installation company serving ${city}, ${state}. You help homeowners understand their options, answer questions, and get free quotes.

BUSINESS INFO:
- Name: ${name}
- Phone: ${phone}
- Email: ${email}
- Location: ${city}, ${state}
- Available: 24/7 for calls, installations Mon–Sat
- Licensed & fully insured in Florida, 16+ years in business

SERVICES & PRICING:
- Small Kitchen (up to 10×10 ft): $7,500–$10,000 installed
- Medium Kitchen (12×14 ft): $10,500–$14,000 installed
- Large Kitchen (15×15+ ft): $14,500–$19,000 installed
- Bathroom Vanity Installation: $1,200–$4,500
- Countertop Installation: $800–$3,500
- Install Only (customer supplies cabinets from IKEA, Home Depot, etc.): $2,800–$4,000 flat rate
- Labor: $100–$125 per cabinet
- We are 30–40% less expensive than big box stores

COLLECTIONS (5 total, 1,044+ SKUs):
- Builder Grade — contractor-grade value, most affordable
- Essential & Charm — classic shaker, most popular
- Classical & Double Shaker — raised panels, timeless
- Slim Shaker — modern minimal
- Frameless High Gloss — European style, premium

SERVICE AREAS: ${city} and surrounding areas

HOW TO RESPOND:
- Be warm, conversational, and concise — 2–3 sentences max unless they ask something detailed
- Give real pricing numbers confidently — we provide upfront transparent pricing
- When someone is ready to move forward, offer to capture their info so the team calls within 2 hours
- If you don't know something specific, say "I'm not 100% sure on that — our team can answer at ${phone}"
- Never be pushy

LEAD CAPTURE:
When a user wants a quote or to be contacted, ask for their first name, last name, email, and phone number one at a time naturally in conversation. Once you have all four, include this exact JSON at the very end of your response (nothing after it):
{"capturedLead":true,"firstName":"...","lastName":"...","email":"...","phone":"..."}

Only include the JSON when you have confirmed all four values.`;
}

router.post('/', async (req: any, res: any) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const business = req.business;
    const businessId: string = req.businessId;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: buildSystemPrompt(business),
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse out lead capture JSON if present
    let reply = raw;
    let leadSaved = false;
    const jsonMatch = raw.match(/\{"capturedLead":true[^}]+\}/);
    if (jsonMatch) {
      try {
        const lead = JSON.parse(jsonMatch[0]);
        reply = raw.replace(jsonMatch[0], '').trim();

        // Save lead to DB scoped to this business
        let customer = await prisma.customer.findFirst({ where: { businessId, email: lead.email } });
        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              firstName: lead.firstName,
              lastName: lead.lastName,
              email: lead.email,
              phone: lead.phone,
              address: '',
              city: business?.city || 'Orlando',
              state: business?.state || 'FL',
              zipCode: '',
              businessId: businessId || undefined,
            },
          });
        }

        const adminUser = await prisma.user.findFirst({ where: { businessId, role: 'ADMIN' } });
        const collection = await prisma.collection.findFirst({
          where: { businessId },
          include: { styles: { take: 1 } }
        });

        if (adminUser && collection && collection.styles.length > 0) {
          const count = await prisma.quote.count({ where: { businessId } });
          await prisma.quote.create({
            data: {
              quoteNumber: `Q-${new Date().getFullYear()}-CHAT-${String(count + 1).padStart(4, '0')}`,
              businessId: businessId || undefined,
              customerId: customer.id,
              userId: adminUser.id,
              collectionId: collection.id,
              styleId: collection.styles[0].id,
              status: 'DRAFT',
              notes: `CHATBOT LEAD\nCaptured via website chat widget\nSubmitted: ${new Date().toISOString()}`,
              subtotal: 0, clientCabinetPrice: 0, installationFee: 0,
              miscExpenses: 0, taxRate: 0.0875, taxAmount: 0,
              total: 0, msrpTotal: 0,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }

        leadSaved = true;
      } catch (e) {
        console.error('Lead parse/save error:', e);
      }
    }

    res.json({ reply, leadSaved });
  } catch (err) {
    console.error('Chat error:', err);
    const phone = (req as any).business?.phone || '(833) 201-7849';
    res.status(500).json({ error: `Chat unavailable. Please call ${phone}.` });
  }
});

export default router;
