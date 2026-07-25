import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authenticate';
import { resolveStudentId } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

// --- NOTE FOLDERS ---

export const createNoteFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { name, color } = req.body;
  throwIfMissing({ name });
  const folder = await prisma.noteFolder.create({
    data: { name, color: color || '#6366f1', studentId },
    include: { notes: true },
  });
  res.status(201).json({ message: 'Note folder created successfully', folder });
});

export const getNoteFolders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const folders = await prisma.noteFolder.findMany({
    where: { studentId },
    include: { notes: { select: { id: true, title: true, fileType: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ folders });
});

export const updateNoteFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const folderId = req.params.folderId as string;
  const { name, color } = req.body;
  throwIfMissing({ folderId });
  // Ownership check
  const existing = await prisma.noteFolder.findFirst({ where: { id: folderId, studentId } });
  if (!existing) throw new ApiError(404, 'Folder not found or not owned by you');
  const updated = await prisma.noteFolder.update({
    where: { id: folderId },
    data: { ...(name && { name }), ...(color && { color }) },
    include: { notes: true },
  });
  res.status(200).json({ message: 'Folder updated', folder: updated });
});

export const deleteNoteFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const folderId = req.params.folderId as string;
  throwIfMissing({ folderId });
  const existing = await prisma.noteFolder.findFirst({ where: { id: folderId, studentId } });
  if (!existing) throw new ApiError(404, 'Folder not found or not owned by you');
  // Schema onDelete: SetNull on Note.folderId, so notes become uncategorized (safe)
  await prisma.noteFolder.delete({ where: { id: folderId } });
  res.status(200).json({ message: 'Folder deleted; notes moved to uncategorized' });
});

export const moveNoteToFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const noteId = req.params.noteId as string;
  const { folderId } = req.body; // string or null to unassign
  throwIfMissing({ noteId });
  const note = await prisma.note.findFirst({ where: { id: noteId, studentId } });
  if (!note) throw new ApiError(404, 'Note not found or not owned by you');
  if (folderId) {
    const folder = await prisma.noteFolder.findFirst({ where: { id: folderId, studentId } });
    if (!folder) throw new ApiError(404, 'Target folder not found or not owned by you');
  }
  const updated = await prisma.note.update({
    where: { id: noteId },
    data: { folderId: folderId || null },
  });
  res.status(200).json({ message: 'Note folder updated successfully', note: updated });
});

// --- FLASHCARD FOLDERS / DECKS ---

export const createFlashcardFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { name, topic, noteId } = req.body;
  throwIfMissing({ name });
  const deck = await prisma.flashcardFolder.create({
    data: { name, topic: topic || 'General', studentId, noteId: noteId || null },
    include: { flashcards: true },
  });
  res.status(201).json({ message: 'Flashcard deck created successfully', deck });
});

export const getFlashcardFolders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const decks = await prisma.flashcardFolder.findMany({
    where: { studentId },
    include: { flashcards: true },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ decks });
});

export const updateFlashcardFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const folderId = req.params.folderId as string;
  const { name, topic } = req.body;
  throwIfMissing({ folderId });
  const existing = await prisma.flashcardFolder.findFirst({ where: { id: folderId, studentId } });
  if (!existing) throw new ApiError(404, 'Deck not found or not owned by you');
  const updated = await prisma.flashcardFolder.update({
    where: { id: folderId },
    data: { ...(name && { name }), ...(topic && { topic }) },
    include: { flashcards: true },
  });
  res.status(200).json({ message: 'Deck updated', deck: updated });
});

export const deleteFlashcardFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const folderId = req.params.folderId as string;
  throwIfMissing({ folderId });
  const existing = await prisma.flashcardFolder.findFirst({ where: { id: folderId, studentId } });
  if (!existing) throw new ApiError(404, 'Deck not found or not owned by you');
  await prisma.flashcardFolder.delete({ where: { id: folderId } });
  res.status(200).json({ message: 'Deck deleted; flashcards moved to uncategorized' });
});

export const moveFlashcardToFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const cardId = req.params.cardId as string;
  const { folderId } = req.body;
  throwIfMissing({ cardId });
  const card = await prisma.flashcard.findFirst({ where: { id: cardId, studentId } });
  if (!card) throw new ApiError(404, 'Flashcard not found or not owned by you');
  if (folderId) {
    const deck = await prisma.flashcardFolder.findFirst({ where: { id: folderId, studentId } });
    if (!deck) throw new ApiError(404, 'Target deck not found or not owned by you');
  }
  const updated = await prisma.flashcard.update({
    where: { id: cardId },
    data: { folderId: folderId || null },
  });
  res.status(200).json({ message: 'Flashcard moved to deck successfully', flashcard: updated });
});
