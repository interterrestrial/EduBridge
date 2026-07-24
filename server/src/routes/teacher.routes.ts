import { Router } from 'express';
import { getClassroomHeatmap, pushMaterialToStudent } from '../controllers/teacher.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();

router.use(authenticate, requireRole('teacher'));

router.get('/heatmap', getClassroomHeatmap);
router.post('/push-assignment', pushMaterialToStudent);

export default router;
