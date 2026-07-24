import { EmbeddingService } from './src/services/embedding.service';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const embedder = new EmbeddingService();
    const res = await embedder.embedDocuments(["Test string"]);
    console.log("Vector length:", res[0].length);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
