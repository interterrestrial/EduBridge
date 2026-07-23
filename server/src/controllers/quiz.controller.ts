import { Request, Response } from 'express';
import prisma from '../prisma';
import { EmbeddingService } from '../services/embedding.service';
import { VectorService } from '../services/vector.service';
import { RetrievalService } from '../services/retrieval.service';
import { LlmService } from '../services/llm.service';
import { RagService } from '../services/rag.service';
import { AiQuizService } from '../services/aiQuiz.service';
import { EvaluationService } from '../services/evaluation.service';
import { KnowledgeGapService } from '../services/knowledgeGap.service';

const embeddingService = new EmbeddingService();
const vectorService = new VectorService(embeddingService);
const retrievalService = new RetrievalService(vectorService);
const llmService = new LlmService();
const ragService = new RagService(retrievalService, llmService);
const quizService = new AiQuizService(ragService);
const evalService = new EvaluationService();
const gapService = new KnowledgeGapService();

export const generateQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, noteId, difficulty = 'medium', count = 5, title } = req.body;

    if (!studentId) {
      res.status(400).json({ error: 'studentId is required' });
      return;
    }

    const questions = await quizService.generateQuiz({
      studentId,
      noteId,
      difficulty,
      count: Number(count),
    });

    const quiz = await prisma.quiz.create({
      data: {
        title: title || `Quiz on ${difficulty} level`,
        difficulty,
        questionsJson: JSON.stringify(questions),
        noteId: noteId || null,
        studentId,
      },
    });

    res.status(201).json({
      id: quiz.id,
      title: quiz.title,
      difficulty: quiz.difficulty,
      questions,
      createdAt: quiz.createdAt,
    });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: error.message || 'Quiz generation failed' });
  }
};

export const submitQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quizId, studentId, answers } = req.body;

    if (!quizId || !studentId || !answers) {
      res.status(400).json({ error: 'quizId, studentId, and answers are required' });
      return;
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found' });
      return;
    }

    const questions = JSON.parse(quiz.questionsJson);
    const result = evalService.evaluateQuizAttempt({ quizId, studentId, answers }, questions);

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId,
        score: result.score,
        totalQuestions: result.totalQuestions,
        accuracy: result.accuracy,
        weakTopicsJson: JSON.stringify(result.weakTopics),
      },
    });

    res.status(200).json({
      attemptId: attempt.id,
      score: result.score,
      totalQuestions: result.totalQuestions,
      accuracy: result.accuracy,
      evaluations: result.evaluations,
      weakTopics: result.weakTopics,
      strongTopics: result.strongTopics,
    });
  } catch (error: any) {
    console.error('Error evaluating quiz attempt:', error);
    res.status(500).json({ error: error.message || 'Quiz evaluation failed' });
  }
};

export const getQuizzes = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const quizzes = await prisma.quiz.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: { attempts: true },
    });

    const formatted = quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      difficulty: q.difficulty,
      questions: JSON.parse(q.questionsJson),
      attemptCount: q.attempts.length,
      createdAt: q.createdAt,
    }));

    res.status(200).json({ quizzes: formatted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch quizzes' });
  }
};
