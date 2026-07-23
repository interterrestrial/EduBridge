import { Router } from 'express';
import { register, login, getMe, googleAuth, updateRole } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/update-role', authenticate, updateRole);
router.get('/me', authenticate, getMe);

export default router;
