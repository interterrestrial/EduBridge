import { EmbeddingService } from './src/services/embedding.service';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const embedder = new EmbeddingService();
    const docs = [{ pageContent: "Test content", metadata: { documentId: "123" } }];
    const store = await FaissStore.fromDocuments(docs, embedder.getModel());
    await store.save('./test_faiss_dir');
    console.log("FAISS store created successfully");
  } catch (e) {
    console.error("Error creating FAISS store:", e);
  }
}
run();
