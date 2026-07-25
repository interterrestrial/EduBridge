import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { Document } from '@langchain/core/documents';
import path from 'path';
import fs from 'fs';
import { EmbeddingService } from './embedding.service';
import { AI_CONFIG } from '../config/ai.config';
import prisma from '../prisma';

export class VectorService {
  private embeddingService: EmbeddingService;

  constructor(embeddingService: EmbeddingService) {
    this.embeddingService = embeddingService;
  }

  private getIndexPath(studentId: string): string {
    return path.join(AI_CONFIG.VECTOR_DB_DIR, studentId);
  }

  async indexDocuments(studentId: string, chunks: Document[]): Promise<void> {
    if (chunks.length === 0) return;

    const indexPath = this.getIndexPath(studentId);

    if (!fs.existsSync(AI_CONFIG.VECTOR_DB_DIR)) {
      fs.mkdirSync(AI_CONFIG.VECTOR_DB_DIR, { recursive: true });
    }

    const indexFile = path.join(indexPath, 'faiss.index');

    let store: FaissStore | null = null;
    if (fs.existsSync(indexFile)) {
      store = await FaissStore.load(
        indexPath,
        this.embeddingService
      );
    }

    // Process in smaller batches to avoid silent API limit failures returning empty embeddings
    const batchSize = 10;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      // If store hasn't been loaded or initialized yet
      if (!store) {
        store = await FaissStore.fromDocuments(
          batch,
          this.embeddingService
        );
      } else {
        await store.addDocuments(batch);
      }
    }

    if (store) {
      await store.save(indexPath);
    }
  }

  async search(
    studentId: string,
    query: string,
    topK: number = AI_CONFIG.DEFAULT_TOP_K,
    noteId?: string,
    noteIds?: string[]
  ): Promise<Document[]> {
    const targetIds = new Set<string>([studentId]);

    try {
      if (noteId) {
        const note = await prisma.note.findUnique({ where: { id: noteId }, select: { studentId: true } });
        if (note) targetIds.add(note.studentId);
      } else if (noteIds && noteIds.length > 0) {
        const notes = await prisma.note.findMany({ where: { id: { in: noteIds } }, select: { studentId: true } });
        notes.forEach((n) => targetIds.add(n.studentId));
      } else {
        const [mappings, pushAsgns] = await Promise.all([
          prisma.teacherStudent.findMany({ where: { studentId }, select: { teacherId: true } }),
          prisma.teacherPushAssignment.findMany({ where: { studentId }, select: { teacherId: true } }),
        ]);
        mappings.forEach((m) => targetIds.add(m.teacherId));
        pushAsgns.forEach((p) => targetIds.add(p.teacherId));
      }
    } catch (dbErr) {
      console.warn('[VectorService] Could not fetch teacher mappings for vector search:', dbErr);
    }

    const allDocs: Document[] = [];

    for (const targetId of targetIds) {
      const indexPath = this.getIndexPath(targetId);
      const indexFile = path.join(indexPath, 'faiss.index');

      if (!fs.existsSync(indexFile)) {
        continue;
      }

      try {
        const store = await FaissStore.load(indexPath, this.embeddingService);
        let filter: ((doc: Document) => boolean) | undefined = undefined;

        if (noteIds && noteIds.length > 0) {
          const set = new Set(noteIds);
          filter = (doc: Document) => set.has(doc.metadata.documentId);
        } else if (noteId) {
          filter = (doc: Document) => doc.metadata.documentId === noteId;
        }

        const docs = await store.similaritySearch(query, topK, filter);
        allDocs.push(...docs);
      } catch (err: any) {
        console.warn(`[VectorService] FAISS similarity search warning for ${targetId}:`, err?.message || err);
      }
    }

    return allDocs.slice(0, topK);
  }

  async deleteStudentIndex(studentId: string): Promise<void> {
    const indexPath = this.getIndexPath(studentId);
    if (fs.existsSync(indexPath)) {
      fs.rmSync(indexPath, { recursive: true, force: true });
    }
  }
}
