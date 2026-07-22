# 🛠️ Technology Stack

## 🎨 Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | Full-stack React framework for building the web application |
| **React 19** | Component-based UI development |
| **TypeScript** | Type safety, maintainability, and improved developer experience |
| **Tailwind CSS** | Utility-first responsive styling |
| **Framer Motion** | Animations and smooth user interactions |
| **Axios** | API communication between frontend and backend |

### Responsibilities

- Landing Page
- Student Dashboard
- Teacher Dashboard
- AI Chat Interface
- Quiz Interface
- Flashcard Viewer
- File Upload Interface
- Learning Analytics Dashboard
- Authentication Pages

---

# ⚙️ Backend

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | REST API framework |
| **TypeScript** | End-to-end type safety across backend services |

### Responsibilities

- Authentication APIs
- User Management
- Notes Management
- Quiz APIs
- Flashcard APIs
- AI Service Integration
- File Upload Processing
- Database Communication
- Role-based Authorization

---

# 🗄️ Database

| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary relational database |
| **Prisma ORM** | Database modeling, migrations, and type-safe queries |

## Stores

- Users
- Student Profiles
- Teacher Profiles
- Uploaded Notes
- Quiz Attempts
- Flashcards
- Progress Reports
- Learning Analytics
- User Preferences
- Chat History (Optional)

---

# 🔐 Authentication & Security

| Technology | Purpose |
|------------|---------|
| **JWT (JSON Web Tokens)** | Secure authentication and session management |
| **Google OAuth 2.0** | One-click social login |
| **Email & Password Authentication** | Traditional authentication |
| **bcrypt** | Password hashing and security |

### Features

- Student Login
- Teacher Login
- Protected Routes
- Role-Based Authorization
- Secure Password Storage

---

# 🤖 Artificial Intelligence Stack

| Technology | Purpose |
|------------|---------|
| **Google Gemini API** | AI reasoning, tutoring, and content generation |
| **LangChain** | LLM orchestration, prompt management, and RAG pipeline |

### Gemini Responsibilities

- AI Tutor
- Concept Explanation
- Question Answering
- Quiz Generation
- Flashcard Generation
- Personalized Revision
- Teacher Recommendations
- Student Feedback

### LangChain Responsibilities

- Prompt Templates
- Document Retrieval
- RAG Pipeline
- Conversation Memory
- AI Chains
- LLM Orchestration

---

# 📚 Retrieval-Augmented Generation (RAG)

| Technology | Purpose |
|------------|---------|
| **Google Embeddings** | Convert study material into vector embeddings |
| **FAISS** | Store and search embeddings efficiently |

### Workflow

- Process uploaded notes
- Split documents into chunks
- Generate vector embeddings
- Store embeddings
- Retrieve relevant context
- Pass context to Gemini
- Generate accurate responses

---

# 📄 File Processing

| Technology | Purpose |
|------------|---------|
| **PDF Parser** | Extract text from uploaded PDFs |
| **Text Chunking** | Split large documents into manageable chunks |

### Responsibilities

- Upload Notes
- PDF Parsing
- Document Processing
- Chunk Generation
- Embedding Preparation

---

# 🚀 Deployment

| Technology | Purpose |
|------------|---------|
| **Render** | Frontend & Backend Hosting |
| **GitHub** | Version Control & Collaboration |

---

# 🧰 Development Tools

- Git
- GitHub
- VS Code
- Postman
- npm

---

# 🏛️ System Architecture

```text
                           Student / Teacher
                                  │
                     ┌─────────────────────────┐
                     │  Next.js Frontend (TS)  │
                     └─────────────────────────┘
                                  │
                            REST API (HTTPS)
                                  │
                     ┌─────────────────────────┐
                     │ Express Backend (TS)    │
                     └─────────────────────────┘
                                  │
      ┌───────────────┬───────────────┬────────────────┐
      │               │               │                │
      ▼               ▼               ▼                ▼
 PostgreSQL      Authentication     AI Service      File Storage
      │         JWT + OAuth2         │               │
      │               │              │               │
      ▼               │              ▼               ▼
 Prisma ORM           │        LangChain        Uploaded PDFs
                      │              │
                      │              ▼
                      │      Embedding Model
                      │              │
                      │              ▼
                      │           FAISS
                      │              │
                      └──────────────┼──────────────┐
                                     ▼
                                Gemini API
```

---

# 🔄 AI Processing Pipeline

```text
Student Uploads Notes
            │
            ▼
      PDF Processing
            │
            ▼
      Text Chunking
            │
            ▼
 Generate Embeddings
            │
            ▼
   Store in FAISS
            │
            ▼
 Student Asks Question
            │
            ▼
 Semantic Search
            │
            ▼
Retrieve Relevant Chunks
            │
            ▼
 LangChain Prompt Builder
            │
            ▼
      Gemini API
            │
            ▼
 Personalized Response
```

---

# 📂 Project Folder Structure

```text
edubridge/
│
├── client/                         # Next.js Frontend
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   └── public/
│
├── server/                         # Express Backend
│   ├── src/
│   │   ├── ai/                     # AI Services
│   │   │   ├── embeddings/
│   │   │   ├── langchain/
│   │   │   ├── prompts/
│   │   │   ├── rag/
│   │   │   └── services/
│   │   │
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── prisma/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── uploads/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   └── package.json
│
├── shared/                         # Shared Types & Interfaces
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── phases/
│
├── .env.example
├── .gitignore
├── docker-compose.yml              # Optional (Future)
├── README.md
└── package.json
```

---

# 📌 Why This Stack?

### Why PostgreSQL?

- Reliable relational database
- Excellent support for complex relationships
- Easy integration with Prisma
- Production-ready
- Perfect for storing users, quizzes, analytics, and learning data

---

### Why Prisma?

- Type-safe database queries
- Automatic migrations
- Cleaner code
- Excellent TypeScript support

---

### Why Gemini?

Gemini acts as the intelligence layer of EduBridge.

It is responsible for:

- Answering student questions
- Explaining concepts
- Generating quizzes
- Creating flashcards
- Providing personalized revision
- Generating teacher recommendations

---

### Why LangChain?

LangChain simplifies working with LLMs by providing:

- Prompt management
- RAG orchestration
- Document retrieval
- Conversation memory
- AI workflow chaining

---

### Why FAISS?

FAISS enables semantic search over uploaded study materials by storing vector embeddings, allowing the AI to retrieve only the most relevant content instead of processing entire documents.

---

### Why Express + TypeScript?

- Unified language across the project
- Faster development
- Excellent middleware ecosystem
- Easy REST API creation
- Strong community support