import { Router } from 'express';
import { getStudentAnalytics, getTeacherInsights } from '../controllers/analytics.controller';

const router = Router();

router.get('/student/:studentId', getStudentAnalytics);
router.get('/teacher/insights', getTeacherInsights);

export default router;
