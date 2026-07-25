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
  const [attempts, flashcards, profile] = await Promise.all([
    prisma.quizAttempt.findMany({ where: { studentId } }),
    prisma.flashcard.findMany({ where: { studentId } }),
    prisma.studentProfile.findUnique({ where: { userId: studentId } }),
  ]);

  const accuracies = attempts.map((a) => a.accuracy);
  const avgAccuracy = accuracies.length ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;
  const masteryScore = avgAccuracy;
  const readinessScore = Math.min(100, masteryScore + (flashcards.length * 2));
  const studyHours = profile?.totalStudyHours ?? 0;

  const badges = [
    { id: 'first_quiz', name: 'First Steps', earned: attempts.length >= 1, icon: '🎯' },
    { id: 'ten_cards', name: 'Card Collector', earned: flashcards.length >= 10, icon: '🃏' },
    { id: 'quiz_master', name: 'Quiz Master', earned: attempts.length >= 5, icon: '🏆' },
    { id: 'scholar', name: 'Scholar', earned: studyHours >= 20, icon: '📚' },
  ];

  const weakTopics = Array.from(new Set(attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'))));

  res.status(200).json({
    readinessScore,
    attendancePct: 100,
    studyHours,
    masteryScore,
    badges,
    weakTopics,
  });
});

export const getTeacherInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Reserved for teacher role; route-level guard handles authorization.
  const students = await prisma.user.findMany({
    where: { role: 'student' },
    include: { quizAttempts: true, studentProfile: true },
  });

  let activeStudents = 0;
  const lowPerforming: { name: string; masteryScore: number; weakTopics: string[] }[] = [];
  students.forEach((student) => {
    if (student.quizAttempts.length > 0) activeStudents++;
    const accs = student.quizAttempts.map((a) => a.accuracy);
    const avg = accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : 0;
    if (avg < 60 && student.quizAttempts.length > 0) {
      lowPerforming.push({
        name: student.name,
        masteryScore: avg,
        weakTopics: Array.from(new Set(student.quizAttempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]')))),
      });
    }
  });

  const avgMastery = students.length
    ? Math.round(students.reduce((acc, s) => acc + (s.quizAttempts.length ? s.quizAttempts.reduce((x, a) => x + a.accuracy, 0) / s.quizAttempts.length : 0), 0) / students.length)
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
