import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import noteRoutes from './routes/note.routes';
import folderRoutes from './routes/folder.routes';
import aiRoutes from './routes/ai.routes';
import quizRoutes from './routes/quiz.routes';
import flashcardRoutes from './routes/flashcard.routes';
import analyticsRoutes from './routes/analytics.routes';
import scheduleRoutes from './routes/schedule.routes';
import teacherRoutes from './routes/teacher.routes';
import healthRoutes from './routes/health.routes';
import notificationRoutes from './routes/notification.routes';
import { ApiError } from './utils/apiError';

const app: Application = express();

app.use(cors({
  origin: (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, ''),
  credentials: true,
}));

app.use(express.json());

// Lightweight request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'EduBridge API', time: new Date().toISOString() });
});

// 404 for unmatched routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Central error handler — converts ApiError to its status, everything else to 500
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err?.statusCode || (err instanceof ApiError ? err.statusCode : undefined);
  if (typeof statusCode === 'number') {
    res.status(statusCode).json({ error: err.message || 'Request failed' });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
