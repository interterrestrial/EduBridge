import { Router } from 'express';
import {
  getClassroomHeatmap,
  getTeacherScopes,
  pushMaterialToStudent,
  getAllNotes,
  getAllQuizzes,
  getStudentDetail,
  getPushHistory,
  getUnassignedStudents,
  addStudentToClassroom,
  removeStudentFromClassroom,
  updateStudentExamAvg,
} from '../controllers/teacher.controller';
import { createExam, getExams, getExam, saveScores, editScore, deleteExam } from '../controllers/exam.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();

router.use(authenticate, requireRole('teacher'));

// Heatmap & roster
router.get('/heatmap', getClassroomHeatmap);
router.get('/scopes', getTeacherScopes);
router.get('/notes', getAllNotes);
router.get('/quizzes', getAllQuizzes);
router.get('/student/:studentId', getStudentDetail);

// Classroom enrollment
router.get('/students/unassigned', getUnassignedStudents);
router.post('/students', addStudentToClassroom);
router.delete('/students/:studentId', removeStudentFromClassroom);
router.patch('/students/:studentId/exam-avg', updateStudentExamAvg);

// Exams
router.post('/exams', createExam);
router.get('/exams', getExams);
router.get('/exams/:examId', getExam);
router.put('/exams/:examId/scores', saveScores);
router.patch('/exams/:examId/scores/:studentId', editScore);
router.delete('/exams/:examId', deleteExam);

// Push assignments
router.get('/push-history', getPushHistory);
router.post('/push-assignment', pushMaterialToStudent);

export default router;
