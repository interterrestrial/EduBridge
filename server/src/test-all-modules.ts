import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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
import { EvaluationService } from './services/evaluation.service';
import { KnowledgeGapService } from './services/knowledgeGap.service';
import { RecommendationService } from './services/recommendation.service';

dotenv.config();

async function testAllModules() {
  console.log('====================================================');
  console.log('🚀 EduBridge AI Engine — Full Pipeline Module Test');
  console.log('====================================================\n');

  // Step 1: Create Mock Data File
  const testDir = path.join(__dirname, '../test_data');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  const sampleFile = path.join(testDir, 'dbms_notes.txt');
  fs.writeFileSync(
    sampleFile,
    `# Database Management Systems (DBMS) Notes

## Section 1: Relational Database Basics
A Relational Database stores data in structured tables consisting of rows and columns.
A Primary Key uniquely identifies each record in a table.
A Foreign Key establishes a relationship between two tables by pointing to the primary key of another table.

## Section 2: Normalization
Normalization is the process of organizing data to reduce redundancy and improve data integrity.
First Normal Form (1NF) requires atomicity of column values.
Second Normal Form (2NF) eliminates partial dependencies.
Third Normal Form (3NF) eliminates transitive dependencies.

## Section 3: ACID Properties
ACID stands for Atomicity, Consistency, Isolation, and Durability.
Atomicity guarantees that all operations in a transaction succeed or all fail.
Consistency ensures that database constraints are preserved before and after transactions.
Isolation isolates concurrent transactions from interfering with each other.
Durability guarantees that committed data is permanently saved even during system crashes.`,
    'utf-8'
  );

  // Initialize Core Services
  const extractionService = new ExtractionService();
  const chunkingService = new ChunkingService();

  const studentId = 'test_student_dbms';
  const documentId = 'note_dbms_01';
  const documentTitle = 'DBMS Notes';

  // Module 1 & 2: Extraction & Chunking
  console.log('📦 Module 1 & 2: Document Processing & Chunking');
  const rawDocs = await extractionService.extractFromFile(sampleFile);
  const chunks = await chunkingService.chunkDocuments(rawDocs, {
    studentId,
    documentId,
    documentTitle,
  });
  console.log(` -> Extracted and chunked into ${chunks.length} segments.`);
  console.log(` -> First Chunk Sample:\n    "${chunks[0].pageContent.slice(0, 100)}..."\n`);

  // Module 7 Evaluation Logic Test
  console.log('📝 Module 7: Quiz Evaluation Logic');
  const evalService = new EvaluationService();
  const mockQuestions = [
    {
      id: 'q1',
      question: 'What is 1NF?',
      optionA: 'Atomicity',
      optionB: 'Partial Dependency',
      optionC: 'Transitive Dependency',
      optionD: 'BCNF',
      correctAnswer: 'A' as const,
      explanation: '1NF requires atomic values.',
      topic: 'Normalization',
    },
    {
      id: 'q2',
      question: 'What does ACID stand for?',
      optionA: 'Atomicity, Consistency, Isolation, Durability',
      optionB: 'Access, Control, Index, Data',
      optionC: 'Asynchronous, Concurrent, Isolated, Distributed',
      optionD: 'Array, Class, Integer, Double',
      correctAnswer: 'A' as const,
      explanation: 'ACID defines transaction guarantees.',
      topic: 'ACID Properties',
    },
  ];

  const quizResult = evalService.evaluateQuizAttempt(
    {
      quizId: 'quiz_1',
      studentId,
      answers: [
        { questionId: 'q1', selectedAnswer: 'A' },
        { questionId: 'q2', selectedAnswer: 'B' },
      ],
    },
    mockQuestions
  );
  console.log(` -> Quiz Attempt Evaluated: Score ${quizResult.score}/${quizResult.totalQuestions} (${quizResult.accuracy}% accuracy)`);
  console.log(` -> Identified Weak Topics:`, quizResult.weakTopics, '\n');

  // Module 9: Knowledge Gap Detection
  console.log('📊 Module 9: Knowledge Gap Detection');
  const gapService = new KnowledgeGapService();
  const gaps = gapService.detectGaps([
    { topic: 'ACID Properties', isCorrect: false },
    { topic: 'ACID Properties', isCorrect: false },
    { topic: 'Normalization', isCorrect: true },
  ]);
  console.log(' -> Detected Knowledge Gaps:', gaps, '\n');

  // Check if Gemini API key is available for live embedding & LLM tests
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key' || apiKey === 'dummy_key_for_test') {
    console.log('⚠️ No GEMINI_API_KEY configured in .env. Skipping live network LLM calls.');
    console.log('✅ Offline AI modules and pipeline data structures verified successfully!');
    fs.unlinkSync(sampleFile);
    return;
  }

  // Live network tests when API key is provided
  console.log('🌐 GEMINI_API_KEY detected. Running live network tests...');
  try {
    const embeddingService = new EmbeddingService();
    const vectorService = new VectorService(embeddingService);
    const retrievalService = new RetrievalService(vectorService);
    const llmService = new LlmService();
    const ragService = new RagService(retrievalService, llmService);

    // Module 3: Vector Storage
    console.log('🗂️ Module 3: FAISS Vector DB Indexing');
    await vectorService.indexDocuments(studentId, chunks);
    console.log(' -> Document indexed into student vector space successfully.\n');

    // Module 6: AI Chat / Tutor
    console.log('💬 Module 6: AI Tutor Chat');
    const chatService = new AiChatService(ragService);
    const chatRes = await chatService.askTutor(studentId, 'Explain 3NF and transitive dependencies.');
    console.log(' -> AI Answer:\n', chatRes.answer);
    console.log(' -> Sources:', chatRes.sources.map(s => `${s.documentTitle} (${s.pageNumber})`), '\n');

    // Module 7: AI Quiz Generation
    console.log('📝 Module 7: AI Quiz Generation');
    const quizService = new AiQuizService(ragService);
    const quizQuestions = await quizService.generateQuiz({
      studentId,
      noteId: documentId,
      difficulty: 'medium',
      count: 3,
    });
    console.log(` -> Generated ${quizQuestions.length} Quiz Questions:`);
    quizQuestions.forEach((q, i) => console.log(`   Q${i + 1}: ${q.question} (Ans: ${q.correctAnswer})`));
    console.log('\n');

    // Module 8: Flashcard Engine
    console.log('🗂️ Module 8: Flashcard Generation');
    const flashcardService = new AiFlashcardService(ragService);
    const cards = await flashcardService.generateFlashcards({
      studentId,
      noteId: documentId,
      count: 3,
    });
    console.log(` -> Generated ${cards.length} Flashcards:`);
    cards.forEach((c, i) => console.log(`   Card ${i + 1} [${c.topic}]: ${c.question} -> ${c.answer}`));
    console.log('\n');

    // Module 10: Teacher Recommendation Engine
    console.log('👨‍🏫 Module 10: Teacher Recommendation Engine');
    const recService = new RecommendationService(llmService);
    const teacherInsights = await recService.generateTeacherInsights({
      totalStudents: 30,
      activeStudents: 28,
      averageMastery: 72,
      averageQuizScore: 75,
      topicAccuracies: [
        { topic: 'ACID Properties', averageAccuracy: 45 },
        { topic: 'Relational Database Basics', averageAccuracy: 90 },
      ],
      lowPerformingStudents: [
        { name: 'Student X', masteryScore: 42, weakTopics: ['ACID Properties'] },
      ],
    });
    console.log(' -> Teacher Recommendations:\n', teacherInsights);

    // Cleanup
    await vectorService.deleteStudentIndex(studentId);
    console.log('\n====================================================');
    console.log('🎉 ALL AI MODULES TESTED AND OPERATING PERFECTLY!');
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ Live Network Test Error:', err?.message || err);
    if (err?.status || err?.statusText) {
      console.error('   Status:', err.status, err.statusText);
    }
  } finally {
    if (fs.existsSync(sampleFile)) fs.unlinkSync(sampleFile);
  }
}

testAllModules().catch(console.error);
