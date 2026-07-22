# 🏗️ Backend Architecture

This document defines the architecture, folder structure, request lifecycle, service layers, AI integration, database interaction, and security model of the **EduBridge** backend. The backend is built using **Node.js**, **Express.js**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**, providing a scalable and maintainable foundation for AI-powered personalized learning.

The backend follows a **layered architecture**, separating routing, controllers, business logic, database access, and AI services to improve modularity, testability, and scalability.

---

# 🎯 Objectives

The Backend Architecture is designed to:

- Build scalable REST APIs.
- Separate business logic from HTTP handling.
- Secure application data.
- Integrate AI services seamlessly.
- Support Retrieval-Augmented Generation (RAG).
- Enable future microservice migration.
- Maintain clean and reusable code.

---

# 🏗️ High-Level Architecture

```text
              Frontend (Next.js)
                     │
               HTTPS Requests
                     │
                     ▼
              Express Server
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
 Authentication   Controllers    Middleware
      │              │              │
      └──────────────┼──────────────┘
                     ▼
              Service Layer
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
 Database      AI Services      File Storage
      │              │
      ▼              ▼
 PostgreSQL      Gemini + RAG
```

---

# 📚 Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Authentication | JWT |
| AI | Google Gemini |
| AI Framework | LangChain |
| Vector Store | FAISS |
| File Upload | Multer |
| Validation | Zod / Express Validator (Future) |

---

# 📂 Project Structure

```text
server/

src/

├── config/
├── controllers/
├── middlewares/
├── routes/
├── services/
├── repositories/
├── prisma/
├── prompts/
├── utils/
├── types/
├── interfaces/
├── constants/
├── lib/
├── uploads/
├── app.ts
└── server.ts
```

---

# 🛣️ Routing Layer

Routes define API endpoints and forward requests to controllers.

```text
routes/

├── auth.routes.ts
├── notes.routes.ts
├── chat.routes.ts
├── quiz.routes.ts
├── flashcard.routes.ts
├── progress.routes.ts
├── teacher.routes.ts
├── rag.routes.ts
└── vector.routes.ts
```

Responsibilities:

- Define endpoints
- Apply middleware
- Delegate request handling

---

# 🎮 Controller Layer

Controllers receive validated HTTP requests and coordinate application logic.

Responsibilities:

- Parse request data
- Call service methods
- Handle responses
- Return HTTP status codes

Example

```text
POST /chat/message

↓

chat.controller.ts

↓

chat.service.ts
```

Controllers should contain minimal business logic.

---

# ⚙️ Service Layer

The service layer contains the core business logic.

```text
services/

├── auth.service.ts
├── user.service.ts
├── notes.service.ts
├── chat.service.ts
├── quiz.service.ts
├── flashcard.service.ts
├── progress.service.ts
├── analytics.service.ts
├── rag.service.ts
├── embedding.service.ts
├── vector.service.ts
└── prompt.service.ts
```

Responsibilities:

- Business rules
- AI orchestration
- Database coordination
- Validation
- External API calls

---

# 🗃️ Repository Layer

Repositories encapsulate all database operations.

```text
repositories/

├── user.repository.ts
├── note.repository.ts
├── quiz.repository.ts
├── flashcard.repository.ts
├── progress.repository.ts
└── analytics.repository.ts
```

Benefits:

- Cleaner services
- Easier testing
- Database abstraction
- Reduced code duplication

---

# 🗄️ Database Layer

Prisma ORM provides database access.

```text
Service

↓

Repository

↓

Prisma Client

↓

PostgreSQL
```

Responsibilities:

- CRUD operations
- Transactions
- Relationships
- Query optimization

---

# 🤖 AI Services

Dedicated services manage AI functionality.

```text
AI Services

├── Gemini API
├── Prompt Builder
├── RAG Engine
├── Embedding Service
├── Vector Search
├── Quiz Generator
├── Flashcard Generator
└── Recommendation Engine
```

Each AI feature is isolated to simplify maintenance and future model upgrades.

---

# 🧠 RAG Integration

```text
Student Question
        │
        ▼
Retrieve Embeddings
        │
        ▼
Semantic Search
        │
        ▼
Build Prompt
        │
        ▼
Google Gemini
        │
        ▼
Return Response
```

The backend coordinates the complete Retrieval-Augmented Generation workflow.

---

# 📄 File Upload Workflow

```text
Student Uploads PDF

↓

Multer Middleware

↓

Store File

↓

Extract Text

↓

Chunk Document

↓

Generate Embeddings

↓

Store Metadata

↓

Ready for AI
```

---

# 🔄 Request Lifecycle

```text
HTTP Request
       │
       ▼
Express Route
       │
       ▼
Authentication Middleware
       │
       ▼
Validation Middleware
       │
       ▼
Controller
       │
       ▼
Service
       │
       ▼
Repository
       │
       ▼
Prisma ORM
       │
       ▼
PostgreSQL
       │
       ▼
Response
```

---

# 🔐 Authentication Flow

```text
Login Request

↓

Verify Credentials

↓

Generate JWT

↓

Return Token

↓

Authenticated Requests
```

JWT middleware validates every protected request before business logic executes.

---

# 🛡️ Middleware

Middleware is used for:

- JWT Authentication
- Role Authorization
- Request Validation
- Error Handling
- File Upload
- Logging
- CORS
- JSON Parsing
- Rate Limiting (Future)

Folder

```text
middlewares/

├── auth.middleware.ts
├── role.middleware.ts
├── validation.middleware.ts
├── upload.middleware.ts
├── error.middleware.ts
└── logger.middleware.ts
```

---

# 📂 Utility Layer

Shared helper functions are stored in the utilities folder.

```text
utils/

├── jwt.ts
├── hash.ts
├── chunkGenerator.ts
├── textCleaner.ts
├── promptFormatter.ts
├── responseHandler.ts
└── errorHandler.ts
```

---

# 📁 Configuration Layer

Configuration files centralize environment-specific settings.

```text
config/

├── database.ts
├── jwt.ts
├── gemini.ts
├── prisma.ts
├── multer.ts
└── environment.ts
```

Environment variables include:

- Database URL
- JWT Secret
- Gemini API Key
- Google OAuth Credentials
- Application Port

---

# 🌐 External Integrations

The backend communicates with:

```text
Google Gemini

↓

Google Embeddings

↓

FAISS

↓

PostgreSQL

↓

Google OAuth
```

These integrations are encapsulated inside dedicated service modules.

---

# ⚠️ Error Handling

A centralized error handler manages application errors.

Example

```json
{
  "success": false,
  "message": "Resource not found.",
  "errors": []
}
```

Handled errors include:

- Validation errors
- Authentication failures
- Authorization failures
- Database exceptions
- AI service failures
- File upload errors

---

# 📊 Logging

Application logging captures:

- Incoming requests
- API execution time
- Errors
- AI processing events
- Authentication events

Future improvements:

- Winston
- Pino
- Cloud logging integration

---

# ⚡ Performance Optimizations

To improve backend performance:

- Database indexing
- Connection pooling
- Efficient Prisma queries
- Batch embedding generation
- AI response caching
- Lazy loading
- Asynchronous background jobs
- Optimized file processing

---

# 🔒 Security Considerations

The backend follows these security practices:

- JWT Authentication
- Password hashing using bcrypt
- Role-Based Access Control (RBAC)
- Prisma ORM to prevent SQL injection
- File type and size validation
- HTTPS in production
- Environment variable management
- Input validation and sanitization
- Rate limiting (Future)
- Secure error responses without exposing internal details

---

# 🚀 Scalability Strategy

The architecture is designed to support future growth.

Potential enhancements:

- Microservices
- Redis caching
- Background job queues (BullMQ)
- Docker containerization
- Kubernetes deployment
- Horizontal API scaling
- Cloud object storage for uploaded files
- Distributed vector databases
- Event-driven architecture

---

# 📋 Deliverables

- ✅ Layered Backend Architecture
- ✅ Folder Structure
- ✅ Routing Layer
- ✅ Controller Layer
- ✅ Service Layer
- ✅ Repository Pattern
- ✅ Prisma Integration
- ✅ AI Services
- ✅ RAG Workflow
- ✅ File Upload Pipeline
- ✅ Request Lifecycle
- ✅ Authentication Flow
- ✅ Middleware Design
- ✅ Configuration Management
- ✅ Error Handling
- ✅ Logging Strategy
- ✅ Performance Optimizations
- ✅ Security Strategy
- ✅ Scalability Roadmap

---

## 📌 Document Status

**Status:** ✅ Completed

This document defines the complete Backend Architecture for EduBridge. It serves as the implementation guide for building a secure, scalable, and modular backend that powers user authentication, note management, AI tutoring, quiz generation, flashcards, progress tracking, teacher analytics, and the Retrieval-Augmented Generation (RAG) pipeline using Node.js, Express.js, Prisma, PostgreSQL, Google Gemini, and FAISS.