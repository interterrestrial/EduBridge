import { RagService } from './rag.service';
import { buildQuizPrompt } from '../prompts/quiz.prompt';
import { QuizQuestion } from '../types/ai.types';

export class AiQuizService {
  private ragService: RagService;

  constructor(ragService: RagService) {
    this.ragService = ragService;
  }

  async generateQuiz(params: {
    studentId: string;
    noteId?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    count: number;
  }): Promise<QuizQuestion[]> {
    const prompt = buildQuizPrompt({
      count: params.count,
      difficulty: params.difficulty,
    });

    const queryTopic = `Generate ${params.count} ${params.difficulty} level quiz questions covering all key concepts in the notes.`;

    const response = await this.ragService.executeQuery(
      params.studentId,
      queryTopic,
      prompt,
      params.noteId,
      10 // retrieve more chunks for comprehensive coverage
    );

    return this.parseQuizResponse(response.answer);
  }

  private parseQuizResponse(raw: string): QuizQuestion[] {
    try {
      const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        throw new Error('LLM output is not an array');
      }

      return parsed.map((item: any, idx: number) => ({
        id: `q_${Date.now()}_${idx}`,
        question: item.question || 'Question text missing',
        optionA: item.optionA || 'Option A',
        optionB: item.optionB || 'Option B',
        optionC: item.optionC || 'Option C',
        optionD: item.optionD || 'Option D',
        correctAnswer: (['A', 'B', 'C', 'D'].includes(item.correctAnswer) ? item.correctAnswer : 'A') as 'A' | 'B' | 'C' | 'D',
        explanation: item.explanation || 'No explanation provided.',
        topic: item.topic || 'General',
      }));
    } catch (err) {
      console.error('Failed to parse quiz response from LLM:', raw);
      throw new Error('Quiz generation failed due to invalid response structure.');
    }
  }
}
