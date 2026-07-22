import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { AI_CONFIG } from '../config/ai.config';

export class EmbeddingService {
  private embeddings: GoogleGenerativeAIEmbeddings;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || 'dummy_key_for_test';
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: apiKey,
      model: AI_CONFIG.EMBEDDING_MODEL,
    });
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return await this.embeddings.embedDocuments(texts);
  }

  async embedQuery(query: string): Promise<number[]> {
    return await this.embeddings.embedQuery(query);
  }

  getModel(): GoogleGenerativeAIEmbeddings {
    return this.embeddings;
  }
}
