import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import collectionRoutes from './routes/collections';
import styleRoutes from './routes/styles';
import productRoutes from './routes/products';
import customerRoutes from './routes/customers';
import quoteRoutes from './routes/quotes';
import settingRoutes from './routes/settings';
import userRoutes from './routes/users';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({
  origin: isProduction ? true : (process.env.FRONTEND_URL || 'http://localhost:5173'),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/styles', styleRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/users', userRoutes);
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (isProduction) {
  const frontendPath = path.resolve(process.cwd(), 'frontend/dist');

  // Serve static files
  app.use(express.static(frontendPath));

  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (isProduction) {
    console.log(`🌐 Serving frontend from: ${path.join(__dirname, '../../frontend/dist')}`);
  }
});
