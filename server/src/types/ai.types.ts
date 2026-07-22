import { Document } from '@langchain/core/documents';

export interface ChunkMetadata {
  chunkId: string;
  studentId: string;
  documentId: string;
  documentTitle: string;
  pageNumber?: number;
  chunkIndex: number;
}

export interface ChatSource {
  documentTitle: string;
  pageNumber?: number;
  contentSnippet?: string;
}

export interface ChatRequest {
  studentId: string;
  question: string;
  noteId?: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export interface QuizQuestion {
  id?: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  topic: string;
}

export interface FlashcardItem {
  id?: string;
  question: string;
  answer: string;
  topic: string;
  type: 'definition' | 'concept' | 'formula' | 'comparison';
}

export interface KnowledgeGap {
  topic: string;
  incorrectCount: number;
  totalAttempts: number;
  accuracy: number;
  severity: 'critical' | 'moderate' | 'mild';
}

export interface StudentAnalyticsData {
  studentId: string;
  masteryScore: number;
  averageQuizScore: number;
  studyHours: number;
  flashcardsReviewed: number;
  aiSessions: number;
  weakTopics: string[];
  strongTopics: string[];
}
