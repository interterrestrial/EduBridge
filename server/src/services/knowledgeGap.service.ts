import { KnowledgeGap } from '../types/ai.types';

export interface QuestionHistoryItem {
  topic: string;
  isCorrect: boolean;
}

export class KnowledgeGapService {
  detectGaps(history: QuestionHistoryItem[]): KnowledgeGap[] {
    const topicMap: Record<string, { incorrect: number; total: number }> = {};

    history.forEach((item) => {
      const topic = item.topic || 'General';
      if (!topicMap[topic]) {
        topicMap[topic] = { incorrect: 0, total: 0 };
      }
      topicMap[topic].total++;
      if (!item.isCorrect) {
        topicMap[topic].incorrect++;
      }
    });

    const gaps: KnowledgeGap[] = [];

    Object.entries(topicMap).forEach(([topic, stats]) => {
      const accuracy = Math.round(((stats.total - stats.incorrect) / stats.total) * 100);
      let severity: 'critical' | 'moderate' | 'mild' | null = null;

      if (accuracy < 40) {
        severity = 'critical';
      } else if (accuracy < 65) {
        severity = 'moderate';
      } else if (accuracy < 80) {
        severity = 'mild';
      }

      if (severity) {
        gaps.push({
          topic,
          incorrectCount: stats.incorrect,
          totalAttempts: stats.total,
          accuracy,
          severity,
        });
      }
    });

    // Sort by worst accuracy first
    return gaps.sort((a, b) => a.accuracy - b.accuracy);
  }
}
