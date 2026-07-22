# 💬 AI Chat

This document defines the architecture, workflow, and implementation of the **AI Tutor** module in EduBridge. The AI Chat system is the core feature of the platform, enabling students to ask questions, receive personalized explanations, and learn interactively using their own uploaded study materials.

Unlike traditional AI chatbots, EduBridge's AI Tutor uses **Retrieval-Augmented Generation (RAG)** to answer questions based on the student's uploaded notes, reducing hallucinations and improving accuracy.

---

# 🎯 Objectives

The AI Chat system is designed to:

- Answer questions using uploaded notes.
- Explain concepts in simple language.
- Provide personalized tutoring.
- Maintain conversation context.
- Reduce AI hallucinations using RAG.
- Support continuous learning.
- Store chat history for future reference.

---

# 🏗️ System Overview

```text
                  Student
                     │
                     ▼
              Ask Question
                     │
                     ▼
          Retrieve Relevant Notes
                     │
                     ▼
          Build Contextual Prompt
                     │
                     ▼
             Google Gemini API
                     │
                     ▼
          Generate AI Response
                     │
                     ▼
        Display Response to Student
                     │
                     ▼
          Save Chat History
```

---

# 🧠 AI Tutor Workflow

```text
Student Opens AI Tutor
          │
          ▼
Ask Question
          │
          ▼
Generate Query Embedding
          │
          ▼
Search FAISS
          │
          ▼
Retrieve Relevant Chunks
          │
          ▼
Build Prompt
          │
          ▼
Gemini Generates Answer
          │
          ▼
Display Response
          │
          ▼
Store Conversation
```

---

# 💬 Chat Interface

The AI Tutor interface consists of:

```text
----------------------------------------------
| AI Tutor                                  |
----------------------------------------------
| Conversation History                      |
|                                            |
| Student: What is Virtual Memory?          |
|                                            |
| AI: Virtual memory is...                  |
|                                            |
----------------------------------------------
| Type your question...              [Send] |
----------------------------------------------
```

---

# ✨ AI Capabilities

The AI Tutor can:

- Answer questions
- Explain difficult concepts
- Summarize notes
- Clarify definitions
- Solve conceptual doubts
- Generate examples
- Compare concepts
- Recommend revision topics

Future capabilities:

- Voice Conversations
- Diagram Explanation
- Image-based Questions
- Code Explanation
- Multilingual Support

---

# 📄 Context Retrieval

Before generating an answer, EduBridge retrieves relevant study material.

```text
Student Question

↓

Embedding Generation

↓

Similarity Search

↓

Relevant Chunks

↓

Gemini
```

Example

Student asks:

```text
Explain Binary Search Trees.
```

Retrieved Context

```text
Binary Search Tree is...
```

Gemini receives both the question and retrieved context, producing an answer grounded in the student's notes.

---

# 🧩 Prompt Construction

LangChain builds the final prompt.

```text
System Prompt

+

Retrieved Notes

+

Conversation History

+

Student Question

↓

Gemini
```

Example System Prompt

```text
You are an AI tutor.

Answer only using the provided study material.

If the answer is not present, clearly state that the uploaded notes do not contain enough information.
```

---

# 🗨️ Conversation Flow

```text
Question

↓

Retrieve Context

↓

Generate Answer

↓

Student Follow-up

↓

Retrieve Additional Context

↓

Generate Updated Response
```

This enables multi-turn conversations while preserving context.

---

# 📚 Chat History

Every conversation is stored.

Each session contains:

- Session ID
- Student ID
- Related Note
- Timestamp
- Messages

Example

```text
Session

↓

Question 1

↓

Answer 1

↓

Question 2

↓

Answer 2
```

Benefits

- Resume conversations
- Review previous discussions
- Track learning progress

---

# 🎓 Personalized Learning

The AI Tutor personalizes responses using:

- Uploaded notes
- Previous conversations
- Quiz performance
- Weak topics
- Learning progress

Example

```text
Student

↓

Repeated mistakes in Graphs

↓

AI recommends

Review Graph Algorithms
```

---

# 📖 Supported Questions

Students can ask:

Conceptual

```text
Explain Deadlock.
```

Definition

```text
What is Normalization?
```

Comparison

```text
Difference between Stack and Queue.
```

Summary

```text
Summarize this chapter.
```

Revision

```text
Which topics should I revise?
```

---

# 🚫 Handling Unknown Questions

If the uploaded notes do not contain relevant information:

```text
Question

↓

Search Notes

↓

No Relevant Context

↓

Respond:

"I couldn't find sufficient information in your uploaded study material to answer this question accurately."
```

This reduces hallucinations and improves trust.

---

# 📈 Learning Insights

AI Chat contributes to analytics by tracking:

- Number of questions asked
- Frequently discussed topics
- Weak concepts
- Study duration
- AI usage frequency

These metrics feed into the Progress Tracking and Teacher Dashboard modules.

---

# 🔄 End-to-End Chat Flow

```text
Student Opens AI Tutor
          │
          ▼
Ask Question
          │
          ▼
Generate Embedding
          │
          ▼
Search Vector Database
          │
          ▼
Retrieve Top Chunks
          │
          ▼
Build Prompt
          │
          ▼
Gemini Generates Response
          │
          ▼
Display Answer
          │
          ▼
Save Conversation
          │
          ▼
Update Learning Analytics
```

---

# 🌐 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/chat/message` | Send a message |
| GET | `/api/chat/history` | Get all chat sessions |
| GET | `/api/chat/history/:id` | Get a specific conversation |
| DELETE | `/api/chat/history/:id` | Delete a conversation |

---

# 🗄️ Database Structure

## Chat Session

| Field | Type |
|------|------|
| id | UUID |
| studentId | UUID |
| noteId | UUID |
| title | String |
| createdAt | DateTime |

---

## Chat Message

| Field | Type |
|------|------|
| id | UUID |
| sessionId | UUID |
| sender | Student / AI |
| message | Text |
| timestamp | DateTime |

---

# 📂 Backend Structure

```text
server/

src/

├── controllers/
│   └── chat.controller.ts
│
├── routes/
│   └── chat.routes.ts
│
├── services/
│   ├── chat.service.ts
│   ├── rag.service.ts
│   └── llm.service.ts
│
├── prompts/
│   └── tutor.prompt.ts
│
└── utils/
    └── contextRetriever.ts
```

---

# 🎨 Frontend Components

```text
components/

├── ChatWindow
├── ChatBubble
├── MessageInput
├── ConversationList
├── TypingIndicator
├── SuggestedQuestions
├── EmptyState
└── ChatHeader
```

---

# 🔒 Security Considerations

The AI Chat module follows these security practices:

- Authenticated users only.
- Access limited to the owner's uploaded notes.
- Conversations isolated per user.
- Prompt injection protection.
- Input sanitization.
- Rate limiting (Future).
- Conversation encryption at rest (Future).

---

# 🚀 Future Enhancements

Planned improvements include:

- Voice-based AI Tutor
- Image & Diagram Understanding
- Mathematical Equation Support
- Code Execution & Debugging
- Multi-language Conversations
- Citation of Source Chunks
- Suggested Follow-up Questions
- Conversation Search
- AI Memory Across Sessions
- Real-time Collaborative Tutoring

---

# 📋 Deliverables

- ✅ AI Tutor Architecture
- ✅ RAG-Based Chat Workflow
- ✅ Context Retrieval
- ✅ Prompt Construction
- ✅ Conversation Management
- ✅ Chat History
- ✅ Personalized Learning
- ✅ Unknown Question Handling
- ✅ API Endpoints
- ✅ Database Design
- ✅ Frontend Components
- ✅ Security Strategy
- ✅ Future Enhancements

---

## 📌 Document Status

**Status:** ✅ Completed

This document defines the complete AI Chat module for EduBridge. It serves as the implementation guide for building a context-aware AI tutor using Retrieval-Augmented Generation (RAG), LangChain, FAISS, and Google Gemini, delivering personalized and reliable learning experiences based on each student's uploaded study materials.