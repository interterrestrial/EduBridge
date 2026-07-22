import { QuizQuestion } from '../types/ai.types';

export interface QuizSubmission {
  quizId: string;
  studentId: string;
  answers: { questionId: string; selectedAnswer: 'A' | 'B' | 'C' | 'D' }[];
}

export interface QuestionEvaluation {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  topic: string;
}

export interface QuizEvaluationResult {
  quizId: string;
  studentId: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  evaluations: QuestionEvaluation[];
  weakTopics: string[];
  strongTopics: string[];
}

export class EvaluationService {
  evaluateQuizAttempt(
    submission: QuizSubmission,
    questions: QuizQuestion[]
  ): QuizEvaluationResult {
    let score = 0;
    const evaluations: QuestionEvaluation[] = [];
    const topicStats: Record<string, { correct: number; total: number }> = {};

    questions.forEach((q) => {
      const submitted = submission.answers.find((a) => a.questionId === q.id);
      const selected = submitted?.selectedAnswer || '';
      const isCorrect = selected === q.correctAnswer;

      if (isCorrect) score++;

      evaluations.push({
        questionId: q.id || '',
        questionText: q.question,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic,
      });

      if (!topicStats[q.topic]) {
        topicStats[q.topic] = { correct: 0, total: 0 };
      }
      topicStats[q.topic].total++;
      if (isCorrect) topicStats[q.topic].correct++;
    });

    const weakTopics: string[] = [];
    const strongTopics: string[] = [];

    Object.entries(topicStats).forEach(([topic, stat]) => {
      const acc = (stat.correct / stat.total) * 100;
      if (acc < 65) {
        weakTopics.push(topic);
      } else if (acc >= 85) {
        strongTopics.push(topic);
      }
    });

    const totalQuestions = questions.length;
    const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    return {
      quizId: submission.quizId,
      studentId: submission.studentId,
      score,
      totalQuestions,
      accuracy,
      evaluations,
      weakTopics,
      strongTopics,
    };
  }
}
