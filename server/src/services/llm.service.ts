import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AI_CONFIG } from '../config/ai.config';

export class LlmService {
  private model: ChatGoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || 'dummy_key_for_test';
    this.model = new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      model: AI_CONFIG.LLM_MODEL,
      temperature: 0.2, // low temp for educational accuracy
    });
  }

  async generate(prompt: string): Promise<string> {
    const response = await this.model.invoke(prompt);
    return typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);
  }

  getModel(): ChatGoogleGenerativeAI {
    return this.model;
  }
}
