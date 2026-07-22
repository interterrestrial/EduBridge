import { RagService } from './rag.service';
import { TUTOR_SYSTEM_PROMPT } from '../prompts/tutor.prompt';
import { ChatResponse } from '../types/ai.types';

export class AiChatService {
  private ragService: RagService;

  constructor(ragService: RagService) {
    this.ragService = ragService;
  }

  async askTutor(
    studentId: string,
    question: string,
    noteId?: string
  ): Promise<ChatResponse> {
    return await this.ragService.executeQuery(
      studentId,
      question,
      TUTOR_SYSTEM_PROMPT,
      noteId
    );
  }
}
