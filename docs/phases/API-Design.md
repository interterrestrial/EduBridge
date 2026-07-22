# 🌐 API Design

This document defines the API architecture, standards, endpoints, authentication mechanisms, request/response formats, and implementation guidelines for **EduBridge**. The APIs serve as the communication layer between the frontend, backend, AI services, and database.

EduBridge follows a **RESTful API architecture** using **Node.js**, **Express.js**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**, with JWT-based authentication and AI integrations powered by Google Gemini.

---

# 🎯 Objectives

The API layer is designed to:

- Provide secure communication between client and server.
- Support CRUD operations for all resources.
- Enable AI-powered learning features.
- Follow RESTful principles.
- Maintain scalability and consistency.
- Support future mobile applications.
- Ensure secure authentication and authorization.

---

# 🏗️ High-Level Architecture

```text
                Frontend (Next.js)
                       │
                  HTTPS Requests
                       │
                       ▼
               Express REST API
                       │
      ┌────────────────┼────────────────┐
      │                │                │
      ▼                ▼                ▼
 Authentication     Business Logic    AI Services
      │                │                │
      └────────────────┼────────────────┘
                       ▼
                Prisma ORM
                       │
                       ▼
                 PostgreSQL
```

---

# 📚 API Design Principles

EduBridge APIs follow these principles:

- RESTful architecture
- Resource-based endpoints
- Stateless requests
- JWT authentication
- Consistent response formats
- Proper HTTP status codes
- Input validation
- Role-Based Access Control (RBAC)
- Version-ready endpoint structure

---

# 🌍 Base URL

Development

```text
http://localhost:5000/api
```

Production

```text
https://your-domain.com/api
```

---

# 🔐 Authentication

Most endpoints require a JWT access token.

Example Header

```http
Authorization: Bearer <JWT_TOKEN>
```

Protected endpoints automatically verify:

- Token validity
- User identity
- User role
- Token expiration

---

# 📦 Standard Request Structure

Example

```json
{
  "title": "Operating Systems Notes",
  "description": "Semester 3 Notes"
}
```

---

# 📤 Standard Response Structure

Successful Response

```json
{
  "success": true,
  "message": "Request completed successfully.",
  "data": {}
}
```

Error Response

```json
{
  "success": false,
  "message": "Invalid request.",
  "errors": []
}
```

---

# 📊 HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Resource Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

# 👤 Authentication APIs

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login |
| POST | `/auth/google` | Google OAuth |
| POST | `/auth/logout` | Logout |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Current user |

---

# 👨‍🎓 Student APIs

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/students/profile` | Student profile |
| PUT | `/students/profile` | Update profile |
| GET | `/students/dashboard` | Dashboard data |

---

# 📄 Notes APIs

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/notes/upload` | Upload notes |
| GET | `/notes` | Get all notes |
| GET | `/notes/:id` | Get note |
| PUT | `/notes/:id` | Update note |
| DELETE | `/notes/:id` | Delete note |

---

# 🤖 AI Tutor APIs

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/chat/message` | Ask AI Tutor |
| GET | `/chat/history` | Chat history |
| DELETE | `/chat/history` | Clear history |

---

# 📝 Quiz APIs

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/quizzes/generate` | Generate quiz |
| GET | `/quizzes` | Quiz history |
| GET | `/quizzes/:id` | Quiz details |
| POST | `/quizzes/:id/submit` | Submit quiz |
| GET | `/quizzes/:id/result` | Quiz result |

---

# 🗂️ Flashcard APIs

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/flashcards/generate` | Generate flashcards |
| GET | `/flashcards` | Get flashcards |
| PUT | `/flashcards/:id/review` | Save review |
| DELETE | `/flashcards/:id` | Delete flashcard |

---

# 📈 Progress APIs

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/progress` | Progress summary |
| GET | `/progress/analytics` | Learning analytics |
| GET | `/progress/timeline` | Activity timeline |
| GET | `/progress/recommendations` | AI recommendations |

---

# 👨‍🏫 Teacher APIs

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/teacher/analytics` | Classroom analytics |
| GET | `/teacher/students` | Student list |
| GET | `/teacher/student/:id` | Student report |
| GET | `/teacher/topics` | Topic analysis |

---

# 🧠 RAG APIs

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/rag/process` | Process uploaded document |
| POST | `/rag/search` | Retrieve relevant chunks |
| POST | `/embeddings/generate` | Generate embeddings |
| POST | `/vector/search` | Semantic search |

---

# 📁 File Upload API

```http
POST /notes/upload
```

Content Type

```text
multipart/form-data
```

Request

```text
File

Title

Description
```

Response

```json
{
  "success": true,
  "fileId": "uuid"
}
```

---

# 💬 AI Chat API

Request

```http
POST /chat/message
```

Body

```json
{
  "message": "Explain Deadlock."
}
```

Response

```json
{
  "success": true,
  "response": "Deadlock is..."
}
```

---

# 📝 Quiz Generation API

Request

```json
{
  "noteId": "uuid",
  "difficulty": "medium",
  "questionCount": 10
}
```

Response

```json
{
  "success": true,
  "quizId": "uuid"
}
```

---

# 🗂️ Flashcard Generation API

Request

```json
{
  "noteId": "uuid",
  "count": 20
}
```

Response

```json
{
  "success": true,
  "flashcardsGenerated": 20
}
```

---

# 📄 Pagination

Endpoints returning collections support pagination.

Example

```http
GET /notes?page=1&limit=10
```

Response

```json
{
  "page": 1,
  "limit": 10,
  "total": 52,
  "data": []
}
```

---

# 🔍 Filtering & Sorting

Supported query parameters:

```text
?search=operating

?topic=dbms

?sort=createdAt

?order=desc
```

---

# 📂 API Folder Structure

```text
server/

src/

├── routes/
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── note.routes.ts
│   ├── chat.routes.ts
│   ├── quiz.routes.ts
│   ├── flashcard.routes.ts
│   ├── progress.routes.ts
│   ├── teacher.routes.ts
│   ├── rag.routes.ts
│   └── vector.routes.ts
│
├── controllers/
│
├── services/
│
├── middlewares/
│
├── validators/
│
└── utils/
```

---

# 🔄 API Request Lifecycle

```text
Client Request
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
Business Service
       │
       ▼
Database / AI Service
       │
       ▼
Controller
       │
       ▼
HTTP Response
```

---

# 🛡️ Middleware

EduBridge uses middleware for:

- JWT Authentication
- Role Authorization
- Request Validation
- File Upload Handling
- Error Handling
- Logging
- Rate Limiting (Future)
- CORS
- Request Parsing

---

# ⚠️ Error Handling

Standard error response:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format."
    }
  ]
}
```

---

# 🔒 Security Considerations

The API layer follows these security practices:

- JWT Authentication
- Password hashing (bcrypt)
- Role-Based Access Control (RBAC)
- HTTPS-only communication
- Input validation
- File type validation
- SQL Injection prevention via Prisma
- XSS protection
- CORS configuration
- Rate limiting (Future)

---

# ⚡ Performance Optimizations

To improve API performance:

- Database indexing
- Response pagination
- Query optimization
- Lazy loading
- AI response caching
- Asynchronous document processing
- Efficient Prisma queries
- Compression middleware

---

# 🚀 API Versioning Strategy

Future API versions will follow URI versioning.

Example

```text
/api/v1/auth/login

/api/v1/chat/message

/api/v2/chat/message
```

This allows backward compatibility as the platform evolves.

---

# 📋 Deliverables

- ✅ RESTful API Architecture
- ✅ Authentication APIs
- ✅ Student APIs
- ✅ Notes APIs
- ✅ AI Tutor APIs
- ✅ Quiz APIs
- ✅ Flashcard APIs
- ✅ Progress APIs
- ✅ Teacher APIs
- ✅ RAG APIs
- ✅ Standard Request/Response Format
- ✅ API Lifecycle
- ✅ Middleware Design
- ✅ Security Strategy
- ✅ Performance Optimizations
- ✅ Versioning Strategy

---

## 📌 Document Status

**Status:** ✅ Completed

This document defines the complete API design for EduBridge. It serves as the implementation guide for building secure, scalable, and maintainable REST APIs that power user authentication, AI tutoring, note management, quizzes, flashcards, progress tracking, teacher analytics, and Retrieval-Augmented Generation (RAG) services.