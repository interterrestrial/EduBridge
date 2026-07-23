import { Request, Response } from 'express';
import prisma from '../prisma';
import { ExtractionService } from '../services/extraction.service';
import { ChunkingService } from '../services/chunking.service';
import { EmbeddingService } from '../services/embedding.service';
import { VectorService } from '../services/vector.service';
import path from 'path';

const extractionService = new ExtractionService();
const chunkingService = new ChunkingService();
const embeddingService = new EmbeddingService();
const vectorService = new VectorService(embeddingService);

export const uploadNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const { studentId, title } = req.body;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    if (!studentId) {
      res.status(400).json({ error: 'studentId is required' });
      return;
    }

    const noteTitle = title || file.originalname;

    // 1. Create DB Record
    const note = await prisma.note.create({
      data: {
        title: noteTitle,
        filePath: file.path,
        fileType: path.extname(file.originalname).toLowerCase(),
        studentId,
      },
    });

    // 2. AI Processing Pipeline: Extract -> Chunk -> Embed & Index into FAISS
    const rawDocs = await extractionService.extractFromFile(file.path);
    const chunks = await chunkingService.chunkDocuments(rawDocs, {
      studentId,
      documentId: note.id,
      documentTitle: note.title,
    });

    await vectorService.indexDocuments(studentId, chunks);

    res.status(201).json({
      message: 'Note uploaded and indexed successfully',
      note,
      chunkCount: chunks.length,
    });
  } catch (error: any) {
    console.error('Error uploading note:', error);
    res.status(500).json({ error: error.message || 'Failed to upload and index note' });
  }
};

export const getNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const notes = await prisma.note.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ notes });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch notes' });
  }
};
