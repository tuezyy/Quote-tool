import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// API Routes (Add your specific routes here if you have them)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Static File Serving
const rootDir = process.cwd();
// On Railway, the path is /app/frontend/dist
const frontendPath = path.join(rootDir, 'frontend', 'dist');

app.use(express.static(frontendPath));

// The "Catch-all" route to serve the frontend
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Frontend missing at:', indexPath);
      res.status(500).send("Frontend build missing on server.");
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
