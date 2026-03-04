import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import prisma from './utils/prisma';
import { sendSchedulingLink, sendFollowUpSms } from './services/sms';
import { detectTenant } from './middleware/tenant';

dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import collectionsRoutes from './routes/collections';
import stylesRoutes from './routes/styles';
import productsRoutes from './routes/products';
import customersRoutes from './routes/customers';
import quotesRoutes from './routes/quotes';
import settingsRoutes from './routes/settings';
import usersRoutes from './routes/users';
import publicRoutes from './routes/public';
import kitchenVisionRoutes from './routes/kitchen-vision';
import chatRoutes from './routes/chat';
import smsRoutes from './routes/sms';
import vapiCabinetRoutes from './routes/vapi-cabinet';
import schedulingRoutes from './routes/scheduling';
import catalogRoutes from './routes/catalog';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// API Routes — public routes use detectTenant middleware
app.use('/api/public', detectTenant, publicRoutes);
app.use('/api/public', detectTenant, kitchenVisionRoutes);
app.use('/api/public', detectTenant, schedulingRoutes);
app.use('/api/chat', detectTenant, chatRoutes);
app.use('/api/sms', smsRoutes);
app.use('/vapi-cabinet', vapiCabinetRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/styles', stylesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin/catalog', catalogRoutes);

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  // When running from backend directory, frontend dist is at ../frontend/dist
  const frontendPath = path.join(__dirname, '../../frontend/dist');

  console.log('📂 Serving static files from:', frontendPath);

  app.use(express.static(frontendPath));

  // Catch-all route to serve React app for client-side routing
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }

    const indexPath = path.join(frontendPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        console.error('Looked for file at:', indexPath);
        res.status(500).send('Frontend build not found. Please ensure the frontend was built.');
      }
    });
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Follow-up SMS cron ───────────────────────────────────────────────────────
// Runs hourly. Finds quotes 23–25 hours old where Emma got no answer/voicemail
// and no measurement is booked. Sends scheduling link, marks as sms_followup_sent.
async function runFollowUpCron() {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 25 * 60 * 60 * 1000);
  const windowEnd   = new Date(now.getTime() - 23 * 60 * 60 * 1000);
  try {
    const quotes = await prisma.quote.findMany({
      where: {
        createdAt:    { gte: windowStart, lte: windowEnd },
        callOutcome:  { in: ['no_answer', 'voicemail'] },
        appointments: { none: {} },
      },
      include: { customer: true },
    });

    for (const quote of quotes) {
      const { customer } = quote;
      if (!customer?.phone) continue;
      try {
        await sendSchedulingLink(customer.phone, customer.firstName, quote.quoteNumber);
        await prisma.quote.update({
          where: { id: quote.id },
          data:  { callOutcome: 'sms_followup_sent' },
        });
        console.log(`[Cron] Follow-up SMS sent → ${quote.quoteNumber}`);
      } catch (err: any) {
        console.error(`[Cron] SMS failed for ${quote.quoteNumber}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error('[Cron] Follow-up cron error:', err.message);
  }
}

// ─── 10-min customer SMS follow-up cron ──────────────────────────────────────
// Runs every 5 min. Finds quotes submitted 10–30 min ago where the customer
// hasn't replied and hasn't gotten a follow-up yet. Sends schedule link nudge.
async function runCustomerFollowUpCron() {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 30 * 60 * 1000); // 30 min ago
  const windowEnd   = new Date(now.getTime() - 10 * 60 * 1000); // 10 min ago
  try {
    const quotes = await prisma.quote.findMany({
      where: {
        createdAt:        { gte: windowStart, lte: windowEnd },
        customerRepliedAt: null,
        followUpSentAt:   null,
      },
      include: { customer: true },
    });

    for (const quote of quotes) {
      const { customer } = quote;
      if (!customer?.phone) continue;
      try {
        await sendFollowUpSms(customer.firstName, customer.phone, quote.quoteNumber);
        await prisma.quote.update({
          where: { id: quote.id },
          data:  { followUpSentAt: new Date() },
        });
        console.log(`[Cron:10min] Follow-up SMS sent → ${quote.quoteNumber}`);
      } catch (err: any) {
        console.error(`[Cron:10min] Failed for ${quote.quoteNumber}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error('[Cron:10min] Error:', err.message);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('📦 Serving frontend from static files');
  }
  // Hourly cron: Emma no-answer → schedule link (23-25h window)
  setInterval(runFollowUpCron, 60 * 60 * 1000);
  setTimeout(runFollowUpCron, 60 * 1000);
  // 5-min cron: customer opener no-reply → 10-min follow-up nudge
  setInterval(runCustomerFollowUpCron, 5 * 60 * 1000);
  setTimeout(runCustomerFollowUpCron, 2 * 60 * 1000); // first run 2 min after startup
});
