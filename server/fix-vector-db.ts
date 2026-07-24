import prisma from './src/prisma';
import { ExtractionService } from './src/services/extraction.service';
import { ChunkingService } from './src/services/chunking.service';
import { EmbeddingService } from './src/services/embedding.service';
import { VectorService } from './src/services/vector.service';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  console.log("Deleting old vector_db...");
  if (fs.existsSync('./vector_db')) {
    fs.rmSync('./vector_db', { recursive: true, force: true });
  }

  const extractionService = new ExtractionService();
  const chunkingService = new ChunkingService();
  const embeddingService = new EmbeddingService();
  const vectorService = new VectorService(embeddingService);

  const notes = await prisma.note.findMany();
  console.log(`Found ${notes.length} notes to re-index.`);

  for (const note of notes) {
    console.log(`Processing note: ${note.title} (ID: ${note.id})`);
    try {
      if (!fs.existsSync(note.filePath)) {
        console.warn(`File not found: ${note.filePath}, skipping.`);
        continue;
      }
      const rawDocs = await extractionService.extractFromFile(note.filePath);
      const chunks = await chunkingService.chunkDocuments(rawDocs, {
        studentId: note.studentId,
        documentId: note.id,
        documentTitle: note.title,
      });
      await vectorService.indexDocuments(note.studentId, chunks);
      console.log(`Indexed ${chunks.length} chunks for ${note.title}`);
    } catch (e) {
      console.error(`Error processing note ${note.title}:`, e);
    }
  }
  console.log("Done fixing vector_db.");
}
run();
