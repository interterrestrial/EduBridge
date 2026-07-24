import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authenticate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

export const getClassroomHeatmap = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;

  // Students belonging to this teacher: we treat all students as belonging to the platform teacher
  // (single-classroom model). A future task may add teacher->student enrollment.
  const students = await prisma.user.findMany({
    where: { role: 'student' },
    include: { quizAttempts: true, attendance: true, studentProfile: true },
  });

  const topicAccuracyMap: Record<string, { correctSum: number; totalSum: number }> = {};
  const studentRoster = [];

  for (const student of students) {
    const attempts = student.quizAttempts;
    const accuracies = attempts.map((a) => a.accuracy);
    const avgAccuracy = accuracies.length > 0 ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;
    const presentCount = student.attendance.filter((r) => r.status === 'present').length;
    const attendancePct = student.attendance.length > 0 ? Math.round((presentCount / student.attendance.length) * 100) : 100;
    const weakTopics = Array.from(new Set(attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'))));

    studentRoster.push({
      id: student.id,
      name: student.name,
      email: student.email,
      masteryScore: avgAccuracy,
      quizzesTaken: attempts.length,
      attendancePct,
      status: avgAccuracy >= 80 ? 'Excelling' : avgAccuracy >= 60 ? 'On Track' : 'Needs Support',
      weakTopics,
    });

    attempts.forEach((attempt) => {
      const weakList: string[] = JSON.parse(attempt.weakTopicsJson || '[]');
      weakList.forEach((topic) => {
        if (!topicAccuracyMap[topic]) topicAccuracyMap[topic] = { correctSum: 0, totalSum: 0 };
        topicAccuracyMap[topic].totalSum += 10;
        topicAccuracyMap[topic].correctSum += Math.round((attempt.accuracy / 100) * 10);
      });
    });
  }

  const heatmap = Object.entries(topicAccuracyMap).map(([topic, stat]) => {
    const avgAcc = stat.totalSum > 0 ? Math.round((stat.correctSum / stat.totalSum) * 100) : 50;
    return { topic, averageAccuracy: avgAcc, severity: avgAcc < 50 ? 'high' : avgAcc < 70 ? 'medium' : 'low' };
  });

  res.status(200).json({
    summary: {
      totalStudents: students.length,
      averageClassMastery: Math.round(studentRoster.reduce((acc, s) => acc + s.masteryScore, 0) / (students.length || 1)),
      averageAttendance: Math.round(studentRoster.reduce((acc, s) => acc + s.attendancePct, 0) / (students.length || 1)),
      teacherId,
    },
    heatmap,
    studentRoster,
  });
});

export const pushMaterialToStudent = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;
  const { studentId, title, noteId, quizId, dueDate } = req.body;
  throwIfMissing({ studentId, title });
  if (!noteId && !quizId) throw new ApiError(400, 'Either noteId or quizId is required');

  // Verify the student exists
  const student = await prisma.user.findFirst({ where: { id: studentId, role: 'student' } });
  if (!student) throw new ApiError(404, 'Target student not found');

  const assignment = await prisma.teacherPushAssignment.create({
    data: {
      teacherId,
      studentId,
      title,
      noteId: noteId || null,
      quizId: quizId || null,
      dueDate: dueDate || 'End of Week',
      status: 'pending',
    },
    include: { note: true, quiz: true },
  });

  res.status(201).json({ message: 'Assignment pushed directly to student agenda!', assignment });
});

/**
 * Lists all notes across all students (for the teacher push-assignment modal dropdown).
 * In a single-classroom model, teachers can push any student's note to any other student.
 */
export const getAllNotes = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');

  const notes = await prisma.note.findMany({
    select: {
      id: true,
      title: true,
      fileType: true,
      createdAt: true,
      student: { select: { id: true, name: true } },
      folder: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ notes });
});

/**
 * Lists all quizzes across all students (for the teacher push-assignment modal — quiz push).
 */
export const getAllQuizzes = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');

  const quizzes = await prisma.quiz.findMany({
    select: {
      id: true,
      title: true,
      difficulty: true,
      createdAt: true,
      student: { select: { id: true, name: true } },
      _count: { select: { attempts: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ quizzes });
});

/**
 * Fetches detailed analytics for a specific student (teacher viewing one student's profile).
 * Includes quiz attempts with weak topics, flashcard count, and study profile.
 */
export const getStudentDetail = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');

  const studentId = req.params.studentId as string;
  if (!studentId) throw new ApiError(400, 'studentId is required');

  const student = await prisma.user.findFirst({
    where: { id: studentId, role: 'student' },
    include: {
      studentProfile: true,
      quizAttempts: {
        orderBy: { createdAt: 'desc' },
        include: { quiz: { select: { id: true, title: true, difficulty: true } } },
      },
      notes: { select: { id: true, title: true, createdAt: true }, orderBy: { createdAt: 'desc' } },
      flashcards: { select: { id: true, topic: true, type: true } },
      attendance: { orderBy: { date: 'desc' } },
    },
  });

  if (!student) throw new ApiError(404, 'Student not found');

  const attempts = student.quizAttempts;
  const accuracies = attempts.map((a) => a.accuracy);
  const avgAccuracy = accuracies.length > 0 ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;
  const weakTopics = Array.from(new Set(attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'))));
  const presentCount = student.attendance.filter((r) => r.status === 'present').length;
  const attendancePct = student.attendance.length > 0 ? Math.round((presentCount / student.attendance.length) * 100) : 100;

  res.status(200).json({
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      masteryScore: avgAccuracy,
      attendancePct,
      status: avgAccuracy >= 80 ? 'Excelling' : avgAccuracy >= 60 ? 'On Track' : 'Needs Support',
      weakTopics,
      profile: student.studentProfile,
      quizAttempts: attempts.map((a) => ({
        id: a.id,
        quizId: a.quizId,
        quizTitle: a.quiz?.title || 'Deleted Quiz',
        difficulty: a.quiz?.difficulty || 'medium',
        score: a.score,
        totalQuestions: a.totalQuestions,
        accuracy: a.accuracy,
        weakTopics: JSON.parse(a.weakTopicsJson || '[]'),
        createdAt: a.createdAt,
      })),
      noteCount: student.notes.length,
      flashcardCount: student.flashcards.length,
      notes: student.notes,
    },
  });
});
