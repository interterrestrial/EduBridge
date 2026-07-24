import { Router } from 'express';
import { createSession, getSessions, getSessionMessages, deleteSession, chatTutor, autoGroupItems } from '../controllers/ai.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();
router.use(authenticate, requireRole('student'));

router.post('/chat', chatTutor);
router.post('/auto-group', autoGroupItems);
router.post('/sessions', createSession);
router.get('/sessions/:studentId', getSessions);
router.get('/sessions/messages/:sessionId', getSessionMessages);
router.delete('/sessions/:sessionId', deleteSession);

export default router;
