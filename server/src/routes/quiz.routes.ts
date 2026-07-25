import { Router } from 'express';
import { generateQuiz, submitQuiz, getQuizzes } from '../controllers/quiz.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();
router.use(authenticate, requireRole('student', 'teacher'));
router.post('/generate', generateQuiz);
router.post('/submit', submitQuiz);
router.get('/student/:studentId', getQuizzes);
export default router;
