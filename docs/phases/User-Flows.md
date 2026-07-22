# 👥 User Flows

This document defines the primary user journeys within EduBridge. It outlines how students and teachers interact with the platform, ensuring every feature aligns with the overall goal of delivering personalized learning through AI.

---

# 🎯 Objectives

The user flows are designed to:

- Simplify onboarding for new users.
- Minimize the number of steps required to perform common tasks.
- Ensure intuitive navigation.
- Separate student and teacher experiences.
- Provide a seamless AI-assisted learning workflow.

---

# 👥 User Roles

EduBridge currently supports two primary user roles.

## 👨‍🎓 Student

A student can:

- Register/Login
- Upload study material
- Chat with AI Tutor
- Generate quizzes
- Generate flashcards
- Track progress
- Review learning analytics

---

## 👨‍🏫 Teacher

A teacher can:

- Register/Login
- Create or manage classrooms (Future)
- View classroom analytics
- Monitor student progress
- Identify weak concepts
- View AI-generated recommendations

---

# 🚀 Application Entry Flow

```text
Landing Page
      │
      ▼
Authentication
      │
 ┌────┴────┐
 │         │
 ▼         ▼
Student   Teacher
Dashboard Dashboard
```

---

# 👨‍🎓 Student User Flow

## Student Journey

```text
Landing Page
      │
      ▼
Login / Register
      │
      ▼
Student Dashboard
      │
      ├──────────────┐
      │              │
      ▼              ▼
Upload Notes     View Previous Notes
      │
      ▼
Document Processing
      │
      ▼
AI Knowledge Base Created
      │
      ├────────────┬───────────────┬─────────────┐
      ▼            ▼               ▼             ▼
AI Chat      Generate Quiz   Flashcards   Analytics
      │            │               │             │
      └────────────┴───────────────┴─────────────┘
                     │
                     ▼
              Progress Tracking
```

---

# 📄 Upload Notes Flow

```text
Student Dashboard
        │
        ▼
Click Upload
        │
        ▼
Select PDF / Notes
        │
        ▼
Upload Successful
        │
        ▼
Document Processing
        │
        ▼
Text Extraction
        │
        ▼
Chunk Generation
        │
        ▼
Embedding Creation
        │
        ▼
Store in Vector Database
        │
        ▼
Ready for AI Chat
```

---

# 🤖 AI Chat Flow

```text
Student Opens AI Tutor
            │
            ▼
Ask Question
            │
            ▼
Retrieve Relevant Notes
            │
            ▼
Generate AI Response
            │
            ▼
Display Answer
            │
            ▼
Store Chat History
```

---

# 📝 Quiz Generation Flow

```text
Student Opens Quiz Section
             │
             ▼
Choose Note / Subject
             │
             ▼
Select Difficulty
             │
             ▼
Generate Quiz
             │
             ▼
Attempt Quiz
             │
             ▼
Submit Answers
             │
             ▼
AI Evaluation
             │
             ▼
Store Score
             │
             ▼
Update Progress Dashboard
```

---

# 🧠 Flashcard Generation Flow

```text
Student Opens Flashcards
            │
            ▼
Select Study Material
            │
            ▼
Generate Flashcards
            │
            ▼
Review Flashcards
            │
            ▼
Mark Known / Unknown
            │
            ▼
Update Learning Progress
```

---

# 📊 Progress Tracking Flow

```text
Student Completes Quiz
            │
            ▼
Calculate Score
            │
            ▼
Analyze Mistakes
            │
            ▼
Identify Weak Topics
            │
            ▼
Update Mastery Level
            │
            ▼
Recommend Revision
```

---

# 👨‍🏫 Teacher User Flow

## Teacher Journey

```text
Landing Page
      │
      ▼
Login / Register
      │
      ▼
Teacher Dashboard
      │
      ├──────────────┬──────────────┬───────────────┐
      ▼              ▼              ▼
Students      Analytics      AI Insights
      │
      ▼
Select Student
      │
      ▼
Student Report
      │
      ▼
Recommendations
```

---

# 📈 Teacher Analytics Flow

```text
Teacher Dashboard
        │
        ▼
View Class Performance
        │
        ▼
Analyze Student Progress
        │
        ▼
Identify Weak Topics
        │
        ▼
AI Recommendation Engine
        │
        ▼
Suggested Teacher Actions
```

---

# 🔐 Authentication Flow

```text
Landing Page
      │
      ▼
Choose Login Method
      │
 ┌────┴──────────┐
 │               │
 ▼               ▼
Email         Google OAuth
 │               │
 ▼               ▼
Authenticate User
       │
       ▼
Generate JWT
       │
       ▼
Redirect Dashboard
```

---

# 🧭 Navigation Structure

## Student

```text
Dashboard
│
├── Upload Notes
├── My Notes
├── AI Tutor
├── Flashcards
├── Quizzes
├── Progress
├── Analytics
└── Profile
```

---

## Teacher

```text
Dashboard
│
├── Students
├── Analytics
├── Reports
├── Recommendations
└── Profile
```

---

# 🔄 End-to-End Learning Workflow

```text
Student Uploads Notes
            │
            ▼
Document Processed
            │
            ▼
Knowledge Base Created
            │
            ▼
AI Tutor Available
            │
            ▼
Student Learns
            │
            ▼
Quiz Generated
            │
            ▼
Quiz Evaluation
            │
            ▼
Weak Topics Identified
            │
            ▼
Flashcards Generated
            │
            ▼
Revision Completed
            │
            ▼
Progress Updated
            │
            ▼
Teacher Dashboard Updated
```

---

# 📌 User Flow Principles

EduBridge follows these UX principles:

- Minimal clicks for common actions.
- Clear separation between student and teacher experiences.
- AI assistance available throughout the learning journey.
- Persistent progress tracking.
- Context-aware navigation.
- Responsive across desktop and mobile devices.
- Consistent UI patterns across all modules.

---

# 🔮 Future User Flows

The following workflows are planned for future releases:

- Classroom Creation & Enrollment
- Assignment Submission
- Peer Collaboration
- Live AI Classroom Assistant
- Voice-based AI Tutor
- Parent Dashboard
- Gamified Learning Paths
- Notifications & Reminders
- Calendar Integration

---

# 📋 Deliverables

- ✅ Student User Journey
- ✅ Teacher User Journey
- ✅ Authentication Flow
- ✅ Upload Notes Flow
- ✅ AI Chat Flow
- ✅ Quiz Flow
- ✅ Flashcard Flow
- ✅ Progress Tracking Flow
- ✅ Teacher Analytics Flow
- ✅ Navigation Structure
- ✅ End-to-End Learning Workflow

---

## 📌 Document Status

**Status:** ✅ Completed

This document defines all major user interactions within EduBridge and serves as the reference for UI/UX design, frontend development, backend API planning, and feature implementation.