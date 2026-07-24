import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { Document } from '@langchain/core/documents';
import path from 'path';
import fs from 'fs';
import { EmbeddingService } from './embedding.service';
import { AI_CONFIG } from '../config/ai.config';

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
    noteId?: string
  ): Promise<Document[]> {
    const indexPath = this.getIndexPath(studentId);
    const indexFile = path.join(indexPath, 'faiss.index');

    if (!fs.existsSync(indexFile)) {
      return [];
    }

    const store = await FaissStore.load(
      indexPath,
      this.embeddingService
    );

    const filter = noteId ? (doc: Document) => doc.metadata.documentId === noteId : undefined;
    return await store.similaritySearch(query, topK, filter);
  }

  async deleteStudentIndex(studentId: string): Promise<void> {
    const indexPath = this.getIndexPath(studentId);
    if (fs.existsSync(indexPath)) {
      fs.rmSync(indexPath, { recursive: true, force: true });
    }
  }
}
