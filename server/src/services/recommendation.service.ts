import { LlmService } from './llm.service';
import { TEACHER_INSIGHTS_PROMPT } from '../prompts/analytics.prompt';

export interface ClassroomSummary {
  totalStudents: number;
  activeStudents: number;
  averageMastery: number;
  averageQuizScore: number;
  topicAccuracies: { topic: string; averageAccuracy: number }[];
  lowPerformingStudents: { name: string; masteryScore: number; weakTopics: string[] }[];
}

export interface TeacherRecommendationResult {
  weakTopics: string[];
  strongTopics: string[];
  atRiskStudents: { name: string; reason: string }[];
  recommendations: string[];
}

export class RecommendationService {
  private llmService: LlmService;

  constructor(llmService: LlmService) {
    this.llmService = llmService;
  }

  async generateTeacherInsights(
    summary: ClassroomSummary
  ): Promise<TeacherRecommendationResult> {
    const prompt = `${TEACHER_INSIGHTS_PROMPT}

## Classroom Performance Data Summary
${JSON.stringify(summary, null, 2)}`;

    const rawResponse = await this.llmService.generate(prompt);

    try {
      const cleaned = rawResponse.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.error('Failed to parse teacher insights LLM output:', rawResponse);
      return {
        weakTopics: summary.topicAccuracies.filter(t => t.averageAccuracy < 65).map(t => t.topic),
        strongTopics: summary.topicAccuracies.filter(t => t.averageAccuracy >= 85).map(t => t.topic),
        atRiskStudents: summary.lowPerformingStudents.map(s => ({
          name: s.name,
          reason: `Low mastery score (${s.masteryScore}%) in topics: ${s.weakTopics.join(', ')}`,
        })),
        recommendations: [
          'Conduct a revision lecture on weak classroom topics.',
          'Assign practice quizzes to at-risk students.',
        ],
      };
    }
  }
}
