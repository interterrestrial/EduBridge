import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import noteRoutes from './routes/note.routes';
import aiRoutes from './routes/ai.routes';
import quizRoutes from './routes/quiz.routes';
import flashcardRoutes from './routes/flashcard.routes';
import analyticsRoutes from './routes/analytics.routes';
import scheduleRoutes from './routes/schedule.routes';
import teacherRoutes from './routes/teacher.routes';

const app: Application = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/teacher', teacherRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('EduBridge API with AI Engine & Personalization is running 🚀');
});

export default app;
