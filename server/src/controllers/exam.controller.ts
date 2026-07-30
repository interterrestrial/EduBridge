import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authenticate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

/**
 * Create a new exam.
 * POST /api/teacher/exams
 *
 * Body: { title, subject, maxMarks, examDate, className?, section?, allClasses? }
 * - Either (className + section) are required OR allClasses=true.
 */
export const createExam = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;
  const { title, subject, maxMarks, examDate, className, section, allClasses } = req.body;
  throwIfMissing({ title, subject, maxMarks, examDate });

  let resolvedClass: string | null = null;
  let resolvedSection: string | null = null;
  if (allClasses === true) {
    resolvedClass = null;
    resolvedSection = null;
  } else {
    const trimmedClass = typeof className === 'string' ? className.trim() : '';
    const trimmedSection = typeof section === 'string' ? section.trim().toUpperCase() : '';
    if (!trimmedClass || !trimmedSection) {
      throw new ApiError(400, 'className and section are required (or set allClasses: true)');
    }
    // Verify the teacher actually has an enrollment in that (className, section)
    const exists = await prisma.teacherStudent.findFirst({
      where: { teacherId, className: trimmedClass, section: trimmedSection },
      select: { id: true },
    });
    if (!exists) throw new ApiError(400, `Invalid scope: no classroom matches ${trimmedClass} • ${trimmedSection}`);
    resolvedClass = trimmedClass;
    resolvedSection = trimmedSection;
  }

  const exam = await prisma.exam.create({
    data: {
      title,
      subject,
      maxMarks: Number(maxMarks),
      examDate,
      className: resolvedClass,
      section: resolvedSection,
      teacherId,
    },
  });

  res.status(201).json({ message: 'Exam created successfully', exam });
});

/**
 * List all exams created by this teacher, with score stats.
 * Optional query: ?className=&section= scopes to that section + global exams.
 * GET /api/teacher/exams
 */
export const getExams = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;

  const rawClass = req.query.className as string | undefined;
  const rawSection = req.query.section as string | undefined;
  const hasScope = typeof rawClass === 'string' && rawClass.trim() && typeof rawSection === 'string' && rawSection.trim();
  const scopeClass = hasScope ? rawClass.trim() : null;
  const scopeSection = hasScope ? rawSection.trim().toUpperCase() : null;

  const exams = await prisma.exam.findMany({
    where: {
      teacherId,
      ...(hasScope
        ? {
            OR: [
              { className: scopeClass, section: scopeSection },
              { className: scopeClass, section: null },
              { className: null, section: null },
            ],
          }
        : {}),
    },
    include: {
      scores: {
        select: { id: true, studentId: true, marks: true },
      },
    },
    orderBy: { examDate: 'desc' },
  });

  const formatted = exams.map((exam) => {
    const scoreCount = exam.scores.length;
    const avgPct = scoreCount > 0
      ? Math.round(exam.scores.reduce((acc, s) => acc + (s.marks / exam.maxMarks) * 100, 0) / scoreCount)
      : 0;
    return {
      id: exam.id,
      title: exam.title,
      subject: exam.subject,
      className: exam.className,
      section: exam.section,
      scopeLabel: exam.className && exam.section
        ? `${exam.className} • ${exam.section}`
        : 'All Classes',
      maxMarks: exam.maxMarks,
      examDate: exam.examDate,
      createdAt: exam.createdAt,
      scoreCount,
      classAveragePct: avgPct,
    };
  });

  res.status(200).json({ exams: formatted });
});

/**
 * Get one exam with all student scores.
 * GET /api/teacher/exams/:examId
 */
export const getExam = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const examId = req.params.examId as string;
  throwIfMissing({ examId });

  const teacherId = req.user.id;
  const exam = await prisma.exam.findFirst({
    where: { id: examId, teacherId },
    include: {
      scores: true,
    },
  });
  if (!exam) throw new ApiError(404, 'Exam not found or not owned by you');

  // Determine which students to show: only those in the exam's (className, section) scope
  // - If exam.className=null AND section=null → "All classes" — show all teacher's students
  // - If exam.className=X AND section=null → "all sections of X" — show X enrollments
  // - If exam.className=X AND section=Y → only X • Y enrollments
  const enrollmentWhere: any = { teacherId };
  if (exam.className && exam.section) {
    enrollmentWhere.className = exam.className;
    enrollmentWhere.section = exam.section;
  } else if (exam.className && !exam.section) {
    enrollmentWhere.className = exam.className;
  }
  const enrollments = await prisma.teacherStudent.findMany({
    where: enrollmentWhere,
    select: { studentId: true },
  });
  const scopedStudentIds = enrollments.map((e) => e.studentId);

  const students = scopedStudentIds.length === 0
    ? []
    : await prisma.user.findMany({
        where: { id: { in: scopedStudentIds }, role: 'student' },
        select: { id: true, name: true, email: true, studentCode: true },
        orderBy: { name: 'asc' },
      });

  const scoreMap = new Map(exam.scores.map((s) => [s.studentId, s]));

  const studentsWithScores = students.map((student) => {
    const score = scoreMap.get(student.id);
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      studentCode: student.studentCode || '—',
      marks: score?.marks ?? null,
      percentage: score ? Math.round((score.marks / exam.maxMarks) * 100) : null,
    };
  });

  res.status(200).json({
    exam: {
      id: exam.id,
      title: exam.title,
      subject: exam.subject,
      maxMarks: exam.maxMarks,
      examDate: exam.examDate,
      createdAt: exam.createdAt,
    },
    students: studentsWithScores,
  });
});

/**
 * Bulk-save scores for an exam.
 * PUT /api/teacher/exams/:examId/scores
 * Body: { scores: [{ studentId, marks }] }
 */
export const saveScores = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const examId = req.params.examId as string;
  const { scores } = req.body;
  throwIfMissing({ examId, scores });

  // Verify the exam belongs to this teacher
  const exam = await prisma.exam.findFirst({ where: { id: examId, teacherId: req.user.id } });
  if (!exam) throw new ApiError(404, 'Exam not found or not owned by you');

  // Upsert each score (create or update)
  for (const entry of scores) {
    const { studentId, marks } = entry;
    if (!studentId || marks === undefined || marks === null) continue;

    const numericMarks = Number(marks);
    if (isNaN(numericMarks)) continue;
    const clampedMarks = Math.max(0, Math.min(numericMarks, exam.maxMarks));

    await prisma.examScore.upsert({
      where: { examId_studentId: { examId, studentId } },
      update: { marks: clampedMarks },
      create: { examId, studentId, marks: clampedMarks },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: studentId,
          title: 'Exam Graded',
          message: `Your teacher posted your score for "${exam.title}": ${clampedMarks}/${exam.maxMarks} marks!`,
          type: 'EXAM_GRADED',
          link: '/progress',
        },
      });
    } catch (e) {}
  }

  res.status(200).json({ message: 'Scores saved successfully' });
});

/**
 * Edit one student's score (for individual corrections).
 * PATCH /api/teacher/exams/:examId/scores/:studentId
 * Body: { marks: number }
 */
export const editScore = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const examId = req.params.examId as string;
  const studentId = req.params.studentId as string;
  const { marks } = req.body;
  throwIfMissing({ examId, studentId, marks });

  const exam = await prisma.exam.findFirst({ where: { id: examId, teacherId: req.user.id } });
  if (!exam) throw new ApiError(404, 'Exam not found or not owned by you');

  const clampedMarks = Math.max(0, Math.min(Number(marks), exam.maxMarks));

  const score = await prisma.examScore.upsert({
    where: { examId_studentId: { examId, studentId } },
    update: { marks: clampedMarks },
    create: { examId, studentId, marks: clampedMarks },
  });

  try {
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: 'Exam Score Updated',
        message: `Your teacher updated your score for "${exam.title}": ${clampedMarks}/${exam.maxMarks} marks!`,
        type: 'EXAM_GRADED',
        link: '/progress',
      },
    });
  } catch (e) {}

  res.status(200).json({ message: 'Score updated', score: { ...score, percentage: Math.round((score.marks / exam.maxMarks) * 100) } });
});

/**
 * Delete an exam (cascades all scores).
 * DELETE /api/teacher/exams/:examId
 */
export const deleteExam = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const examId = req.params.examId as string;
  throwIfMissing({ examId });

  const exam = await prisma.exam.findFirst({ where: { id: examId, teacherId: req.user.id } });
  if (!exam) throw new ApiError(404, 'Exam not found or not owned by you');

  await prisma.exam.delete({ where: { id: examId } });
  res.status(200).json({ message: 'Exam deleted successfully' });
});
