import { Router } from 'express';
import { getClassroomHeatmap, pushMaterialToStudent } from '../controllers/teacher.controller';

const router = Router();

router.get('/heatmap', getClassroomHeatmap);
router.post('/push-assignment', pushMaterialToStudent);

export default router;
