# 🗂️ Flashcard Engine

This document defines the architecture, workflow, and implementation of the **Flashcard Engine** in EduBridge. The Flashcard Engine automatically generates concise, AI-powered flashcards from uploaded study material, helping students reinforce key concepts through active recall and spaced revision.

Instead of manually creating flashcards, students can instantly generate personalized study cards directly from their notes using Artificial Intelligence.

---

# 🎯 Objectives

The Flashcard Engine is designed to:

- Automatically generate flashcards from uploaded notes.
- Highlight important concepts and definitions.
- Support active recall learning.
- Improve long-term memory retention.
- Personalize revision based on student performance.
- Integrate with the AI Tutor and Progress Tracker.

---

# 🏗️ System Overview

```text
                 Student
                    │
                    ▼
            Select Study Notes
                    │
                    ▼
           Retrieve Document
                    │
                    ▼
        Extract Important Concepts
                    │
                    ▼
          Google Gemini API
                    │
                    ▼
         Generate Flashcards
                    │
                    ▼
         Save Flashcards
                    │
                    ▼
          Review & Practice
```

---

# 📚 Flashcard Workflow

```text
Student Opens Flashcards
            │
            ▼
Choose Notes
            │
            ▼
Retrieve Document
            │
            ▼
Identify Key Topics
            │
            ▼
Generate Flashcards
            │
            ▼
Store Database
            │
            ▼
Display Flashcards
```

---

# 🧠 Flashcard Generation Pipeline

```text
Uploaded Notes

↓

Text Extraction

↓

Chunk Selection

↓

Important Concepts

↓

Gemini

↓

Question

↓

Answer

↓

Flashcard
```

---

# ✨ AI Responsibilities

The AI identifies:

- Definitions
- Important Concepts
- Key Terminology
- Algorithms
- Formulas
- Dates
- Theorems
- Frequently Asked Questions
- Exam-Oriented Topics

Instead of copying entire paragraphs, the AI extracts only the most important information.

---

# 📖 Flashcard Structure

Each flashcard contains two sides.

```text
-------------------------

Question

What is Virtual Memory?

-------------------------

↓

Flip

↓

-------------------------

Answer

Virtual Memory is a memory
management technique that
uses disk storage to extend RAM.

-------------------------
```

---

# 🗂️ Flashcard Categories

Flashcards can be organized by:

- Subject
- Uploaded Document
- Topic
- Difficulty

Example

```text
Operating Systems

├── Memory Management

├── Deadlocks

├── Scheduling

└── File Systems
```

---

# 🎯 Flashcard Types

The Flashcard Engine supports multiple card formats.

## Definition Cards

```text
Question

What is Deadlock?

↓

Answer

A situation where two or more
processes wait indefinitely
for each other.
```

---

## Concept Cards

```text
Question

Explain Process Scheduling.

↓

Answer

The operating system selects
which process should execute next.
```

---

## Formula Cards

```text
Question

Area of Circle

↓

Answer

πr²
```

---

## Comparison Cards

```text
Question

Difference between Stack and Queue

↓

Answer

Stack → LIFO

Queue → FIFO
```

---

## Fill in the Blank (Future)

```text
Question

Binary Search works only on
________ arrays.

↓

Answer

Sorted
```

---

# 🔄 Flashcard Review Workflow

```text
Student Opens Flashcards
            │
            ▼
Review Question
            │
            ▼
Reveal Answer
            │
            ▼
Mark Confidence
            │
            ▼
Update Progress
```

---

# 📊 Confidence Levels

After reviewing each flashcard, students can rate their understanding.

Levels

- 😄 Easy
- 🙂 Good
- 😐 Medium
- 😕 Difficult
- 😫 Need Revision

These ratings help personalize future revision sessions.

---

# 🧠 Personalized Revision

The Flashcard Engine prioritizes cards based on:

- Weak quiz topics
- Frequently incorrect answers
- Low confidence ratings
- Recently uploaded notes
- Topics not reviewed recently

Workflow

```text
Quiz Results

↓

Weak Concepts

↓

Generate Flashcards

↓

Prioritize Review
```

---

# 🔁 Revision Cycle

```text
Generate Flashcards

↓

Study

↓

Review

↓

Rate Confidence

↓

AI Updates Priority

↓

Future Revision
```

---

# 📈 Progress Tracking

The Flashcard Engine records:

- Total Flashcards
- Cards Reviewed
- Review Sessions
- Average Confidence
- Difficult Cards
- Revision Frequency

Example

```text
Flashcards

245

Reviewed

188

Average Confidence

82%

Need Revision

21 Cards
```

---

# 🤖 AI Prompt Workflow

```text
Document

↓

Relevant Text

↓

Prompt Builder

↓

Gemini

↓

Flashcards

↓

Database
```

Example Prompt

```text
Generate concise educational flashcards
from the provided study material.

Each flashcard should contain:

- One clear question
- One concise answer

Focus only on important concepts.
```

---

# 📚 Flashcard Storage

Each flashcard stores:

| Field | Description |
|---------|-------------|
| Flashcard ID | Unique identifier |
| Student ID | Owner |
| Note ID | Source document |
| Topic | Related concept |
| Question | Front side |
| Answer | Back side |
| Difficulty | AI-generated level |
| Confidence | Student rating |
| Created At | Timestamp |

---

# 🔍 Search & Filter

Students can filter flashcards by:

- Subject
- Note
- Difficulty
- Topic
- Confidence Level
- Recently Reviewed

Search supports:

- Question text
- Keywords
- Topic names

---

# 🌐 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/flashcards/generate` | Generate flashcards |
| GET | `/api/flashcards` | Fetch all flashcards |
| GET | `/api/flashcards/:id` | Fetch flashcard |
| PUT | `/api/flashcards/:id/review` | Save review rating |
| DELETE | `/api/flashcards/:id` | Delete flashcard |

---

# 🗄️ Database Structure

## Flashcard

| Field | Type |
|------|------|
| id | UUID |
| studentId | UUID |
| noteId | UUID |
| topic | String |
| question | Text |
| answer | Text |
| difficulty | Enum |
| createdAt | DateTime |

---

## Flashcard Review

| Field | Type |
|------|------|
| id | UUID |
| flashcardId | UUID |
| confidence | Integer |
| reviewedAt | DateTime |

---

# 📂 Backend Structure

```text
server/

src/

├── controllers/
│   └── flashcard.controller.ts
│
├── routes/
│   └── flashcard.routes.ts
│
├── services/
│   ├── flashcard.service.ts
│   ├── aiFlashcard.service.ts
│   └── review.service.ts
│
├── prompts/
│   └── flashcard.prompt.ts
│
└── utils/
    └── flashcardFormatter.ts
```

---

# 🎨 Frontend Components

```text
components/

├── FlashcardDeck
├── Flashcard
├── FlashcardGrid
├── ReviewModal
├── ConfidenceSelector
├── ProgressBar
├── TopicFilter
└── SearchBar
```

---

# 🔒 Security Considerations

The Flashcard Engine follows these security practices:

- JWT authentication required.
- Students access only their own flashcards.
- Flashcards are linked to owned notes.
- AI generation is restricted to authorized documents.
- Review history is stored securely.

---

# 🚀 Future Enhancements

Future versions may include:

- Spaced Repetition Algorithm (SM-2/FSRS)
- Voice-Based Flashcards
- Image Flashcards
- Diagram-Based Cards
- Cloze Deletion Cards
- Shared Flashcard Decks
- Offline Flashcard Mode
- Gamified Revision
- AI Difficulty Adaptation
- Flashcard Export (PDF/Anki)

---

# 📋 Deliverables

- ✅ Flashcard Generation Pipeline
- ✅ AI-Powered Concept Extraction
- ✅ Flashcard Types
- ✅ Review Workflow
- ✅ Confidence Tracking
- ✅ Personalized Revision
- ✅ Progress Analytics
- ✅ API Endpoints
- ✅ Database Design
- ✅ Frontend Components
- ✅ Security Strategy
- ✅ Future Enhancements

---

## 📌 Document Status

**Status:** ✅ Completed

This document defines the complete Flashcard Engine for EduBridge. It serves as the implementation guide for automatically generating intelligent flashcards from student-uploaded study materials, enabling efficient revision, active recall, and personalized learning through AI-powered content generation.