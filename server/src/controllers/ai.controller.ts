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

export const createSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, title = 'New Study Conversation' } = req.body;
    if (!studentId) {
      res.status(400).json({ error: 'studentId is required' });
      return;
    }

    const session = await prisma.chatSession.create({
      data: {
        studentId,
        title,
      },
    });

    res.status(201).json({ session });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create chat session' });
  }
};

export const getSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const sessions = await prisma.chatSession.findMany({
      where: { studentId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
    });

    res.status(200).json({ sessions });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch chat sessions' });
  }
};

export const getSessionMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.sessionId as string;
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    const formatted = messages.map((msg) => ({
      id: msg.id,
      question: msg.question,
      answer: msg.answer,
      sources: JSON.parse(msg.sourcesJson || '[]'),
      createdAt: msg.createdAt,
    }));

    res.status(200).json({ messages: formatted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch session messages' });
  }
};

export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.sessionId as string;
    await prisma.chatSession.delete({
      where: { id: sessionId },
    });
    res.status(200).json({ message: 'Chat session deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete chat session' });
  }
};

export const chatTutor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, question, noteId, sessionId } = req.body;

    if (!studentId || !question) {
      res.status(400).json({ error: 'studentId and question are required' });
      return;
    }

    let effectiveNoteId = noteId;

    // Parse inline @Document tags if present (e.g. "@Database Systems What is 3NF?")
    const tagMatch = question.match(/@([^\s@]+(?:\s+[^\s@]+)*)/);
    if (tagMatch && tagMatch[1]) {
      const tagQuery = tagMatch[1].trim();
      const matchedNote = await prisma.note.findFirst({
        where: {
          studentId,
          title: { contains: tagQuery },
        },
      });
      if (matchedNote) {
        effectiveNoteId = matchedNote.id;
      }
    }

    // Ensure a chat session exists
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const newSession = await prisma.chatSession.create({
        data: {
          studentId,
          title: question.slice(0, 30) + '...',
        },
      });
      activeSessionId = newSession.id;
    } else {
      // Update session timestamp
      await prisma.chatSession.update({
        where: { id: activeSessionId },
        data: { updatedAt: new Date() },
      }).catch(() => {});
    }

    // 1. Execute RAG AI query
    const chatResponse = await chatService.askTutor(studentId, question, effectiveNoteId);

    // 2. Save Message to Database
    const message = await prisma.chatMessage.create({
      data: {
        studentId,
        sessionId: activeSessionId,
        noteId: effectiveNoteId || null,
        question,
        answer: chatResponse.answer,
        sourcesJson: JSON.stringify(chatResponse.sources),
      },
    });

    res.status(200).json({
      id: message.id,
      sessionId: activeSessionId,
      answer: chatResponse.answer,
      sources: chatResponse.sources,
      createdAt: message.createdAt,
    });
  } catch (error: any) {
    console.error('Error in AI Chat:', error);
    res.status(500).json({ error: error.message || 'AI Chat failed' });
  }
};
