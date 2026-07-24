import { Router } from 'express';
import { getStudentAnalytics, getTeacherInsights } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();

// Student analytics: student role
router.get('/student/:studentId', authenticate, requireRole('student'), getStudentAnalytics);
// Teacher insights: teacher role
router.get('/teacher/insights', authenticate, requireRole('teacher'), getTeacherInsights);

export default router;
