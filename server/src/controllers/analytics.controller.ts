import { Response } from 'express';
import prisma from '../prisma';
import { LlmService } from '../services/llm.service';
import { RecommendationService } from '../services/recommendation.service';
import { AuthRequest } from '../middleware/authenticate';
import { resolveStudentId } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';

const llmService = new LlmService();
const recService = new RecommendationService(llmService);

export const getStudentAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const [attempts, flashcards, profile, attendance, examScores] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { studentId },
      include: { quiz: { select: { id: true, title: true, difficulty: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.flashcard.findMany({ where: { studentId } }),
    prisma.studentProfile.findUnique({ where: { userId: studentId } }),
    prisma.attendanceRecord.findMany({ where: { studentId } }),
    prisma.examScore.findMany({
      where: { studentId },
      include: { exam: true },
      orderBy: { exam: { examDate: 'desc' } },
    }),
  ]);

  const accuracies = attempts.map((a) => a.accuracy);
  const quizAccuracy = accuracies.length ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;

  const examAverage = examScores.length > 0
    ? Math.round(examScores.reduce((acc, s) => acc + (s.marks / s.exam.maxMarks) * 100, 0) / examScores.length)
    : 0;

  const masteryScore = examScores.length > 0
    ? Math.round(0.6 * examAverage + 0.4 * quizAccuracy)
    : quizAccuracy;

  const readinessScore = Math.min(100, masteryScore + (flashcards.length * 2));
  const studyHours = profile?.totalStudyHours ?? 0;

  const presentCount = attendance.filter((r) => r.status === 'present').length;
  const attendancePct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  const badges = [
    { id: 'first_quiz', name: 'First Steps', earned: attempts.length >= 1, icon: '🎯', desc: 'Completed first quiz' },
    { id: 'ten_cards', name: 'Card Collector', earned: flashcards.length >= 10, icon: '🃏', desc: 'Created 10+ flashcards' },
    { id: 'quiz_master', name: 'Quiz Master', earned: attempts.length >= 5, icon: '🏆', desc: 'Completed 5+ quizzes' },
    { id: 'scholar', name: 'Scholar', earned: studyHours >= 20, icon: '📚', desc: 'Logged 20+ study hours' },
    { id: 'exam_ready', name: 'Exam Ready', earned: examScores.length >= 1 && examAverage >= 75, icon: '⭐', desc: 'Scored 75%+ on graded exams' },
  ];

  const weakTopics = Array.from(new Set(attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'))));

  // Compute real topic mastery from attempts and exams
  const topicMap: Record<string, { correct: number; total: number }> = {};
  attempts.forEach((attempt) => {
    const topicName = attempt.quiz?.title || 'General Practice';
    if (!topicMap[topicName]) topicMap[topicName] = { correct: 0, total: 0 };
    topicMap[topicName].total += 100;
    topicMap[topicName].correct += attempt.accuracy;
  });
  examScores.forEach((score) => {
    const topicName = score.exam.title || score.exam.subject || 'Exam Assessment';
    if (!topicMap[topicName]) topicMap[topicName] = { correct: 0, total: 0 };
    const pct = Math.round((score.marks / score.exam.maxMarks) * 100);
    topicMap[topicName].total += 100;
    topicMap[topicName].correct += pct;
  });

  const topicMastery = Object.entries(topicMap).map(([topic, data], idx) => {
    const pct = Math.round((data.correct / data.total) * 100);
    const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
    return { id: `tm_${idx}`, topic, score: `${pct}%`, color, rawScore: pct };
  });

  const formattedExams = examScores.map((s) => ({
    id: s.id,
    examId: s.examId,
    title: s.exam.title,
    subject: s.exam.subject,
    marks: s.marks,
    maxMarks: s.exam.maxMarks,
    percentage: Math.round((s.marks / s.exam.maxMarks) * 100),
    examDate: s.exam.examDate,
  }));

  res.status(200).json({
    readinessScore,
    attendancePct,
    studyHours,
    masteryScore,
    quizAccuracy,
    examAverage,
    badges,
    weakTopics,
    topicMastery,
    examScores: formattedExams,
  });
});

export const getTeacherInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') {
    res.status(403).json({ error: 'Forbidden: teacher role required' });
    return;
  }
  const teacherId = req.user.id;
  const students = await prisma.user.findMany({
    where: {
      role: 'student',
      teachersMapped: { some: { teacherId } },
    },
    include: {
      quizAttempts: true,
      studentProfile: true,
      examScores: { include: { exam: { select: { maxMarks: true } } } },
    },
  });

  let activeStudents = 0;
  const lowPerforming: { name: string; masteryScore: number; weakTopics: string[] }[] = [];
  students.forEach((student) => {
    if (student.quizAttempts.length > 0 || student.examScores.length > 0) activeStudents++;
    const accs = student.quizAttempts.map((a) => a.accuracy);
    const quizAccuracy = accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : 0;

    const examScores = student.examScores;
    const examPct = examScores.length > 0
      ? Math.round(examScores.reduce((acc, s) => acc + (s.marks / s.exam.maxMarks) * 100, 0) / examScores.length)
      : 0;

    const masteryScore = examScores.length > 0 ? Math.round(0.6 * examPct + 0.4 * quizAccuracy) : quizAccuracy;

    if (masteryScore < 60 && (student.quizAttempts.length > 0 || student.examScores.length > 0)) {
      lowPerforming.push({
        name: student.name,
        masteryScore,
        weakTopics: Array.from(new Set(student.quizAttempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]')))),
      });
    }
  });

  const avgMastery = students.length
    ? Math.round(students.reduce((acc, s) => {
        const accs = s.quizAttempts.map((a) => a.accuracy);
        const qAcc = accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : 0;
        const ePct = s.examScores.length > 0
          ? Math.round(s.examScores.reduce((sum, es) => sum + (es.marks / es.exam.maxMarks) * 100, 0) / s.examScores.length)
          : 0;
        const mScore = s.examScores.length > 0 ? Math.round(0.6 * ePct + 0.4 * qAcc) : qAcc;
        return acc + mScore;
      }, 0) / students.length)
    : 0;
  const weakTopics = Array.from(new Set(students.flatMap((s) => s.quizAttempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]')))));

  const summary = {
    totalStudents: students.length,
    activeStudents,
    averageMastery: avgMastery,
    averageQuizScore: avgMastery,
    topicAccuracies: [] as { topic: string; averageAccuracy: number }[],
    lowPerformingStudents: lowPerforming,
  };
  const insights = await recService.generateTeacherInsights(summary);
  res.status(200).json({ summary: { ...summary, weakTopics }, insights });
});
