import { Response } from 'express';
import prisma from '../prisma';
import { EmbeddingService } from '../services/embedding.service';
import { VectorService } from '../services/vector.service';
import { RetrievalService } from '../services/retrieval.service';
import { LlmService } from '../services/llm.service';
import { RagService } from '../services/rag.service';
import { AiFlashcardService } from '../services/aiFlashcard.service';
import { AuthRequest } from '../middleware/authenticate';
import { resolveStudentId } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

const embeddingService = new EmbeddingService();
const vectorService = new VectorService(embeddingService);
const retrievalService = new RetrievalService(vectorService);
const llmService = new LlmService();
const ragService = new RagService(retrievalService, llmService);
const flashcardService = new AiFlashcardService(ragService);

export const generateFlashcards = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { noteId, count = 5 } = req.body;
  const cards = await flashcardService.generateFlashcards({ studentId, noteId, count: Number(count) });
  const savedCards = await Promise.all(
    cards.map((card) =>
      prisma.flashcard.create({
        data: { question: card.question, answer: card.answer, topic: card.topic, type: card.type, noteId: noteId || null, studentId },
      }),
    ),
  );
  res.status(201).json({ message: 'Flashcards generated successfully', flashcards: savedCards });
});

export const getFlashcards = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const flashcards = await prisma.flashcard.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } });
  res.status(200).json({ flashcards });
});

export const updateFlashcard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const id = req.params.id as string;
  const { question, answer, topic, folderId } = req.body;
  throwIfMissing({ id });
  const existing = await prisma.flashcard.findFirst({ where: { id, studentId } });
  if (!existing) throw new ApiError(404, 'Flashcard not found or not owned by you');
  const updated = await prisma.flashcard.update({
    where: { id },
    data: {
      ...(question !== undefined && { question }),
      ...(answer !== undefined && { answer }),
      ...(topic !== undefined && { topic }),
      ...(folderId !== undefined && { folderId: folderId || null }),
    },
  });
  res.status(200).json({ message: 'Flashcard updated', flashcard: updated });
});

export const deleteFlashcard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const id = req.params.id as string;
  throwIfMissing({ id });
  const existing = await prisma.flashcard.findFirst({ where: { id, studentId } });
  if (!existing) throw new ApiError(404, 'Flashcard not found or not owned by you');
  await prisma.flashcard.delete({ where: { id } });
  res.status(200).json({ message: 'Flashcard deleted successfully' });
});
