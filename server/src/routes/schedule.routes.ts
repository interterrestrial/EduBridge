import { Router } from 'express';
import { generateSchedule, getTodayAgenda, getStudentSchedules } from '../controllers/schedule.controller';

const router = Router();

router.post('/generate', generateSchedule);
router.get('/today/:studentId', getTodayAgenda);
router.get('/student/:studentId', getStudentSchedules);

export default router;
