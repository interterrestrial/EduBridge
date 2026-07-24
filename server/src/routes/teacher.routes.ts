import { Router } from 'express';
import { getClassroomHeatmap, pushMaterialToStudent, getAllNotes, getAllQuizzes, getStudentDetail } from '../controllers/teacher.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();

router.use(authenticate, requireRole('teacher'));

router.get('/heatmap', getClassroomHeatmap);
router.get('/notes', getAllNotes);
router.get('/quizzes', getAllQuizzes);
router.get('/student/:studentId', getStudentDetail);
router.post('/push-assignment', pushMaterialToStudent);

export default router;
