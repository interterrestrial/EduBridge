import { Response } from 'express';
import prisma from '../prisma';
import { EmbeddingService } from '../services/embedding.service';
import { VectorService } from '../services/vector.service';
import { RetrievalService } from '../services/retrieval.service';
import { LlmService } from '../services/llm.service';
import { RagService } from '../services/rag.service';
import { AiChatService } from '../services/aiChat.service';
import { AiGroupingService } from '../services/aiGrouping.service';
import { AuthRequest } from '../middleware/authenticate';
import { resolveStudentId } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

const embeddingService = new EmbeddingService();
const vectorService = new VectorService(embeddingService);
const retrievalService = new RetrievalService(vectorService);
const llmService = new LlmService();
const ragService = new RagService(retrievalService, llmService);
const chatService = new AiChatService(ragService);
const groupingService = new AiGroupingService(llmService);

export const createSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { title = 'New Study Conversation' } = req.body;
  const session = await prisma.chatSession.create({ data: { studentId, title } });
  res.status(201).json({ session });
});

export const getSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const sessions = await prisma.chatSession.findMany({
    where: { studentId },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { messages: true } } },
  });
  res.status(200).json({ sessions });
});

export const getSessionMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sessionId = req.params.sessionId as string;
  throwIfMissing({ sessionId });
  // Ownership: ensure session belongs to caller
  const studentId = resolveStudentId(req);
  const session = await prisma.chatSession.findFirst({ where: { id: sessionId, studentId } });
  if (!session) throw new ApiError(404, 'Session not found or not owned by you');
  const messages = await prisma.chatMessage.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } });
  const formatted = messages.map((msg) => ({
    id: msg.id,
    question: msg.question,
    answer: msg.answer,
    sources: JSON.parse(msg.sourcesJson || '[]'),
    createdAt: msg.createdAt,
  }));
  res.status(200).json({ messages: formatted });
});

export const deleteSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sessionId = req.params.sessionId as string;
  throwIfMissing({ sessionId });
  const studentId = resolveStudentId(req);
  const session = await prisma.chatSession.findFirst({ where: { id: sessionId, studentId } });
  if (!session) throw new ApiError(404, 'Session not found or not owned by you');
  await prisma.chatSession.delete({ where: { id: sessionId } });
  res.status(200).json({ message: 'Chat session deleted successfully' });
});

export const chatTutor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { question, noteId, folderId, sessionId } = req.body;
  throwIfMissing({ question });

  let effectiveNoteId = noteId;
  let targetFolderNoteIds: string[] | undefined = undefined;

  if (folderId) {
    const folderNotes = await prisma.note.findMany({ where: { folderId, studentId }, select: { id: true } });
    targetFolderNoteIds = folderNotes.map((n) => n.id);
  }

  // Parse inline @Tag if present
  const tagMatch = question.match(/@([^\s@]+(?:\s+[^\s@]+)*)/);
  if (tagMatch && tagMatch[1] && !effectiveNoteId && !targetFolderNoteIds) {
    const tagQuery = tagMatch[1].trim();
    const matchedFolder = await prisma.noteFolder.findFirst({
      where: { studentId, name: { contains: tagQuery } },
      include: { notes: { select: { id: true } } },
    });
    if (matchedFolder && matchedFolder.notes.length > 0) {
      targetFolderNoteIds = matchedFolder.notes.map((n) => n.id);
    } else {
      const matchedNote = await prisma.note.findFirst({ where: { studentId, title: { contains: tagQuery } } });
      if (matchedNote) effectiveNoteId = matchedNote.id;
    }
  }

  let activeSessionId = sessionId;
  if (!activeSessionId) {
    const newSession = await prisma.chatSession.create({ data: { studentId, title: question.slice(0, 30) + '...' } });
    activeSessionId = newSession.id;
  } else {
    // Ownership: ensure the session belongs to the caller before writing into it
    const ownedSession = await prisma.chatSession.findFirst({ where: { id: activeSessionId, studentId } });
    if (!ownedSession) throw new ApiError(404, 'Session not found or not owned by you');
    await prisma.chatSession.update({ where: { id: activeSessionId }, data: { updatedAt: new Date() } }).catch(() => {});
  }

  const chatResponse = await chatService.askTutor(studentId, question, effectiveNoteId, targetFolderNoteIds);
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
  res.status(200).json({ id: message.id, sessionId: activeSessionId, answer: chatResponse.answer, sources: chatResponse.sources, createdAt: message.createdAt });
});

export const autoGroupItems = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { type } = req.body;
  throwIfMissing({ type });
  if (type !== 'notes' && type !== 'flashcards') throw new ApiError(400, 'Invalid type. Use "notes" or "flashcards"');

  if (type === 'notes') {
    const uncategorizedNotes = await prisma.note.findMany({ where: { studentId, folderId: null }, select: { id: true, title: true } });
    const folders = await prisma.noteFolder.findMany({ where: { studentId }, select: { id: true, name: true } });
    const itemsToGroup = uncategorizedNotes.map((n) => ({ id: n.id, title: n.title, contentSnippet: n.title }));
    const mapping = await groupingService.autoGroupItems(itemsToGroup, folders);
    for (const match of mapping) {
      if (match.folderId) {
        await prisma.note.update({ where: { id: match.itemId }, data: { folderId: match.folderId } });
      }
    }
    res.status(200).json({ message: 'Notes auto-grouped successfully', mapping });
  } else {
    const uncategorizedCards = await prisma.flashcard.findMany({ where: { studentId, folderId: null }, select: { id: true, topic: true, question: true } });
    const folders = await prisma.flashcardFolder.findMany({ where: { studentId }, select: { id: true, name: true } });
    const itemsToGroup = uncategorizedCards.map((c) => ({ id: c.id, title: c.topic || 'General Flashcard', contentSnippet: c.question || '' }));
    const mapping = await groupingService.autoGroupItems(itemsToGroup, folders);
    for (const match of mapping) {
      if (match.folderId) {
        await prisma.flashcard.update({ where: { id: match.itemId }, data: { folderId: match.folderId } });
      }
    }
    res.status(200).json({ message: 'Flashcards auto-grouped successfully', mapping });
  }
});
