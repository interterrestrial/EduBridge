import { Router } from 'express';
import { register, login, getMe, googleAuth, updateRole, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/update-role', authenticate, updateRole);
router.put('/profile', authenticate, updateProfile);
router.get('/me', authenticate, getMe);

export default router;
// Note: `asyncHandler` is applied inside the controller exports, so the route file stays clean.
