import { EmbeddingService } from './src/services/embedding.service';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const embedder = new EmbeddingService();
    const store = new FaissStore(embedder.getModel(), {});
    await store.save('./test_faiss_empty_dir');
    console.log("Empty FAISS store saved.");
  } catch (e) {
    console.error("Error creating FAISS store:", e);
  }
}
run();
