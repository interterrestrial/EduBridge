# 🗄️ Database Design

This document defines the database architecture for **EduBridge**. It outlines the database schema, entity relationships, table responsibilities, and design decisions to support authentication, personalized learning, AI interactions, quizzes, flashcards, analytics, and teacher insights.

---

# 🎯 Objectives

The database is designed to:

- Store user and authentication data securely.
- Manage uploaded study materials.
- Track AI interactions.
- Store quizzes, flashcards, and progress.
- Enable personalized learning.
- Generate classroom analytics.
- Support future scalability.

---

# 🏗️ Database Overview

**Database:** PostgreSQL

**ORM:** Prisma

**Database Type:** Relational

---

# 📊 Entity Relationship Diagram (High Level)

```text
                    User
                     │
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
     Student                  Teacher
         │
         ├───────────────┐
         │               │
         ▼               ▼
      Notes          Chat Sessions
         │               │
         ▼               ▼
   Document Chunks     Chat Messages
         │
         ▼
   Embeddings (FAISS)

Student
│
├──────────────┐
│              │
▼              ▼
Quizzes    Flashcards
│              │
▼              ▼
Attempts    Review History

Student
│
▼
Progress Analytics

Teacher
│
▼
Classroom Analytics
```

---

# 📚 Core Entities

## 1. User

Stores authentication and profile information.

### Fields

| Field | Type |
|------|------|
| id | UUID |
| name | String |
| email | String (Unique) |
| password | String (Nullable for OAuth) |
| role | Student / Teacher |
| provider | Local / Google |
| avatar | String |
| createdAt | DateTime |
| updatedAt | DateTime |

---

## 2. Student Profile

Stores student-specific information.

### Fields

- userId
- institution
- course
- semester
- learningPreference
- totalStudyHours
- createdAt

---

## 3. Teacher Profile

Stores teacher information.

### Fields

- userId
- organization
- department
- specialization
- experience
- createdAt

---

# 📄 Notes Module

## Notes

Stores uploaded study material.

### Fields

| Field | Type |
|------|------|
| id | UUID |
| title | String |
| fileName | String |
| fileType | PDF / DOCX |
| fileSize | Integer |
| uploadedBy | User ID |
| uploadDate | DateTime |
| processed | Boolean |

---

## Document Chunks

Stores processed text chunks.

### Fields

- id
- noteId
- chunkIndex
- content
- embeddingId
- createdAt

---

# 🤖 AI Chat Module

## Chat Sessions

Each AI conversation.

### Fields

- id
- studentId
- noteId
- title
- createdAt

---

## Chat Messages

Stores complete chat history.

### Fields

- id
- sessionId
- sender
- message
- timestamp

---

# 📝 Quiz Module

## Quiz

Stores generated quizzes.

### Fields

- id
- title
- studentId
- noteId
- difficulty
- totalQuestions
- createdAt

---

## Quiz Questions

### Fields

- id
- quizId
- question
- optionA
- optionB
- optionC
- optionD
- correctAnswer
- explanation

---

## Quiz Attempt

Stores student attempts.

### Fields

- id
- quizId
- studentId
- score
- timeTaken
- submittedAt

---

## Quiz Responses

Stores selected answers.

### Fields

- id
- attemptId
- questionId
- selectedOption
- isCorrect

---

# 📇 Flashcard Module

## Flashcard

### Fields

- id
- studentId
- noteId
- front
- back
- difficulty
- createdAt

---

## Flashcard Review

Tracks revision history.

### Fields

- id
- flashcardId
- reviewedAt
- confidenceLevel

---

# 📈 Progress Tracking

Stores learning progress.

### Fields

- id
- studentId
- masteryScore
- totalQuizzes
- averageScore
- weakTopics
- lastStudied
- updatedAt

---

# 📊 Teacher Analytics

Stores AI-generated analytics.

### Fields

- id
- teacherId
- totalStudents
- averagePerformance
- weakConcepts
- generatedAt

---

# 🧠 AI Recommendations

Stores AI-generated recommendations.

### Fields

- id
- studentId
- recommendation
- priority
- createdAt

---

# 🔐 Authentication

Authentication data is stored in the User table.

JWT tokens are generated dynamically and **are not stored** in the database.

Passwords are stored after hashing using **bcrypt**.

---

# 🔗 Relationships

```text
User
 │
 ├──────────── Student Profile (1:1)
 │
 ├──────────── Teacher Profile (1:1)
 │
 ├──────────── Notes (1:N)
 │
 ├──────────── Chat Sessions (1:N)
 │
 ├──────────── Quizzes (1:N)
 │
 ├──────────── Flashcards (1:N)
 │
 └──────────── Progress (1:1)

Notes
 │
 ├──────────── Chunks (1:N)
 │
 ├──────────── Quizzes (1:N)
 │
 └──────────── Flashcards (1:N)

Quiz
 │
 ├──────────── Questions (1:N)
 │
 └──────────── Attempts (1:N)

Attempt
 │
 └──────────── Responses (1:N)
```

---

# 🏛️ Normalization

The database follows **Third Normal Form (3NF)**.

Benefits:

- Eliminates redundant data.
- Improves consistency.
- Simplifies updates.
- Optimizes storage.

---

# 🚀 Scalability Considerations

The schema is designed to support future features without major structural changes.

Future additions include:

- Classrooms
- Assignments
- Study Groups
- Leaderboards
- Badges
- Parent Portal
- Notifications
- Calendar Integration
- Mobile Sync

---

# 📂 Prisma Structure

```text
server/
│
└── prisma/
    ├── schema.prisma
    └── migrations/
```

---

# 🧩 Proposed Prisma Models

- User
- StudentProfile
- TeacherProfile
- Note
- DocumentChunk
- ChatSession
- ChatMessage
- Quiz
- QuizQuestion
- QuizAttempt
- QuizResponse
- Flashcard
- FlashcardReview
- Progress
- AIRecommendation
- TeacherAnalytics

---

# 📌 Indexing Strategy

Indexes should be created on:

- email
- userId
- studentId
- teacherId
- noteId
- quizId
- createdAt

Benefits:

- Faster authentication
- Faster dashboard loading
- Improved analytics queries
- Efficient filtering

---

# 🔒 Security Considerations

- Passwords hashed using bcrypt.
- Parameterized queries through Prisma.
- UUID primary keys.
- Role-based access control.
- Foreign key constraints.
- Cascade delete where appropriate.

---

# 📋 Deliverables

- ✅ Database Selection
- ✅ Entity Relationship Design
- ✅ Table Definitions
- ✅ Relationship Mapping
- ✅ Authentication Schema
- ✅ Quiz Database Design
- ✅ Flashcard Database Design
- ✅ AI Chat Database Design
- ✅ Analytics Design
- ✅ Prisma Model List
- ✅ Security Strategy
- ✅ Scalability Plan

---

## 📌 Document Status

**Status:** ✅ Completed

This database design provides a scalable and maintainable relational schema for EduBridge, supporting personalized learning, AI-powered features, and future platform expansion.