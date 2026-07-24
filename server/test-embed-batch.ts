import { EmbeddingService } from './src/services/embedding.service';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const embedder = new EmbeddingService();
    const texts = Array(90).fill("Test string");
    const res = await embedder.embedDocuments(texts);
    console.log("Vector lengths:", res.map(r => r.length));
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
