import Groq from 'groq-sdk';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AI_CONFIG } from '../config/ai.config';
import { TUTOR_SYSTEM_PROMPT } from '../prompts/tutor.prompt';

export class LlmService {
  private currentKeyIndex = 0;
  private geminiModel: ChatGoogleGenerativeAI;

  // Preferred Groq models in order of reasoning performance & availability
  private primaryGroqModel = 'llama-3.3-70b-versatile';
  private fallbackGroqModel = 'llama-3.1-8b-instant';

  constructor() {
    // Initialize Gemini as secondary fallback
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || 'dummy_key_for_test';
    this.geminiModel = new ChatGoogleGenerativeAI({
      apiKey: geminiKey,
      model: AI_CONFIG.LLM_MODEL,
      temperature: 0.2,
    });
  }

  private getGroqKeys(): string[] {
    const rawKeys = [
      process.env.GROQ_API_KEY_1,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
      process.env.GROQ_API_KEY_4,
      process.env.GROQ_API_KEY_5,
      process.env.GROQ_API_KEY_6,
      process.env.GROQ_API_KEY,
    ];

    return rawKeys.filter(
      (k): k is string => typeof k === 'string' && k.trim().length > 0 && !k.includes('your_')
    );
  }

  async generate(prompt: string): Promise<string> {
    const groqKeys = this.getGroqKeys();

    // Attempt 1: Try Groq with key pool failover
    if (groqKeys.length > 0) {
      for (let i = 0; i < groqKeys.length; i++) {
        // Round robin across available keys
        const keyIndex = (this.currentKeyIndex + i) % groqKeys.length;
        const apiKey = groqKeys[keyIndex];

        try {
          const result = await this.callGroq(apiKey, this.primaryGroqModel, prompt);
          this.currentKeyIndex = (keyIndex + 1) % groqKeys.length;
          return result;
        } catch (err: any) {
          console.warn(
            `[LlmService] Groq Key #${keyIndex + 1} (${this.primaryGroqModel}) failed: ${err?.message || err}. Failing over to next key...`
          );

          // Try instant fallback model on the same key if rate limited
          try {
            const fallbackResult = await this.callGroq(apiKey, this.fallbackGroqModel, prompt);
            this.currentKeyIndex = (keyIndex + 1) % groqKeys.length;
            return fallbackResult;
          } catch (fallbackErr: any) {
            console.warn(
              `[LlmService] Groq Key #${keyIndex + 1} (${this.fallbackGroqModel}) also failed. Proceeding to next key...`
            );
          }
        }
      }
      console.warn('[LlmService] All Groq API keys exhausted or rate-limited. Falling back to Gemini AI...');
    } else {
      console.log('[LlmService] No Groq keys active in .env. Falling back to Gemini AI.');
    }

    // Attempt 2: Gemini Fallback
    try {
      const response = await this.geminiModel.invoke(prompt);
      return typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);
    } catch (geminiErr: any) {
      console.error('[LlmService] Gemini AI generation also failed:', geminiErr?.message || geminiErr);
      throw new Error(`AI generation failed across all Groq and Gemini providers: ${geminiErr?.message || geminiErr}`);
    }
  }

  private async callGroq(apiKey: string, model: string, prompt: string): Promise<string> {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: TUTOR_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: model,
      temperature: 0.2,
      max_completion_tokens: 4096,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Groq returned empty completion response.');
    }
    return content;
  }

  getModel(): ChatGoogleGenerativeAI {
    return this.geminiModel;
  }
}
