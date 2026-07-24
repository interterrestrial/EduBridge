import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { EmbeddingService } from './src/services/embedding.service';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const embedder = new EmbeddingService();
    const docs = [{ pageContent: "Another doc", metadata: { id: 1 } }];
    const store = await FaissStore.load('./test_faiss_empty_dir', embedder.getModel());
    await store.addDocuments(docs);
    await store.save('./test_faiss_empty_dir');
    console.log("Documents added successfully");
  } catch(e) {
    console.error("Error adding:", e);
  }
}
run();
