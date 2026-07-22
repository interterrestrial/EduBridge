import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import { AI_CONFIG } from '../config/ai.config';

export class ChunkingService {
  private splitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: AI_CONFIG.CHUNK_SIZE * 4, // approx char count (1 token ~= 4 chars)
      chunkOverlap: AI_CONFIG.CHUNK_OVERLAP * 4,
      separators: ['\n\n', '\n', '. ', ' ', ''],
    });
  }

  async chunkDocuments(
    documents: Document[],
    baseMetadata: { studentId: string; documentId: string; documentTitle: string }
  ): Promise<Document[]> {
    const splitDocs = await this.splitter.splitDocuments(documents);

    return splitDocs.map((doc, index) => ({
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        chunkId: `${baseMetadata.documentId}_chunk_${index}`,
        studentId: baseMetadata.studentId,
        documentId: baseMetadata.documentId,
        documentTitle: baseMetadata.documentTitle,
        chunkIndex: index,
        pageNumber: doc.metadata?.loc?.pageNumber || doc.metadata?.page || 1,
      },
    }));
  }
}
