import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const embedder = new GoogleGenerativeAIEmbeddings({ apiKey: "bad_key", model: "embedding-001" });
    const res = await embedder.embedQuery("Test query");
    console.log("Embed query length:", res.length);
  } catch (e) {
    console.error("Error creating embed:", e);
  }
}
run();
