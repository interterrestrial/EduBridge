import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { EmbeddingService } from './src/services/embedding.service';
import fs from 'fs';

async function run() {
  try {
    const embedder = new EmbeddingService();
    const docs = Array(92).fill({ pageContent: "Test chunk", metadata: { id: 1 } });
    
    // We can just use fromDocuments for the first batch, then addDocuments for the rest
    let store: FaissStore;
    const batchSize = 10;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      if (i === 0) {
        store = await FaissStore.fromDocuments(batch, embedder.getModel());
      } else {
        await store!.addDocuments(batch);
      }
    }
    await store!.save('./test_faiss_batch_dir');
    console.log("Documents added successfully with batching!");
  } catch(e) {
    console.error("Error adding:", e);
  }
}
run();
