import { Response } from 'express';
import fs from 'fs';
import prisma from '../prisma';
import { ExtractionService } from '../services/extraction.service';
import { ChunkingService } from '../services/chunking.service';
import { EmbeddingService } from '../services/embedding.service';
import { VectorService } from '../services/vector.service';
import path from 'path';
import { AuthRequest } from '../middleware/authenticate';
import { resolveStudentId } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

const extractionService = new ExtractionService();
const chunkingService = new ChunkingService();
const embeddingService = new EmbeddingService();
const vectorService = new VectorService(embeddingService);

export const uploadNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  const studentId = resolveStudentId(req);
  const { title, folderId } = req.body;
  if (!file) throw new ApiError(400, 'No file uploaded');

  const noteTitle = title || file.originalname;
  const note = await prisma.note.create({
    data: {
      title: noteTitle,
      filePath: file.path,
      fileType: path.extname(file.originalname).toLowerCase(),
      studentId,
      folderId: folderId || null,
    },
    include: { folder: true },
  });

  const rawDocs = await extractionService.extractFromFile(file.path);
  const chunks = await chunkingService.chunkDocuments(rawDocs, {
    studentId,
    documentId: note.id,
    documentTitle: note.title,
  });
  await vectorService.indexDocuments(studentId, chunks);

  res.status(201).json({ message: 'Note uploaded and indexed successfully', note, chunkCount: chunks.length });
});

export const getNotes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  if (req.user?.role === 'teacher' && studentId === req.user.id) {
    const notes = await prisma.note.findMany({
      where: {
        OR: [
          { studentId: req.user.id },
          { student: { teachersMapped: { some: { teacherId: req.user.id } } } },
        ],
      },
      include: { folder: true, student: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ notes });
  }
  const notes = await prisma.note.findMany({
    where: { studentId },
    include: { folder: true, student: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ notes });
});

export const deleteNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const noteId = req.params.noteId as string;
  throwIfMissing({ noteId });
  const note = await prisma.note.findFirst({ where: { id: noteId, studentId } });
  if (!note) throw new ApiError(404, 'Note not found or not owned by you');
  // Best-effort delete the uploaded file from disk
  if (note.filePath) {
    fs.promises.unlink(note.filePath).catch(() => {});
  }
  // NOTE: vector deletion is out of scope here (FAISS doesn't support deletion cleanly);
  // a follow-up task will handle re-indexing. We delete the DB row only.
  await prisma.note.delete({ where: { id: noteId } });
  res.status(200).json({ message: 'Note deleted successfully' });
});
