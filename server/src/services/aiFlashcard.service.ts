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
      const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        throw new Error('LLM output is not an array');
      }

      return parsed.map((item: any, idx: number) => ({
        id: `card_${Date.now()}_${idx}`,
        question: item.question || 'Concept Prompt',
        answer: item.answer || 'Concept Explanation',
        topic: item.topic || 'General',
        type: ['definition', 'concept', 'formula', 'comparison'].includes(item.type)
          ? item.type
          : 'concept',
      }));
    } catch (err) {
      console.error('Failed to parse flashcard response from LLM:', raw);
      throw new Error('Flashcard generation failed due to invalid response structure.');
    }
  }
}
