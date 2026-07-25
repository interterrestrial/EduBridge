import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authenticate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

export const getClassroomHeatmap = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;

  const students = await prisma.user.findMany({
    where: {
      role: 'student',
      teachersMapped: { some: { teacherId } },
    },
    include: {
      quizAttempts: true,
      attendance: true,
      studentProfile: true,
      examScores: { include: { exam: { select: { maxMarks: true } } } },
    },
  });

  const topicAccuracyMap: Record<string, { correctSum: number; totalSum: number }> = {};
  const studentRoster = [];

  for (const student of students) {
    const attempts = student.quizAttempts;
    const accuracies = attempts.map((a) => a.accuracy);
    const quizAccuracy = accuracies.length > 0 ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;

    // Exam average percentage
    const examScores = student.examScores;
    const examPct = examScores.length > 0
      ? Math.round(examScores.reduce((acc, s) => acc + (s.marks / s.exam.maxMarks) * 100, 0) / examScores.length)
      : 0;

    // Blended mastery: 60% exam + 40% quiz
    const masteryScore = examScores.length > 0 ? Math.round(0.6 * examPct + 0.4 * quizAccuracy) : quizAccuracy;

    // Gap: positive = high quiz practice but low exam (surface practice)
    const gap = quizAccuracy - examPct;
    const gapStatus = gap > 20 ? 'Surface Practice' : gap >= 0 ? 'Aligned' : 'Exam Strong';

    const presentCount = student.attendance.filter((r) => r.status === 'present').length;
    const attendancePct = student.attendance.length > 0 ? Math.round((presentCount / student.attendance.length) * 100) : 0;
    const weakTopics = Array.from(new Set(attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'))));

    studentRoster.push({
      id: student.id,
      name: student.name,
      email: student.email,
      studentCode: student.studentCode || '—',
      quizAccuracy,
      examAverage: examPct,
      masteryScore,
      gap,
      gapStatus,
      quizzesTaken: attempts.length,
      attendancePct,
      status: masteryScore >= 80 ? 'Excelling' : masteryScore >= 60 ? 'On Track' : 'Needs Support',
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

  if (studentId === 'ALL') {
    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        teachersMapped: { some: { teacherId } },
      },
    });
    if (students.length === 0) throw new ApiError(404, 'No students enrolled in your classroom yet');

    const assignments = await Promise.all(
      students.map((student) =>
        prisma.teacherPushAssignment.create({
          data: {
            teacherId,
            studentId: student.id,
            title,
            noteId: noteId || null,
            quizId: quizId || null,
            dueDate: dueDate || 'End of Week',
            status: 'pending',
          },
          include: { note: true, quiz: true },
        })
      )
    );

    const teacherUser = await prisma.user.findUnique({ where: { id: teacherId }, select: { name: true } });
    const teacherName = teacherUser?.name || 'Your Teacher';
    const link = quizId ? `/quizzes?quizId=${quizId}` : (noteId ? `/ai-chat?noteId=${noteId}` : '/student-dashboard');
    await prisma.notification.createMany({
      data: students.map((s) => ({
        userId: s.id,
        title: 'New Assessment Assigned',
        message: `Prof. ${teacherName} assigned a new task: "${title}"`,
        type: 'ASSIGNMENT_PUSHED',
        link,
      })),
    });

    return res.status(201).json({
      message: `Assignment successfully pushed to all ${students.length} students in your classroom!`,
      assignments,
    });
  }

  // Verify the student exists and is mapped to this teacher
  const student = await prisma.user.findFirst({
    where: {
      id: studentId,
      role: 'student',
      teachersMapped: { some: { teacherId } },
    },
  });
  if (!student) throw new ApiError(404, 'Target student not found in your classroom');

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

  const teacherUser = await prisma.user.findUnique({ where: { id: teacherId }, select: { name: true } });
  const teacherName = teacherUser?.name || 'Your Teacher';
  const link = quizId ? `/quizzes?quizId=${quizId}` : (noteId ? `/ai-chat?noteId=${noteId}` : '/student-dashboard');
  await prisma.notification.create({
    data: {
      userId: studentId,
      title: 'New Assessment Assigned',
      message: `Prof. ${teacherName} assigned a new task: "${title}"`,
      type: 'ASSIGNMENT_PUSHED',
      link,
    },
  });

  res.status(201).json({ message: 'Assignment pushed directly to student agenda!', assignment });
});

/**
 * Lists all push assignments sent by this teacher, with student + material details.
 */
export const getPushHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;

  const assignments = await prisma.teacherPushAssignment.findMany({
    where: { teacherId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      note: { select: { id: true, title: true } },
      quiz: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = assignments.map((a) => ({
    id: a.id,
    title: a.title,
    materialType: a.noteId ? 'note' : 'quiz',
    materialTitle: a.note?.title || a.quiz?.title || 'Deleted',
    student: { id: a.studentId, name: a.student.name, email: a.student.email },
    status: a.status,
    dueDate: a.dueDate,
    createdAt: a.createdAt,
  }));

  res.status(200).json({ assignments: formatted });
});

/**
 * Lists all notes across all students (for the teacher push-assignment modal dropdown).
 * In a single-classroom model, teachers can push any student's note to any other student.
 */
export const getAllNotes = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;

  const notes = await prisma.note.findMany({
    where: {
      OR: [
        { studentId: teacherId },
        { student: { teachersMapped: { some: { teacherId } } } },
      ],
    },
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
  const teacherId = req.user.id;

  const quizzes = await prisma.quiz.findMany({
    where: {
      OR: [
        { studentId: teacherId },
        { student: { teachersMapped: { some: { teacherId } } } },
      ],
    },
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

  const teacherId = req.user.id;
  const student = await prisma.user.findFirst({
    where: {
      id: studentId,
      role: 'student',
      teachersMapped: { some: { teacherId } },
    },
    include: {
      studentProfile: true,
      quizAttempts: {
        orderBy: { createdAt: 'desc' },
        include: { quiz: { select: { id: true, title: true, difficulty: true } } },
      },
      notes: { select: { id: true, title: true, createdAt: true }, orderBy: { createdAt: 'desc' } },
      flashcards: { select: { id: true, topic: true, type: true } },
      attendance: { orderBy: { date: 'desc' } },
      examScores: {
        include: { exam: { select: { id: true, title: true, maxMarks: true, examDate: true } } },
        orderBy: { exam: { examDate: 'desc' } },
      },
    },
  });

  if (!student) throw new ApiError(404, 'Student not found');

  const attempts = student.quizAttempts;
  const accuracies = attempts.map((a) => a.accuracy);
  const quizAccuracy = accuracies.length > 0 ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;
  const weakTopics = Array.from(new Set(attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'))));
  const presentCount = student.attendance.filter((r) => r.status === 'present').length;
  const attendancePct = student.attendance.length > 0 ? Math.round((presentCount / student.attendance.length) * 100) : 0;

  // Exam average percentage (mirrors getClassroomHeatmap examPct with length guard)
  const examScores = student.examScores;
  const examAverage = examScores.length > 0
    ? Math.round(examScores.reduce((acc, s) => acc + (s.marks / s.exam.maxMarks) * 100, 0) / examScores.length)
    : 0;

  // Blended mastery: 60% exam + 40% quiz (aligned with getClassroomHeatmap)
  const masteryScore = examScores.length > 0 ? Math.round(0.6 * examAverage + 0.4 * quizAccuracy) : quizAccuracy;

  // Gap indicator: positive gap = high quiz practice but low exam performance (surface practice)
  const gap = quizAccuracy - examAverage;
  const gapStatus = examScores.length === 0
    ? 'No Exam Data'
    : gap > 20 ? 'Surface Practice' : gap >= 0 ? 'Aligned' : 'Exam Strong';
  const hasGapFlag = examScores.length > 0 && gap > 20;

  res.status(200).json({
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      quizAccuracy,
      examAverage,
      masteryScore,
      gap,
      gapStatus,
      hasGapFlag,
      attendancePct,
      status: masteryScore >= 80 ? 'Excelling' : masteryScore >= 60 ? 'On Track' : 'Needs Support',
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
      examScores: examScores.map((s) => ({
        id: s.id,
        examId: s.examId,
        title: s.exam.title,
        marks: s.marks,
        maxMarks: s.exam.maxMarks,
        percentage: Math.round((s.marks / s.exam.maxMarks) * 100),
        examDate: s.exam.examDate,
      })),
      noteCount: student.notes.length,
      flashcardCount: student.flashcards.length,
      notes: student.notes,
    },
  });
});

/**
 * Lists all students not currently mapped to this teacher (for enrollment modal).
 */
export const getUnassignedStudents = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;

  const students = await prisma.user.findMany({
    where: {
      role: 'student',
      NOT: {
        teachersMapped: { some: { teacherId } },
      },
    },
    select: { id: true, name: true, email: true, studentCode: true },
    orderBy: { name: 'asc' },
  });

  res.status(200).json({ students });
});

/**
 * Maps/enrolls a student into the teacher's classroom.
 */
export const addStudentToClassroom = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;
  const { studentId, email, studentCode, subject } = req.body;

  if (!studentId && !email && !studentCode) throw new ApiError(400, 'studentCode, email, or studentId is required');

  let targetId = studentId;
  if (studentCode) {
    const studentByCode = await prisma.user.findFirst({
      where: { studentCode: String(studentCode).trim().toUpperCase(), role: 'student' },
    });
    if (!studentByCode) throw new ApiError(404, 'No student found with that Enrollment Code. Please check the code and try again.');
    targetId = studentByCode.id;
  } else if (!targetId && email) {
    const studentByEmail = await prisma.user.findFirst({
      where: { email: String(email).trim().toLowerCase(), role: 'student' },
    });
    if (!studentByEmail) throw new ApiError(404, 'No student account found with that email address');
    targetId = studentByEmail.id;
  } else if (targetId) {
    const studentById = await prisma.user.findFirst({
      where: { id: targetId, role: 'student' },
    });
    if (!studentById) throw new ApiError(404, 'Student account not found');
  }

  const teacherUser = await prisma.user.findUnique({
    where: { id: teacherId },
    include: { teacherProfile: true },
  });
  const subjectStr = subject ? String(subject).trim() : (teacherUser?.teacherProfile?.subject || teacherUser?.teacherProfile?.department || 'General Curriculum');

  const mapping = await prisma.teacherStudent.upsert({
    where: { teacherId_studentId: { teacherId, studentId: targetId } },
    update: { subject: subjectStr },
    create: { teacherId, studentId: targetId, subject: subjectStr },
  });

  res.status(201).json({ message: 'Student enrolled in your classroom!', mapping });
});

/**
 * Removes/unmaps a student from the teacher's classroom.
 */
export const removeStudentFromClassroom = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;
  const studentId = req.params.studentId as string;
  if (!studentId) throw new ApiError(400, 'studentId is required');

  await prisma.teacherStudent.deleteMany({
    where: { teacherId, studentId },
  });

  res.status(200).json({ message: 'Student removed from your classroom' });
});
