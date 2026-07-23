import { Router } from 'express';
import { generateQuiz, submitQuiz, getQuizzes } from '../controllers/quiz.controller';

const router = Router();

router.post('/generate', generateQuiz);
router.post('/submit', submitQuiz);
router.get('/student/:studentId', getQuizzes);

export default router;
