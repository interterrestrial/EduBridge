import { Request, Response } from 'express';
import prisma from '../prisma';
import { EmbeddingService } from '../services/embedding.service';
import { VectorService } from '../services/vector.service';
import { RetrievalService } from '../services/retrieval.service';
import { LlmService } from '../services/llm.service';
import { RagService } from '../services/rag.service';
import { AiFlashcardService } from '../services/aiFlashcard.service';

const embeddingService = new EmbeddingService();
const vectorService = new VectorService(embeddingService);
const retrievalService = new RetrievalService(vectorService);
const llmService = new LlmService();
const ragService = new RagService(retrievalService, llmService);
const flashcardService = new AiFlashcardService(ragService);

export const generateFlashcards = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, noteId, count = 5 } = req.body;

    if (!studentId) {
      res.status(400).json({ error: 'studentId is required' });
      return;
    }

    const cards = await flashcardService.generateFlashcards({
      studentId,
      noteId,
      count: Number(count),
    });

    // Save flashcards to DB
    const savedCards = await Promise.all(
      cards.map((card) =>
        prisma.flashcard.create({
          data: {
            question: card.question,
            answer: card.answer,
            topic: card.topic,
            type: card.type,
            noteId: noteId || null,
            studentId,
          },
        })
      )
    );

    res.status(201).json({
      message: 'Flashcards generated successfully',
      flashcards: savedCards,
    });
  } catch (error: any) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({ error: error.message || 'Flashcard generation failed' });
  }
};

export const getFlashcards = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const flashcards = await prisma.flashcard.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ flashcards });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch flashcards' });
  }
};
