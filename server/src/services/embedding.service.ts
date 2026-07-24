import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Embeddings } from '@langchain/core/embeddings';
import { AI_CONFIG } from '../config/ai.config';

export class EmbeddingService extends Embeddings {
  private embeddings: GoogleGenerativeAIEmbeddings;

  constructor() {
    super({});
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || 'dummy_key_for_test';
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: apiKey,
      model: AI_CONFIG.EMBEDDING_MODEL,
    });
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const allEmbeddings: number[][] = [];
    // Small batches to avoid API limits throwing silent 0-dimension vectors
    const batchSize = 10;
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      let batchRes: number[][] = [];
      let retries = 3;
      
      while (retries > 0) {
        try {
          batchRes = await this.embeddings.embedDocuments(batch);
          // Check if any returned vector is empty (which happens on silent rate limit fails)
          if (batchRes.some(v => !v || v.length === 0)) {
            throw new Error('API returned empty vectors. Possible rate limit hit.');
          }
          break; // Success
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          console.warn(`Embedding failed, retrying... (${retries} attempts left)`);
          await new Promise(res => setTimeout(res, 2000));
        }
      }
      
      allEmbeddings.push(...batchRes);
    }
    
    return allEmbeddings;
  }

  async embedQuery(query: string): Promise<number[]> {
    return await this.embeddings.embedQuery(query);
  }

  getModel(): GoogleGenerativeAIEmbeddings {
    return this.embeddings;
  }
}
