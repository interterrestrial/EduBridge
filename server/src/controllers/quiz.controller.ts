import { Response } from 'express';
import prisma from '../prisma';
import { EmbeddingService } from '../services/embedding.service';
import { VectorService } from '../services/vector.service';
import { RetrievalService } from '../services/retrieval.service';
import { LlmService } from '../services/llm.service';
import { RagService } from '../services/rag.service';
import { AiQuizService } from '../services/aiQuiz.service';
import { EvaluationService } from '../services/evaluation.service';
import { AuthRequest } from '../middleware/authenticate';
import { resolveStudentId } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

const embeddingService = new EmbeddingService();
const vectorService = new VectorService(embeddingService);
const retrievalService = new RetrievalService(vectorService);
const llmService = new LlmService();
const ragService = new RagService(retrievalService, llmService);
const quizService = new AiQuizService(ragService);
const evalService = new EvaluationService();

export const generateQuiz = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { noteId, difficulty = 'medium', count = 5, title } = req.body;
  const questions = await quizService.generateQuiz({ studentId, noteId, difficulty, count: Number(count) });
  const quiz = await prisma.quiz.create({
    data: { title: title || `Quiz on ${difficulty} level`, difficulty, questionsJson: JSON.stringify(questions), noteId: noteId || null, studentId },
  });
  res.status(201).json({ id: quiz.id, title: quiz.title, difficulty: quiz.difficulty, questions, createdAt: quiz.createdAt });
});

export const submitQuiz = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { quizId, answers } = req.body;
  throwIfMissing({ quizId, answers });
  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      OR: [
        { studentId },
        { pushAssignments: { some: { studentId } } },
        { student: { studentsMapped: { some: { studentId } } } },
      ],
    },
  });
  if (!quiz) throw new ApiError(404, 'Quiz not found or not accessible to you');
  const questions = JSON.parse(quiz.questionsJson);
  const result = evalService.evaluateQuizAttempt({ quizId, studentId, answers }, questions);
  const attempt = await prisma.quizAttempt.create({
    data: { quizId, studentId, score: result.score, totalQuestions: result.totalQuestions, accuracy: result.accuracy, weakTopicsJson: JSON.stringify(result.weakTopics) },
  });
  res.status(200).json({ attemptId: attempt.id, score: result.score, totalQuestions: result.totalQuestions, accuracy: result.accuracy, evaluations: result.evaluations, weakTopics: result.weakTopics, strongTopics: result.strongTopics });
});

export const getQuizzes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  if (req.user?.role === 'teacher' && studentId === req.user.id) {
    const quizzes = await prisma.quiz.findMany({
      where: {
        OR: [
          { studentId: req.user.id },
          { student: { teachersMapped: { some: { teacherId: req.user.id } } } },
        ],
      },
      include: { attempts: true, student: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const formatted = quizzes.map((q) => ({ id: q.id, title: q.title, difficulty: q.difficulty, questions: JSON.parse(q.questionsJson), attemptCount: q.attempts.length, createdAt: q.createdAt, student: q.student }));
    return res.status(200).json({ quizzes: formatted });
  }
  const quizzes = await prisma.quiz.findMany({
    where: {
      OR: [
        { studentId },
        { pushAssignments: { some: { studentId } } },
        { student: { studentsMapped: { some: { studentId } } } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: { attempts: true, student: { select: { id: true, name: true, role: true } } },
  });
  const formatted = quizzes.map((q) => ({ id: q.id, title: q.title, difficulty: q.difficulty, questions: JSON.parse(q.questionsJson), attemptCount: q.attempts.length, createdAt: q.createdAt, student: q.student }));
  res.status(200).json({ quizzes: formatted });
});
