import { EmbeddingService } from './src/services/embedding.service';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const embedder = new EmbeddingService();
    const res = await embedder.embedDocuments(["test 1", "test 2"]);
    console.log("Vector lengths:", res.map(r => r.length));
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
