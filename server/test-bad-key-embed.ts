import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const embedder = new GoogleGenerativeAIEmbeddings({ apiKey: "bad_key", model: "embedding-001" });
    const docs = ["Test content"];
    const res = await embedder.embedDocuments(docs);
    console.log("Embed result:", res);
  } catch (e) {
    console.error("Error creating embed:", e);
  }
}
run();
