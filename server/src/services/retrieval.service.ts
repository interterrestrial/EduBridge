import { Document } from '@langchain/core/documents';
import { VectorService } from './vector.service';

export class RetrievalService {
  private vectorService: VectorService;

  constructor(vectorService: VectorService) {
    this.vectorService = vectorService;
  }

  async retrieveRelevantContext(
    studentId: string,
    query: string,
    topK: number = 5,
    noteId?: string
  ): Promise<Document[]> {
    return await this.vectorService.search(studentId, query, topK, noteId);
  }
}
