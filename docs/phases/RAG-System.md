# 🧠 Retrieval-Augmented Generation (RAG) System

This document defines the architecture, workflow, and implementation of the **Retrieval-Augmented Generation (RAG)** system used in EduBridge. RAG is the core AI architecture that enables the platform to provide accurate, context-aware, and personalized responses based on a student's uploaded study materials.

Unlike traditional Large Language Models (LLMs), which rely primarily on pre-trained knowledge, EduBridge retrieves relevant information from the student's own documents before generating an answer. This significantly improves accuracy while reducing hallucinations.

---

# 🎯 Objectives

The RAG system is designed to:

- Answer questions using uploaded study material.
- Reduce AI hallucinations.
- Provide personalized learning assistance.
- Enable semantic document search.
- Support AI Tutor, Quiz Generation, and Flashcard Generation.
- Scale efficiently with multiple documents and users.

---

# 🏗️ What is RAG?

**Retrieval-Augmented Generation (RAG)** is an AI architecture that combines two major components:

1. **Retriever** – Finds relevant information from uploaded documents.
2. **Generator** – Uses an LLM (Google Gemini) to generate an answer based on the retrieved information.

Instead of asking Gemini to answer from general knowledge, EduBridge first retrieves the most relevant sections from the student's notes and then provides them as context to the model.

---

# 🏛️ High-Level Architecture

```text
                  Student
                     │
                     ▼
              Ask Question
                     │
                     ▼
        Generate Query Embedding
                     │
                     ▼
        Search Vector Database
                     │
                     ▼
      Retrieve Relevant Chunks
                     │
                     ▼
        Build Context Prompt
                     │
                     ▼
            Google Gemini
                     │
                     ▼
         Personalized Response
```

---

# 🔄 Complete RAG Workflow

```text
Upload Notes
      │
      ▼
Extract Text
      │
      ▼
Split into Chunks
      │
      ▼
Generate Embeddings
      │
      ▼
Store in FAISS
─────────────────────────────────
Student Question
      │
      ▼
Generate Question Embedding
      │
      ▼
Semantic Search
      │
      ▼
Retrieve Top Chunks
      │
      ▼
Prompt Construction
      │
      ▼
Gemini Response
      │
      ▼
Return Answer
```

---

# 📄 Step 1: Document Upload

Students upload study materials.

Supported formats:

- PDF
- DOCX

Example

```text
Operating Systems.pdf

↓

Upload Successful
```

The uploaded document is then sent to the preprocessing pipeline.

---

# 📖 Step 2: Text Extraction

The uploaded document is converted into plain text.

```text
PDF

↓

Extract Text

↓

Clean Text
```

During preprocessing:

- Remove unnecessary formatting
- Remove extra spaces
- Preserve headings
- Preserve paragraph structure

---

# ✂️ Step 3: Document Chunking

Large documents cannot be embedded efficiently as a single block.

Instead, the document is divided into smaller chunks.

Example

```text
Operating Systems

↓

Chunk 1

↓

Chunk 2

↓

Chunk 3

↓

Chunk N
```

Typical chunk size:

- 400–800 tokens

Chunk overlap:

- 50–100 tokens

Benefits:

- Better retrieval
- Lower token usage
- Higher contextual relevance

---

# 🔢 Step 4: Embedding Generation

Each document chunk is converted into a vector embedding.

Example

```text
Chunk

↓

"What is Virtual Memory?"

↓

Embedding

[0.21, 0.53, 0.92, ...]
```

Embeddings represent semantic meaning rather than exact keywords.

This enables intelligent similarity search.

---

# 🗂️ Step 5: Store in Vector Database

Generated embeddings are stored in **FAISS**.

Each record contains:

- Chunk ID
- Note ID
- Student ID
- Chunk Text
- Embedding Vector

Example

```text
Chunk

↓

Embedding

↓

FAISS Index
```

---

# ❓ Step 6: Student Asks a Question

Example

```text
Explain Process Scheduling.
```

The question is processed before reaching Gemini.

Workflow

```text
Question

↓

Generate Embedding

↓

Semantic Search
```

---

# 🔍 Step 7: Semantic Retrieval

The question embedding is compared with all stored embeddings.

Instead of keyword matching, FAISS retrieves semantically similar chunks.

Example

```text
Question

↓

Top 5 Similar Chunks

↓

Return Context
```

Benefits

- Faster retrieval
- Better relevance
- Personalized responses

---

# 🧩 Step 8: Prompt Construction

LangChain constructs the final prompt.

```text
System Prompt

+

Retrieved Chunks

+

Student Question

↓

Gemini
```

Example

```text
You are an AI tutor.

Answer only using the provided study material.

If the answer is not available,
clearly mention that the uploaded notes
do not contain sufficient information.
```

---

# 🤖 Step 9: Response Generation

Gemini receives:

- Student Question
- Retrieved Context
- System Prompt

Example

```text
Question

Explain Deadlock.

+

Retrieved Notes

↓

Gemini

↓

Personalized Explanation
```

---

# 📚 Example End-to-End Query

Student uploads:

```text
Operating Systems Notes
```

Student asks:

```text
What are the four conditions
required for deadlock?
```

RAG Workflow

```text
Question

↓

Embedding

↓

FAISS Search

↓

Retrieve Deadlock Section

↓

Gemini

↓

Explain Four Conditions
```

---

# 🚫 Hallucination Prevention

Without RAG

```text
Question

↓

Gemini

↓

General Knowledge
```

With RAG

```text
Question

↓

Retrieve Notes

↓

Gemini

↓

Context-Based Answer
```

If the retrieved context is insufficient, the AI responds transparently instead of inventing information.

Example

```text
I couldn't find sufficient
information in your uploaded notes
to answer this accurately.
```

---

# 📊 RAG Integration Across EduBridge

The RAG system powers multiple modules.

```text
Uploaded Notes
       │
       ├──────────► AI Tutor
       │
       ├──────────► Quiz Engine
       │
       ├──────────► Flashcard Engine
       │
       ├──────────► Summaries (Future)
       │
       └──────────► Teacher Insights
```

---

# ⚙️ Technology Stack

| Component | Technology |
|-----------|------------|
| LLM | Google Gemini |
| Framework | LangChain |
| Embeddings | Google Generative AI Embeddings |
| Vector Database | FAISS |
| Backend | Node.js + Express |
| ORM | Prisma |
| Database | PostgreSQL |

---

# 🌐 API Workflow

```text
POST /api/chat/message

↓

Authenticate User

↓

Retrieve Relevant Chunks

↓

Generate Prompt

↓

Gemini API

↓

Return Response
```

---

# 📂 Backend Structure

```text
server/

src/

├── services/
│   ├── rag.service.ts
│   ├── retrieval.service.ts
│   ├── embedding.service.ts
│   ├── llm.service.ts
│   └── vector.service.ts
│
├── prompts/
│   └── tutor.prompt.ts
│
├── utils/
│   ├── chunker.ts
│   └── contextBuilder.ts
│
└── routes/
    └── chat.routes.ts
```

---

# 📈 Performance Optimizations

To ensure fast retrieval and low response latency:

- Store precomputed embeddings.
- Cache frequently accessed documents.
- Retrieve only the Top-K relevant chunks.
- Use asynchronous document processing.
- Batch embedding generation.
- Minimize prompt size to reduce token usage.

---

# 🔒 Security Considerations

The RAG system follows these security practices:

- JWT authentication required.
- Users can retrieve only their own document embeddings.
- Vector searches are scoped to the authenticated student.
- Prompt injection is mitigated using system prompts and input validation.
- Uploaded documents are never shared across users.
- Sensitive content remains isolated per student.

---

# 🚀 Future Enhancements

Future versions may include:

- Hybrid Search (Semantic + Keyword)
- Metadata-Based Filtering
- Multi-Document Retrieval
- Conversation Memory
- Re-ranking Models
- Citation of Retrieved Chunks
- Image & Diagram Retrieval
- Multi-Modal RAG
- Distributed Vector Databases
- Streaming Responses

---

# 📋 Deliverables

- ✅ RAG Architecture
- ✅ Document Processing Workflow
- ✅ Text Chunking Strategy
- ✅ Embedding Generation
- ✅ Vector Storage
- ✅ Semantic Retrieval
- ✅ Prompt Construction
- ✅ Gemini Integration
- ✅ Hallucination Prevention
- ✅ API Workflow
- ✅ Backend Structure
- ✅ Security Strategy
- ✅ Performance Optimizations
- ✅ Future Enhancements

---

## 📌 Document Status

**Status:** ✅ Completed

This document defines the complete Retrieval-Augmented Generation (RAG) system for EduBridge. It serves as the implementation guide for building a scalable, secure, and context-aware AI architecture that powers personalized tutoring, quiz generation, flashcard creation, and intelligent educational assistance using LangChain, FAISS, embeddings, and Google Gemini.