import { Router } from 'express';
import {
  chatTutor,
  createSession,
  getSessions,
  getSessionMessages,
  deleteSession,
} from '../controllers/ai.controller';

const router = Router();

router.post('/chat', chatTutor);
router.post('/sessions', createSession);
router.get('/sessions/:studentId', getSessions);
router.get('/sessions/messages/:sessionId', getSessionMessages);
router.delete('/sessions/:sessionId', deleteSession);

export default router;
