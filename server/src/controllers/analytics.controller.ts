import { Request, Response } from 'express';
import prisma from '../prisma';
import { LlmService } from '../services/llm.service';
import { RecommendationService } from '../services/recommendation.service';
import { KnowledgeGapService } from '../services/knowledgeGap.service';

const llmService = new LlmService();
const recService = new RecommendationService(llmService);
const gapService = new KnowledgeGapService();

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

    const accuracies = attempts.map((a) => a.accuracy);
    const avgScore = accuracies.length > 0 ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;

    // Collect all weak topics
    const allWeakTopics = attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'));
    const uniqueWeakTopics = Array.from(new Set(allWeakTopics));

    res.status(200).json({
      studentId,
      masteryScore: avgScore,
      averageQuizScore: avgScore,
      quizzesTaken: attempts.length,
      flashcardsGenerated: flashcards,
      aiChatSessions: chats,
      weakTopics: uniqueWeakTopics,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch student analytics' });
  }
};

export const getTeacherInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      include: { quizAttempts: true },
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

    const avgMastery = totalStudents > 0 ? Math.round(totalAccuracySum / totalStudents) : 0;

    const insights = await recService.generateTeacherInsights({
      totalStudents: totalStudents || 10,
      activeStudents: activeStudentsCount || 8,
      averageMastery: avgMastery || 70,
      averageQuizScore: avgMastery || 70,
      topicAccuracies: [
        { topic: 'General Concepts', averageAccuracy: avgMastery || 70 },
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
