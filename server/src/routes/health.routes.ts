import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/', asyncHandler(healthCheck));
export default router;
