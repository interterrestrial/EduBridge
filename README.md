# 🌉 EduBridge

### Bridging the Gap Between Teachers and Students Through Personalized AI Learning

EduBridge is an AI-powered personalized learning platform designed to transform the way students learn and teachers teach. By combining intelligent tutoring, adaptive assessments, personalized revision, and classroom analytics, EduBridge ensures every student receives individualized attention while empowering teachers with actionable insights.

---

## 📌 Project Overview

In traditional classrooms, one teacher often manages dozens of students, each with different learning speeds, strengths, weaknesses, and interests. Providing personalized attention to every learner is nearly impossible.

EduBridge bridges this gap by creating an AI learning companion for every student. It understands each learner's progress, identifies knowledge gaps, adapts explanations, generates targeted revision materials, and continuously tracks improvement. At the same time, teachers receive real-time analytics and recommendations, enabling them to provide focused support where it is needed most.

---

## 🎯 Objectives

- Deliver personalized learning experiences for every student.
- Assist teachers in identifying struggling students and difficult concepts.
- Improve knowledge retention through adaptive revision techniques.
- Generate intelligent quizzes and flashcards based on individual learning progress.
- Provide an AI tutor capable of contextual and interactive learning.
- Monitor student mastery and learning trends.
- Enhance classroom effectiveness using AI-powered insights.

---

# ✨ Features

## 👨‍🎓 Student Portal

- Secure Custom JWT & Google OAuth Authentication
- Upload Notes, PDFs, and Study Material
- AI Tutor for Personalized Learning
- AI Chat with Context-Aware Responses
- AI Flashcard Generator
- Adaptive Quiz Generator
- AI-Generated Study Timetables
- Gamified Progress & Mastery Tracking
- Learning Analytics & Performance Tracking
- Weak Topic Identification

---

## 👨‍🏫 Teacher Dashboard

- Classroom Overview & Enrollment Management
- Student Performance Analytics
- Real-Time Classroom Weak Topic Heatmap
- Push Targeted Remedial Notes to Struggling Students
- Monitor Student Mastery vs. Exam Averages
- AI-generated Student Reports
- Classroom Trend Analysis

---

# 🤖 AI Capabilities

EduBridge leverages Artificial Intelligence to create a unique learning experience for every student by:

- Processing uploaded notes and study materials using semantic embeddings
- Providing context-aware tutoring using Retrieval-Augmented Generation (RAG)
- Generating adaptive quizzes based on learning history
- Creating personalized flashcards and study agendas
- Identifying misconceptions and weak concepts
- Tracking student mastery over time
- Recommending targeted revision plans
- Providing teachers with AI-powered classroom insights

---

# 🛠️ Tech Stack

## Frontend

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Chart.js (for gamified progress visualization)

## Backend

- Node.js
- Express.js
- TypeScript

## Artificial Intelligence

- Google Gemini API
- LangChain
- FAISS Vector Database (faiss-node)
- Retrieval-Augmented Generation (RAG)

## Database

- PostgreSQL
- Prisma ORM

## Authentication

- Custom JWT Auth
- Google OAuth 2.0 (@react-oauth/google & google-auth-library)

## Deployment

- Vercel (Frontend)
- Render (Backend)

---

# 📂 Project Structure

```text
edubridge/
│
├── client/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/            # App Router Pages
│   │   ├── components/     # UI & Layout Components
│   │   ├── hooks/          # Custom React Hooks
│   │   └── lib/            # Utilities & API client
│   └── public/             # Static Assets
│
├── server/                 # Express Backend
│   ├── src/
│   │   ├── controllers/    # Route Handlers
│   │   ├── routes/         # Express Routes
│   │   ├── services/       # AI & RAG Logic
│   │   ├── middleware/     # Auth & Upload Middleware
│   │   └── config/         # Environment Configs
│   ├── prisma/             # Prisma Schema & Migrations
│   └── uploads/            # Temporary PDF Storage
│
└── README.md
```

---

# 📖 How EduBridge Works

### Step 1

Students upload notes, PDFs, or learning materials.

↓

### Step 2

The AI processes the content, creates semantic embeddings, and builds a searchable FAISS knowledge base.

↓

### Step 3

Students interact with their personalized AI Tutor to understand concepts.

↓

### Step 4

The system continuously evaluates quiz performance and identifies knowledge gaps.

↓

### Step 5

EduBridge generates adaptive quizzes, personalized flashcards, and AI timetables tailored to each learner.

↓

### Step 6

Teachers receive real-time insights into classroom performance via heatmaps, and can instantly push remedial notes to students who need extra support.

---

# 🧠 AI Workflow

1. Upload Study Material
2. Document Processing & Parsing (pdf-parse)
3. Text Chunking (LangChain)
4. Embedding Generation (Google GenAI)
5. Vector Database Storage (FAISS)
6. Retrieval-Augmented Generation (RAG)
7. Personalized AI Tutoring
8. Adaptive Quiz Generation
9. Flashcard & Timetable Creation
10. Progress & Mastery Tracking
11. Teacher Heatmap Analytics

---

# 🌉 Why EduBridge?

Traditional education struggles to personalize learning because teachers cannot individually monitor every student's progress.

EduBridge solves this challenge by acting as an intelligent bridge between teachers and students.

Instead of replacing teachers, EduBridge enhances classroom learning by providing every student with an AI learning mentor while equipping teachers with the insights needed to make informed educational decisions.

---

# 📊 Key Modules

- AI Tutor & Chat
- Note Management & Semantic Search
- Flashcard Generator
- Adaptive Quiz Engine
- Gamified Progress Dashboard
- AI Study Timetable
- Student Dashboard
- Teacher Dashboard
- Learning Analytics & Mastery Tracking
- Classroom Heatmap Insights
- Direct Remedial Note Pushing

---

# 🚀 Future Improvements

- Voice-based AI Tutor
- OCR Support for Handwritten Notes
- AI-powered Doubt Detection
- Real-time Classroom Collaboration
- Global Leaderboards
- Mobile Application
- Multi-language Support
- Calendar & LMS Integration

---

# 📚 Learning Outcomes

This project demonstrates practical experience with:

- Retrieval-Augmented Generation (RAG)
- Large Language Models (LLMs) & Prompt Engineering
- Vector Databases (FAISS)
- Educational Technology (EdTech)
- Full-Stack Web Development (Next.js & Node.js)
- Authentication (JWT & OAuth)
- RESTful APIs
- Database Modeling (Prisma & PostgreSQL)

---

# 🌐 Live Demo

**Frontend**: [https://edubridge-sigma-one.vercel.app](https://edubridge-sigma-one.vercel.app)  
**Backend**: [https://edu-bridge-3pt2.onrender.com](https://edu-bridge-3pt2.onrender.com)

---

# 👨‍💻 Author

**Deepak Mishra** & **Yash Verdhan**