# 🎨 System Design Document

# EduBridge

Version: 1.0

---

# Overview

EduBridge follows a modular three-tier architecture that separates presentation, business logic, AI services, and data storage.

The design emphasizes scalability, maintainability, and AI-first learning experiences.

---

# High-Level Architecture

```text
                    Users

        Student             Teacher

                │

                ▼

      Next.js Frontend (React)

                │

         HTTPS REST API

                │

                ▼

     Express Backend (Node.js)

 ┌──────────────┼──────────────┐
 │              │              │
 ▼              ▼              ▼

Database     AI Layer      File System

 │              │

 ▼              ▼

PostgreSQL   Gemini + RAG
```

---

# Architecture Pattern

EduBridge follows

- Layered Architecture
- REST Architecture
- Component-Based Frontend
- Service-Oriented Backend

---

# System Modules

```text
Authentication

↓

Student Dashboard

↓

Teacher Dashboard

↓

Notes Module

↓

AI Tutor

↓

Quiz Engine

↓

Flashcard Engine

↓

Progress Tracking

↓

Teacher Analytics
```

---

# Frontend Design

```text
Pages

↓

Feature Components

↓

Shared Components

↓

API Layer
```

Framework

- Next.js
- React
- TypeScript

---

# Backend Design

```text
Routes

↓

Controllers

↓

Services

↓

Repositories

↓

Prisma

↓

PostgreSQL
```

---

# AI Design

```text
Question

↓

Embedding

↓

Vector Search

↓

Context

↓

Prompt Builder

↓

Gemini

↓

Response
```

---

# RAG Design

```text
PDF

↓

Extract Text

↓

Chunking

↓

Embeddings

↓

FAISS

↓

Similarity Search

↓

Prompt

↓

Gemini
```

---

# Database Design

Entities

```text
Users

Notes

Documents

Chats

Flashcards

Quizzes

Progress

Teacher Analytics
```

---

# Authentication Design

```text
Login

↓

JWT

↓

Protected APIs

↓

Dashboard
```

---

# Upload Pipeline

```text
PDF

↓

Upload

↓

Extract

↓

Chunk

↓

Embedding

↓

Index

↓

Ready
```

---

# AI Tutor Flow

```text
Question

↓

Retrieve Context

↓

Prompt

↓

Gemini

↓

Answer
```

---

# Quiz Flow

```text
Select Notes

↓

Generate Quiz

↓

Answer

↓

Score

↓

Progress
```

---

# Flashcard Flow

```text
Notes

↓

Generate

↓

Review

↓

Update Progress
```

---

# Progress Analytics

Tracks

- Quiz Scores
- Flashcards Reviewed
- AI Sessions
- Learning Time
- Recommendations

---

# Teacher Analytics

Displays

- Weak Topics
- Strong Topics
- Student Performance
- Classroom Analytics

---

# API Communication

```text
Frontend

↓

Axios

↓

REST API

↓

Express

↓

Database
```

---

# Security Design

- JWT Authentication
- RBAC
- Password Hashing
- HTTPS
- Input Validation
- SQL Injection Prevention
- File Validation

---

# Folder Architecture

```text
client/

components/

features/

services/

hooks/

store/

app/
```

```text
server/

routes/

controllers/

services/

repositories/

middlewares/

config/

utils/
```

---

# Performance Design

Strategies

- Code Splitting
- Lazy Loading
- Database Indexing
- Efficient Prisma Queries
- Top-K Vector Retrieval
- Cached AI Responses (Future)

---

# Scalability Design

Future improvements

```text
Redis

↓

Load Balancer

↓

Multiple API Servers

↓

Distributed Database

↓

Cloud Vector Database
```

---

# Deployment Design

```text
GitHub

↓

Render

↓

Frontend

↓

Backend

↓

PostgreSQL

↓

Gemini
```

---

# Monitoring

Monitor

- API Health
- Database
- AI Latency
- Memory
- CPU
- Error Rate

---

# Design Principles

EduBridge is built around the following principles:

- Separation of Concerns
- Reusability
- Modularity
- Scalability
- Security by Design
- AI-First Architecture
- Maintainability

---

# Future Design Roadmap

- Docker
- Kubernetes
- Redis
- Pinecone
- Voice AI
- OCR
- Mobile App
- Offline Learning
- Event-Driven Architecture

---

## Design Summary

EduBridge combines a modern React frontend, scalable Node.js backend, Retrieval-Augmented Generation (RAG), semantic vector search, and Google Gemini to deliver a personalized AI-powered learning platform. The modular architecture ensures the system remains maintainable, extensible, and production-ready while supporting future enhancements such as mobile applications, cloud-native vector databases, and advanced AI capabilities.

---

## Document Status

**Status:** ✅ Completed