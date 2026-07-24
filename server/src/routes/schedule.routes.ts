import { Router } from 'express';
import { generateSchedule, getTodayAgenda, getStudentSchedules } from '../controllers/schedule.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();
router.use(authenticate, requireRole('student'));

router.post('/generate', generateSchedule);
router.get('/today/:studentId', getTodayAgenda);
router.get('/student/:studentId', getStudentSchedules);

export default router;
