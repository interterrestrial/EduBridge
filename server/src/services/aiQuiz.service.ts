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
      10
    );

    return this.parseQuizResponse(response.answer);
  }

  private parseQuizResponse(raw: string): QuizQuestion[] {
    try {
      let parsed: any = null;

      // 1. Try finding JSON Array pattern [ ... ]
      const arrayMatch = raw.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          parsed = JSON.parse(arrayMatch[0]);
        } catch (e) {
          // ignore
        }
      }

      // 2. Try finding JSON Object pattern { ... }
      if (!parsed || !Array.isArray(parsed)) {
        const objectMatch = raw.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          try {
            const obj = JSON.parse(objectMatch[0]);
            parsed = obj.questions || obj.quiz || obj.data || obj.items || Object.values(obj).find(v => Array.isArray(v));
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
          parsed = parsed.questions || parsed.quiz || parsed.data || parsed.items || [];
        }
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('No valid quiz array found in LLM response.');
      }

      return parsed.map((item: any, idx: number) => ({
        id: `q_${Date.now()}_${idx}`,
        question: item.question || 'Question text missing',
        optionA: item.optionA || item.options?.[0] || 'Option A',
        optionB: item.optionB || item.options?.[1] || 'Option B',
        optionC: item.optionC || item.options?.[2] || 'Option C',
        optionD: item.optionD || item.options?.[3] || 'Option D',
        correctAnswer: (['A', 'B', 'C', 'D'].includes(item.correctAnswer) ? item.correctAnswer : 'A') as 'A' | 'B' | 'C' | 'D',
        explanation: item.explanation || 'No explanation provided.',
        topic: item.topic || 'General',
      }));
    } catch (err) {
      console.error('Failed to parse quiz response from LLM. Raw output was:\n', raw);

      // Smart Fallback Questions
      return [
        {
          id: `q_${Date.now()}_0`,
          question: 'Which pandas function is used for Equal-Frequency (quantile) binning?',
          optionA: 'pd.cut()',
          optionB: 'pd.qcut()',
          optionC: 'pd.bin()',
          optionD: 'pd.group()',
          correctAnswer: 'B',
          explanation: 'pd.qcut() divides data into quantiles so each bin contains an equal number of samples.',
          topic: 'Binning',
        },
        {
          id: `q_${Date.now()}_1`,
          question: 'What is the formula for Interquartile Range (IQR)?',
          optionA: 'Q3 - Q1',
          optionB: 'Q1 + Q3',
          optionC: 'Q3 / Q1',
          optionD: 'Q3 * 1.5',
          correctAnswer: 'A',
          explanation: 'IQR is computed as IQR = Q3 - Q1.',
          topic: 'Outlier Detection',
        },
      ];
    }
  }
}
