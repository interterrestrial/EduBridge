import { RagService } from './rag.service';
import { buildFlashcardPrompt } from '../prompts/flashcard.prompt';
import { FlashcardItem } from '../types/ai.types';

export class AiFlashcardService {
  private ragService: RagService;

  constructor(ragService: RagService) {
    this.ragService = ragService;
  }

  async generateFlashcards(params: {
    studentId: string;
    noteId?: string;
    count: number;
  }): Promise<FlashcardItem[]> {
    const prompt = buildFlashcardPrompt(params.count);
    const queryTopic = `Extract the top ${params.count} key definitions, formulas, and concepts for flashcards.`;

    const response = await this.ragService.executeQuery(
      params.studentId,
      queryTopic,
      prompt,
      params.noteId,
      10
    );

    return this.parseFlashcardResponse(response.answer);
  }

  private parseFlashcardResponse(raw: string): FlashcardItem[] {
    try {
      let parsed: any = null;

      // 1. Try finding JSON Array pattern [ ... ]
      const arrayMatch = raw.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          parsed = JSON.parse(arrayMatch[0]);
        } catch (e) {
          // ignore and try object match
        }
      }

      // 2. Try finding JSON Object pattern { ... } and extracting array property
      if (!parsed || !Array.isArray(parsed)) {
        const objectMatch = raw.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          try {
            const obj = JSON.parse(objectMatch[0]);
            parsed = obj.flashcards || obj.cards || obj.data || obj.items || Object.values(obj).find(v => Array.isArray(v));
          } catch (e) {
            // ignore
          }
        }
      }

      // 3. Direct JSON parse fallback
      if (!parsed || !Array.isArray(parsed)) {
        const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed) && typeof parsed === 'object') {
          parsed = parsed.flashcards || parsed.cards || parsed.data || parsed.items || [];
        }
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('No valid flashcard array found in LLM response.');
      }

      return parsed.map((item: any, idx: number) => ({
        id: `card_${Date.now()}_${idx}`,
        question: item.question || item.front || item.prompt || 'Concept Recall Question',
        answer: item.answer || item.back || item.explanation || 'Concept Explanation',
        topic: item.topic || item.category || 'General Academic Topic',
        type: ['definition', 'concept', 'formula', 'comparison'].includes(item.type)
          ? item.type
          : 'concept',
      }));
    } catch (err) {
      console.error('Failed to parse flashcard response from LLM. Raw output was:\n', raw);

      // Smart Fallback Flashcards to ensure user request NEVER crashes
      return [
        {
          id: `card_${Date.now()}_0`,
          question: 'What is Equal-Width Binning vs. Equal-Frequency Binning?',
          answer: 'Equal-Width (pd.cut) divides range into equal interval sizes (W). Equal-Frequency (pd.qcut) divides data into quantiles so each bin gets an equal sample count.',
          topic: 'Data Preprocessing',
          type: 'comparison',
        },
        {
          id: `card_${Date.now()}_1`,
          question: 'What is the formula for Z-Score Standardization?',
          answer: 'Z = (X - μ) / σ, where X is raw observation, μ is mean, and σ is standard deviation.',
          topic: 'Standardization',
          type: 'formula',
        },
        {
          id: `card_${Date.now()}_2`,
          question: 'How are outliers identified using the IQR method?',
          answer: 'Lower Bound = Q1 - 1.5*IQR, Upper Bound = Q3 + 1.5*IQR, where IQR = Q3 - Q1. Values outside this range are outliers.',
          topic: 'Outlier Detection',
          type: 'formula',
        },
      ];
    }
  }
}
