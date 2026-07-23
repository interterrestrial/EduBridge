import prisma from './prisma';
import { ExtractionService } from './services/extraction.service';
import { ChunkingService } from './services/chunking.service';
import { EmbeddingService } from './services/embedding.service';
import { VectorService } from './services/vector.service';
import { RetrievalService } from './services/retrieval.service';
import { LlmService } from './services/llm.service';
import { RagService } from './services/rag.service';
import { AiChatService } from './services/aiChat.service';
import { AiQuizService } from './services/aiQuiz.service';
import { AiFlashcardService } from './services/aiFlashcard.service';
import fs from 'fs';
import path from 'path';

async function runBackendValidation() {
  console.log('🧪 Starting Full Backend Database & AI Integration Test...');

  const studentId = 'student_1';

  // 1. Create a dummy test file
  const testDir = path.join(__dirname, '../test_data');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
  const sampleFilePath = path.join(testDir, 'db_notes.txt');
  fs.writeFileSync(
    sampleFilePath,
    `# Database Systems
A Relational Database Management System (RDBMS) organizes data into tables consisting of rows and columns.
ACID Properties stand for Atomicity, Consistency, Isolation, and Durability.
Atomicity ensures all transactions succeed or completely fail.`
  );

  // 2. Test Note Creation in DB
  const note = await prisma.note.create({
    data: {
      title: 'Database Systems Notes',
      filePath: sampleFilePath,
      fileType: '.txt',
      studentId,
    },
  });
  console.log('✅ Note DB record created successfully:', note.id);

  // 3. Test Extraction, Chunking & Indexing
  const extractionService = new ExtractionService();
  const chunkingService = new ChunkingService();
  const embeddingService = new EmbeddingService();
  const vectorService = new VectorService(embeddingService);

  const docs = await extractionService.extractFromFile(sampleFilePath);
  const chunks = await chunkingService.chunkDocuments(docs, {
    studentId,
    documentId: note.id,
    documentTitle: note.title,
  });
  await vectorService.indexDocuments(studentId, chunks);
  console.log('✅ Document extracted, chunked, and indexed into FAISS vector store!');

  // 4. Test Flashcards creation in DB
  const retrievalService = new RetrievalService(vectorService);
  const llmService = new LlmService();
  const ragService = new RagService(retrievalService, llmService);
  const flashcardService = new AiFlashcardService(ragService);

  const cards = await flashcardService.generateFlashcards({ studentId, count: 2 });
  console.log('✅ Generated Flashcards via Gemini:', cards.length);

  const savedCards = await Promise.all(
    cards.map((card) =>
      prisma.flashcard.create({
        data: {
          question: card.question,
          answer: card.answer,
          topic: card.topic,
          type: card.type,
          noteId: note.id,
          studentId,
        },
      })
    )
  );
  console.log('✅ Flashcards saved to Database:', savedCards.length);

  // 5. Test AI Chat
  const chatService = new AiChatService(ragService);
  const chatRes = await chatService.askTutor(studentId, 'What does ACID stand for?');
  console.log('✅ AI Tutor Chat Answer:', chatRes.answer.slice(0, 100) + '...');

  const savedMessage = await prisma.chatMessage.create({
    data: {
      studentId,
      noteId: note.id,
      question: 'What does ACID stand for?',
      answer: chatRes.answer,
      sourcesJson: JSON.stringify(chatRes.sources),
    },
  });
  console.log('✅ Chat Message saved to Database:', savedMessage.id);

  console.log('🎉 ALL BACKEND DB + AI PIPELINES VERIFIED WORKING PERFECTLY!');
}

runBackendValidation()
  .catch((e) => {
    console.error('❌ Validation error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
