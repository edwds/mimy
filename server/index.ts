import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env vars at the very beginning
dotenv.config();

import clusterRoutes from './routes/clusterRoutes';
import userRoutes from './routes/userRoutes';
import uploadRoutes from './routes/uploadRoutes';
import reviewRoutes from './routes/reviewRoutes';
import shopRoutes from './routes/shopRoutes';
import keywordRoutes from './routes/keywordRoutes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const db = (await import('./db/database')).default;
    const result = await db.execute('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      env: {
        VERCEL: process.env.VERCEL,
        NODE_ENV: process.env.NODE_ENV,
        HAS_DB_URL: !!process.env.TURSO_DATABASE_URL,
        HAS_AUTH_TOKEN: !!process.env.TURSO_AUTH_TOKEN
      }
    });
  } catch (e: any) {
    res.status(500).json({
      status: 'error',
      message: e.message,
      env: {
        VERCEL: process.env.VERCEL,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', clusterRoutes);
app.use('/api', userRoutes);
app.use('/api', uploadRoutes);
app.use('/api', reviewRoutes);
app.use('/api', shopRoutes);
app.use('/api', keywordRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global Server Error:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: err.message,
    path: req.path
  });
});

// Only listen if this file is run directly (not as a module)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
