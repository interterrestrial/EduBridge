import { Router } from 'express';
import { chatTutor, getChatHistory } from '../controllers/ai.controller';

const router = Router();

router.post('/chat', chatTutor);
router.get('/history/:studentId', getChatHistory);

export default router;
