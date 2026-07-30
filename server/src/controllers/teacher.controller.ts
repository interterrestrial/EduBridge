import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authenticate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

/**
 * Normalize section string: trim and uppercase.
 * Returns null if blank.
 */
const normalizeSection = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed.toUpperCase() : null;
};

/**
 * Resolve the active (className, section) scope for a teacher.
 *
 * - Reads className + section from query params (preferred) or body.
 * - Normalizes section to uppercase.
 * - If both are present, validates the (className, section) pair exists in the
 *   teacher's enrollments — throws 400 otherwise.
 * - If neither is present, picks the first enrollment alphabetically
 *   (deterministic default).
 * - If the teacher has zero enrollments, returns null.
 */
const resolveScope = async (req: AuthRequest): Promise<{ className: string; section: string } | null> => {
  if (!req.user || req.user.role !== 'teacher') return null;
  const teacherId = req.user.id;

  const rawClass = (req.query.className ?? req.body?.className) as string | undefined;
  const rawSection = (req.query.section ?? req.body?.section) as string | undefined;
  const className = typeof rawClass === 'string' ? rawClass.trim() : '';
  const section = normalizeSection(rawSection);

  // If the client supplied scope, verify it belongs to this teacher
  if (className && section) {
    const exists = await prisma.teacherStudent.findFirst({
      where: { teacherId, className, section },
      select: { id: true },
    });
    if (!exists) throw new ApiError(400, `Invalid scope: no classroom matches ${className} • ${section}`);
    return { className, section };
  }

  // Default: first enrollment alphabetically
  const first = await prisma.teacherStudent.findFirst({
    where: { teacherId, className: { not: null }, section: { not: null } },
    orderBy: [{ className: 'asc' }, { section: 'asc' }],
    select: { className: true, section: true },
  });
  return first?.className && first?.section ? { className: first.className, section: first.section } : null;
};

export const getClassroomHeatmap = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;
  const scope = await resolveScope(req);

  // Find students enrolled in this scope
  const enrollments = await prisma.teacherStudent.findMany({
    where: {
      teacherId,
      ...(scope ? { className: scope.className, section: scope.section } : {}),
    },
    select: { studentId: true },
  });
  const scopedStudentIds = enrollments.map((e) => e.studentId);

  if (scopedStudentIds.length === 0) {
    return res.status(200).json({
      summary: { totalStudents: 0, averageClassMastery: 0, averageAttendance: 0, teacherId },
      heatmap: [],
      studentRoster: [],
      scope,
    });
  }

  const students = await prisma.user.findMany({
    where: {
      id: { in: scopedStudentIds },
      role: 'student',
    },
    include: {
      quizAttempts: true,
      attendance: true,
      studentProfile: true,
      examScores: { include: { exam: { select: { maxMarks: true, className: true, section: true } } } },
      teachersMapped: { where: { teacherId } },
    },
  });

  const topicAccuracyMap: Record<string, { correctSum: number; totalSum: number }> = {};
  const studentRoster = [];

  for (const student of students) {
    const attempts = student.quizAttempts;
    const accuracies = attempts.map((a) => a.accuracy);
    const quizAccuracy = accuracies.length > 0 ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;

    // Exam average percentage — scoped to exams matching the active (className, section),
    // plus any legacy/explicit "ALL classes" exams (className=null AND section=null).
    const examScores = student.examScores.filter((s) => {
      const ex = s.exam;
      if (scope) {
        // In scope OR explicit "all sections" for this class OR fully global
        if (ex.className === scope.className && ex.section === scope.section) return true;
        if (ex.className === scope.className && ex.section === null) return true;
        if (ex.className === null && ex.section === null) return true;
        return false;
      }
      return true; // no scope = include all
    });
    const mapping = student.teachersMapped?.[0];
    const calcExamAvg = examScores.length > 0
      ? Math.round(examScores.reduce((acc, s) => acc + (s.marks / s.exam.maxMarks) * 100, 0) / examScores.length)
      : 0;
    const effectiveExamAvg = mapping?.manualExamAvg ?? calcExamAvg;
    const hasExamData = (mapping?.manualExamAvg !== null && mapping?.manualExamAvg !== undefined) || examScores.length > 0;

    // Blended mastery: 60% exam + 40% quiz
    const masteryScore = hasExamData ? Math.round(0.6 * effectiveExamAvg + 0.4 * quizAccuracy) : quizAccuracy;

    // Gap: positive = high quiz practice but low exam (surface practice)
    const gap = quizAccuracy - effectiveExamAvg;
    const gapStatus = !hasExamData ? 'No Exam Data' : gap > 20 ? 'Surface Practice' : gap >= 0 ? 'Aligned' : 'Exam Strong';

    const presentCount = student.attendance.filter((r) => r.status === 'present').length;
    const attendancePct = student.attendance.length > 0 ? Math.round((presentCount / student.attendance.length) * 100) : 0;
    const weakTopics = Array.from(new Set(attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'))));

    studentRoster.push({
      id: student.id,
      name: student.name,
      email: student.email,
      studentCode: student.studentCode || '—',
      className: mapping?.className ?? 'Unassigned',
      section: mapping?.section ?? '—',
      quizAccuracy,
      examAverage: effectiveExamAvg,
      manualExamAvg: mapping?.manualExamAvg ?? null,
      masteryScore,
      gap,
      gapStatus,
      hasGapFlag: hasExamData && gap > 20,
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
    scope,
    heatmap,
    studentRoster,
  });
});

/**
 * List all distinct (className, section) pairs this teacher has enrollments for.
 * Used by the frontend scope selector.
 */
export const getTeacherScopes = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;

  const enrollments = await prisma.teacherStudent.findMany({
    where: { teacherId, className: { not: null }, section: { not: null } },
    select: { className: true, section: true },
    orderBy: [{ className: 'asc' }, { section: 'asc' }],
  });

  // Deduplicate
  const seen = new Set<string>();
  const scopes: { className: string; section: string }[] = [];
  for (const e of enrollments) {
    if (!e.className || !e.section) continue;
    const key = `${e.className}__${e.section}`;
    if (seen.has(key)) continue;
    seen.add(key);
    scopes.push({ className: e.className, section: e.section });
  }

  res.status(200).json({ scopes });
});

export const pushMaterialToStudent = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;
  const { studentId, title, noteId, quizId, dueDate } = req.body;
  throwIfMissing({ studentId, title });
  if (!noteId && !quizId) throw new ApiError(400, 'Either noteId or quizId is required');

  const scope = await resolveScope(req);

  if (studentId === 'ALL') {
    // Scope "ALL" pushes to students in the active (className, section)
    const scopedEnrollments = await prisma.teacherStudent.findMany({
      where: {
        teacherId,
        ...(scope ? { className: scope.className, section: scope.section } : {}),
      },
      select: { studentId: true },
    });
    const studentIds = scopedEnrollments.map((e) => e.studentId);
    if (studentIds.length === 0) throw new ApiError(404, 'No students in the active classroom section yet');

    const students = await prisma.user.findMany({ where: { id: { in: studentIds } } });

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
  const scope = await resolveScope(req);

  // Verify the student is enrolled in the active scope
  const scopedMapping = scope
    ? await prisma.teacherStudent.findFirst({ where: { teacherId, studentId, className: scope.className, section: scope.section } })
    : await prisma.teacherStudent.findFirst({ where: { teacherId, studentId } });
  if (!scopedMapping) throw new ApiError(404, 'Student not found in your active classroom section');

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
        include: { exam: { select: { id: true, title: true, maxMarks: true, examDate: true, className: true, section: true } } },
        orderBy: { exam: { examDate: 'desc' } },
      },
      teachersMapped: { where: { teacherId: req.user?.id } },
    },
  });

  if (!student) throw new ApiError(404, 'Student not found');

  const attempts = student.quizAttempts;
  const accuracies = attempts.map((a) => a.accuracy);
  const quizAccuracy = accuracies.length > 0 ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;
  const weakTopics = Array.from(new Set(attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'))));
  const presentCount = student.attendance.filter((r) => r.status === 'present').length;
  const attendancePct = student.attendance.length > 0 ? Math.round((presentCount / student.attendance.length) * 100) : 0;

  // Exam scores scoped to active (className, section) + legacy "ALL" exams
  const examScores = student.examScores.filter((s) => {
    const ex = s.exam;
    if (scope) {
      if (ex.className === scope.className && ex.section === scope.section) return true;
      if (ex.className === scope.className && ex.section === null) return true;
      if (ex.className === null && ex.section === null) return true;
      return false;
    }
    return true;
  });
  const calcExamAvg = examScores.length > 0
    ? Math.round(examScores.reduce((acc, s) => acc + (s.marks / s.exam.maxMarks) * 100, 0) / examScores.length)
    : 0;
  const examAverage = scopedMapping.manualExamAvg ?? calcExamAvg;
  const hasExamData = (scopedMapping.manualExamAvg !== null && scopedMapping.manualExamAvg !== undefined) || examScores.length > 0;

  // Blended mastery: 60% exam + 40% quiz (aligned with getClassroomHeatmap)
  const masteryScore = hasExamData ? Math.round(0.6 * examAverage + 0.4 * quizAccuracy) : quizAccuracy;

  // Gap indicator: positive gap = high quiz practice but low exam performance (surface practice)
  const gap = quizAccuracy - examAverage;
  const gapStatus = !hasExamData
    ? 'No Exam Data'
    : gap > 20 ? 'Surface Practice' : gap >= 0 ? 'Aligned' : 'Exam Strong';
  const hasGapFlag = hasExamData && gap > 20;

  res.status(200).json({
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      className: scopedMapping.className,
      section: scopedMapping.section,
      quizAccuracy,
      examAverage,
      manualExamAvg: scopedMapping.manualExamAvg ?? null,
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
        className: s.exam.className,
        section: s.exam.section,
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
 * Maps/enrolls a student into the teacher's classroom for a specific (className, section).
 */
export const addStudentToClassroom = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;
  const { studentId, email, studentCode, subject, className, section } = req.body;

  if (!studentId && !email && !studentCode) throw new ApiError(400, 'studentCode, email, or studentId is required');
  const trimmedClass = typeof className === 'string' ? className.trim() : '';
  const normalizedSection = normalizeSection(section);
  if (!trimmedClass) throw new ApiError(400, 'className is required (e.g. "6th", "7th", "10th")');
  if (!normalizedSection) throw new ApiError(400, 'section is required (e.g. "A", "B", "C")');

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
    where: { teacherId_studentId_className_section: { teacherId, studentId: targetId, className: trimmedClass, section: normalizedSection } as any },
    update: { subject: subjectStr },
    create: { teacherId, studentId: targetId, subject: subjectStr, className: trimmedClass, section: normalizedSection },
  });

  res.status(201).json({ message: `Student enrolled in ${trimmedClass} • ${normalizedSection}!`, mapping });
});

/**
 * Removes/unmaps a student from the teacher's classroom for a specific (className, section).
 */
export const removeStudentFromClassroom = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;
  const studentId = req.params.studentId as string;
  if (!studentId) throw new ApiError(400, 'studentId is required');

  const rawClass = (req.query.className ?? req.body?.className) as string | undefined;
  const rawSection = (req.query.section ?? req.body?.section) as string | undefined;
  const trimmedClass = typeof rawClass === 'string' ? rawClass.trim() : '';
  const normalizedSection = normalizeSection(rawSection);
  if (!trimmedClass || !normalizedSection) {
    throw new ApiError(400, 'className and section are required to remove a student');
  }

  const deleted = await prisma.teacherStudent.deleteMany({
    where: { teacherId, studentId, className: trimmedClass, section: normalizedSection },
  });

  if (deleted.count === 0) throw new ApiError(404, 'No matching classroom enrollment found');

  res.status(200).json({ message: `Student removed from ${trimmedClass} • ${normalizedSection}` });
});

/**
 * Updates a student's manual exam average override for the active (className, section) enrollment.
 */
export const updateStudentExamAvg = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;
  const studentId = req.params.studentId as string;
  const { examAverage } = req.body;

  const val = examAverage === null || examAverage === undefined || examAverage === '' ? null : Number(examAverage);
  if (val !== null && (isNaN(val) || val < 0 || val > 100)) {
    throw new ApiError(400, 'Exam average must be a valid number between 0 and 100');
  }

  const scope = await resolveScope(req);
  if (!scope) throw new ApiError(400, 'No active classroom section — cannot update exam average');

  // Update only the scoped enrollment's manualExamAvg
  const updated = await prisma.teacherStudent.updateMany({
    where: { teacherId, studentId, className: scope.className, section: scope.section },
    data: { manualExamAvg: val },
  });
  if (updated.count === 0) throw new ApiError(404, 'No matching classroom enrollment found');

  // Create notification for student
  if (val !== null) {
    try {
      await prisma.notification.create({
        data: {
          userId: studentId,
          title: 'Exam Average Updated',
          message: `Your teacher updated your Exam Average to ${val}% for ${scope.className} • ${scope.section}.`,
          type: 'EXAM_GRADED',
          link: '/progress',
        },
      });
    } catch (err) {
      console.error('Failed to notify student of exam average update:', err);
    }
  }

  res.status(200).json({ message: 'Student exam average updated successfully', examAverage: val, scope });
});
