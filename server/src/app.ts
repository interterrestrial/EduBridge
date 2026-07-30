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
  // Always log real error details so Render logs show the root cause
  console.error('[API ERROR]', {
    name: err?.name,
    code: err?.code,          // Prisma error codes: P1001, P2002, P2021, etc.
    message: err?.message,
  });

  if (err instanceof ApiError || err?.name === 'ApiError') {
    res.status(err.statusCode || 500).json({ error: err.message });
    return;
  }

  // Surface statusCode if present (e.g. custom errors with .statusCode)
  const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
  res.status(statusCode).json({
    error: err?.message || 'Internal server error',
    stack: process.env.NODE_ENV !== 'production' ? err?.stack : err?.stack, // Temporarily expose stack for debugging
    requestId: Date.now().toString(),
  });
});

export default app;
