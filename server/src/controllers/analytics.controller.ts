import { Request, Response } from 'express';
import prisma from '../prisma';
import { LlmService } from '../services/llm.service';
import { RecommendationService } from '../services/recommendation.service';

const llmService = new LlmService();
const recService = new RecommendationService(llmService);

export const getStudentAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;

    const attempts = await prisma.quizAttempt.findMany({
      where: { studentId },
    });

    const flashcards = await prisma.flashcard.count({
      where: { studentId },
    });

    const chats = await prisma.chatMessage.count({
      where: { studentId },
    });

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { studentId },
    });

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
    });

    const accuracies = attempts.map((a) => a.accuracy);
    const avgScore = accuracies.length > 0 ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 75;

    // Attendance calculation
    const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
    const attendancePct = attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 90;

    // Collect all weak topics
    const allWeakTopics = attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'));
    const uniqueWeakTopics = Array.from(new Set(allWeakTopics));

    // Calculate Gamified Badges
    const badges = [];
    if (attempts.length >= 1) badges.push({ id: 'badge_1', title: 'Quiz Novice', icon: '🎯', desc: 'Completed first quiz' });
    if (avgScore >= 80) badges.push({ id: 'badge_2', title: 'Algorithm Master', icon: '⚡', desc: 'Maintained 80%+ quiz accuracy' });
    if (flashcards >= 5) badges.push({ id: 'badge_3', title: 'Recall Scholar', icon: '🧠', desc: 'Generated 5+ active recall cards' });
    if (attendancePct >= 85) badges.push({ id: 'badge_4', title: 'Punctual Scholar', icon: '⭐', desc: 'Maintained 85%+ attendance' });

    // Exam Readiness Score calculation
    const readinessScore = Math.min(100, Math.round(avgScore * 0.6 + attendancePct * 0.3 + (attempts.length > 0 ? 10 : 0)));

    res.status(200).json({
      studentId,
      masteryScore: avgScore,
      averageQuizScore: avgScore,
      attendancePct,
      readinessScore,
      studyHours: studentProfile?.totalStudyHours || 24,
      quizzesTaken: attempts.length,
      flashcardsGenerated: flashcards,
      aiChatSessions: chats,
      weakTopics: uniqueWeakTopics.length > 0 ? uniqueWeakTopics : ['Graph Traversal', 'ACID Isolation'],
      badges,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch student analytics' });
  }
};

export const getTeacherInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      include: { quizAttempts: true, attendance: true },
    });

    const totalStudents = students.length;
    let totalAccuracySum = 0;
    let activeStudentsCount = 0;
    const lowPerforming: { name: string; masteryScore: number; weakTopics: string[] }[] = [];

    students.forEach((student) => {
      if (student.quizAttempts.length > 0) activeStudentsCount++;
      const studentAccs = student.quizAttempts.map((a) => a.accuracy);
      const avg = studentAccs.length > 0 ? Math.round(studentAccs.reduce((a, b) => a + b, 0) / studentAccs.length) : 0;
      totalAccuracySum += avg;

      const weakTopics = Array.from(new Set(student.quizAttempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'))));

      if (avg < 60 && student.quizAttempts.length > 0) {
        lowPerforming.push({
          name: student.name,
          masteryScore: avg,
          weakTopics,
        });
      }
    });

    const avgMastery = totalStudents > 0 ? Math.round(totalAccuracySum / totalStudents) : 75;

    const insights = await recService.generateTeacherInsights({
      totalStudents: totalStudents || 10,
      activeStudents: activeStudentsCount || 8,
      averageMastery: avgMastery,
      averageQuizScore: avgMastery,
      topicAccuracies: [
        { topic: 'Relational Database Basics', averageAccuracy: 90 },
        { topic: 'Normalization', averageAccuracy: 78 },
        { topic: 'ACID Isolation Levels', averageAccuracy: 45 },
      ],
      lowPerformingStudents: lowPerforming,
    });

    res.status(200).json({
      summary: {
        totalStudents,
        activeStudents: activeStudentsCount,
        averageMastery: avgMastery,
      },
      insights,
    });
  } catch (error: any) {
    console.error('Error generating teacher insights:', error);
    res.status(500).json({ error: error.message || 'Failed to generate teacher insights' });
  }
};
