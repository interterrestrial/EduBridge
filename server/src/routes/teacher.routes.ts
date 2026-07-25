import { Router } from 'express';
import { getClassroomHeatmap, pushMaterialToStudent, getAllNotes, getAllQuizzes, getStudentDetail } from '../controllers/teacher.controller';
import { createExam, getExams, getExam, saveScores, editScore, deleteExam } from '../controllers/exam.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();

router.use(authenticate, requireRole('teacher'));

// Heatmap & roster
router.get('/heatmap', getClassroomHeatmap);
router.get('/notes', getAllNotes);
router.get('/quizzes', getAllQuizzes);
router.get('/student/:studentId', getStudentDetail);

// Exams
router.post('/exams', createExam);
router.get('/exams', getExams);
router.get('/exams/:examId', getExam);
router.put('/exams/:examId/scores', saveScores);
router.patch('/exams/:examId/scores/:studentId', editScore);
router.delete('/exams/:examId', deleteExam);

// Push assignments
router.post('/push-assignment', pushMaterialToStudent);

export default router;
