import prisma from './src/prisma';
import { ExtractionService } from './src/services/extraction.service';
import { ChunkingService } from './src/services/chunking.service';
import { EmbeddingService } from './src/services/embedding.service';

async function run() {
  const note = await prisma.note.findFirst({ where: { title: { contains: "NC Marketing" } } });
  if (!note) return console.log("Not found");
  
  const ext = new ExtractionService();
  const chunking = new ChunkingService();
  const embed = new EmbeddingService();
  
  const rawDocs = await ext.extractFromFile(note.filePath);
  const chunks = await chunking.chunkDocuments(rawDocs, {
    studentId: note.studentId, documentId: note.id, documentTitle: note.title
  });
  
  console.log(`Chunks: ${chunks.length}`);
  for (let i = 0; i < chunks.length; i++) {
    if (!chunks[i].pageContent.trim()) {
      console.log(`Chunk ${i} is empty!`);
    }
  }
  
  // Let's test embedding these chunks
  try {
    const vectors = await embed.embedDocuments(chunks.map(c => c.pageContent));
    vectors.forEach((v, idx) => {
      if (v.length !== 3072) {
        console.log(`Chunk ${idx} has vector length ${v.length}`);
      }
    });
  } catch (e) {
    console.error("Embedding failed:", e);
  }
}
run();
