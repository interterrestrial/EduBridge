import { Router } from 'express';
import { ApiError } from '../utils/apiError';
const router = Router();
router.get('/error', (req, res, next) => {
  next(new ApiError(409, 'Test error'));
});
export default router;
