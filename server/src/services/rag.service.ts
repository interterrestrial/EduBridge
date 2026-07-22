import { RetrievalService } from './retrieval.service';
import { LlmService } from './llm.service';
import { buildContext } from '../utils/contextBuilder';
import { ChatResponse, ChatSource } from '../types/ai.types';

export class RagService {
  private retrievalService: RetrievalService;
  private llmService: LlmService;

  constructor(retrievalService: RetrievalService, llmService: LlmService) {
    this.retrievalService = retrievalService;
    this.llmService = llmService;
  }

  async executeQuery(
    studentId: string,
    question: string,
    systemPrompt: string,
    noteId?: string,
    topK: number = 5
  ): Promise<ChatResponse> {
    // 1. Retrieve top matching chunks
    const chunks = await this.retrievalService.retrieveRelevantContext(
      studentId,
      question,
      topK,
      noteId
    );

    // 2. Build context string
    const contextText = buildContext(chunks);

    // 3. Construct prompt
    const fullPrompt = `${systemPrompt}

## Provided Study Material
${contextText}

## Student Question
${question}`;

    // 4. Generate response via Gemini
    const answer = await this.llmService.generate(fullPrompt);

    // 5. Build source citations
    const sources: ChatSource[] = chunks.map((chunk) => ({
      documentTitle: chunk.metadata.documentTitle || 'Study Notes',
      pageNumber: chunk.metadata.pageNumber,
      contentSnippet: chunk.pageContent.slice(0, 150) + '...',
    }));

    return {
      answer,
      sources,
    };
  }
}
