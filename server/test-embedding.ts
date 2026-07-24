import { EmbeddingService } from './src/services/embedding.service';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const service = new EmbeddingService();
    const res = await service.embedQuery("hello world");
    console.log("Vector length:", res.length);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
