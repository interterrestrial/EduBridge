import { Request, Response } from 'express';
import prisma from '../prisma';
import { EmbeddingService } from '../services/embedding.service';
import { VectorService } from '../services/vector.service';
import { RetrievalService } from '../services/retrieval.service';
import { LlmService } from '../services/llm.service';
import { RagService } from '../services/rag.service';
import { AiChatService } from '../services/aiChat.service';

const embeddingService = new EmbeddingService();
const vectorService = new VectorService(embeddingService);
const retrievalService = new RetrievalService(vectorService);
const llmService = new LlmService();
const ragService = new RagService(retrievalService, llmService);
const chatService = new AiChatService(ragService);

export const chatTutor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, question, noteId } = req.body;

    if (!studentId || !question) {
      res.status(400).json({ error: 'studentId and question are required' });
      return;
    }

    // 1. Get RAG AI response
    const chatResponse = await chatService.askTutor(studentId, question, noteId);

    // 2. Persist Chat Message in Database
    const message = await prisma.chatMessage.create({
      data: {
        studentId,
        noteId: noteId || null,
        question,
        answer: chatResponse.answer,
        sourcesJson: JSON.stringify(chatResponse.sources),
      },
    });

    res.status(200).json({
      id: message.id,
      answer: chatResponse.answer,
      sources: chatResponse.sources,
      createdAt: message.createdAt,
    });
  } catch (error: any) {
    console.error('Error in AI Chat:', error);
    res.status(500).json({ error: error.message || 'AI Chat failed' });
  }
};

export const getChatHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const history = await prisma.chatMessage.findMany({
      where: { studentId },
      orderBy: { createdAt: 'asc' },
    });

    const formatted = history.map((msg) => ({
      id: msg.id,
      question: msg.question,
      answer: msg.answer,
      sources: JSON.parse(msg.sourcesJson || '[]'),
      createdAt: msg.createdAt,
    }));

    res.status(200).json({ history: formatted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch chat history' });
  }
};
