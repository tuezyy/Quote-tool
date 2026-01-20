import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/styles', stylesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', usersRoutes);

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('📦 Serving frontend from static files');
  }
});
