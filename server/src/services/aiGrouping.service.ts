import { LlmService } from './llm.service';

export class AiGroupingService {
  private llmService: LlmService;

  constructor(llmService: LlmService) {
    this.llmService = llmService;
  }

  async autoGroupItems(
    items: { id: string; title: string; contentSnippet: string }[],
    folders: { id: string; name: string }[]
  ): Promise<{ itemId: string; folderId: string | null }[]> {
    if (items.length === 0) return [];
    if (folders.length === 0) return items.map(item => ({ itemId: item.id, folderId: null }));

    const prompt = `
You are an intelligent categorization assistant. 
Your task is to assign each item from a list of study materials (notes or flashcards) to the single most relevant existing folder from a provided list of folders.

Folders:
${JSON.stringify(folders, null, 2)}

Items to Categorize:
${JSON.stringify(items, null, 2)}

Rules:
1. For each item, select the most relevant folderId.
2. If NO folder is relevant, set folderId to null.
3. Return ONLY a valid JSON array of objects with the shape: { "itemId": "string", "folderId": "string" | null }. 
Do not include markdown blocks or any other text.
`;

    try {
      const response = await this.llmService.generate(prompt);
      const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      return parsed;
    } catch (error) {
      console.error('Error parsing AI grouping response:', error);
      throw new Error('Failed to auto-group items with AI.');
    }
  }
}
