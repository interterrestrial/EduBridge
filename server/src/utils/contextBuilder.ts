import { Document } from '@langchain/core/documents';

export function buildContext(chunks: Document[]): string {
  if (!chunks || chunks.length === 0) {
    return 'No relevant study material found.';
  }

  return chunks
    .map((chunk, i) => {
      const source = chunk.metadata.documentTitle || 'Study Notes';
      const page = chunk.metadata.pageNumber ? `, Page ${chunk.metadata.pageNumber}` : '';
      return `[Source: ${source}${page}]\n${chunk.pageContent}`;
    })
    .join('\n\n---\n\n');
}
