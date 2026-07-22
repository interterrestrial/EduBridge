import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { Document } from '@langchain/core/documents';
import path from 'path';
import fs from 'fs';
import { cleanText } from '../utils/textCleaner';

export class ExtractionService {
  async extractFromFile(filePath: string): Promise<Document[]> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();
    let docs: Document[] = [];

    if (ext === '.pdf') {
      const loader = new PDFLoader(filePath, { splitPages: true });
      docs = await loader.load();
    } else if (ext === '.docx') {
      const loader = new DocxLoader(filePath);
      docs = await loader.load();
    } else if (ext === '.txt' || ext === '.md') {
      const content = fs.readFileSync(filePath, 'utf-8');
      docs = [new Document({ pageContent: content, metadata: { page: 1 } })];
    } else {
      throw new Error(`Unsupported file extension: ${ext}`);
    }

    // Clean text for all documents
    return docs.map((doc) => ({
      ...doc,
      pageContent: cleanText(doc.pageContent),
    }));
  }
}
