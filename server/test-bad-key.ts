import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const embedder = new GoogleGenerativeAIEmbeddings({ apiKey: "bad_key", model: "embedding-001" });
    const docs = [{ pageContent: "Test content", metadata: { documentId: "123" } }];
    const store = await FaissStore.fromDocuments(docs, embedder);
    await store.save('./test_faiss_bad_key_dir');
    console.log("FAISS store created successfully");
  } catch (e) {
    console.error("Error creating FAISS store:", e);
  }
}
run();
