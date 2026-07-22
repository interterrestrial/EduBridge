# 📝 Quiz Engine

This document defines the architecture, workflow, and implementation of the **Quiz Engine** in EduBridge. The Quiz Engine automatically generates personalized assessments from student-uploaded study material, helping learners evaluate their understanding, identify knowledge gaps, and reinforce concepts through AI-powered adaptive testing.

Unlike traditional quiz systems with predefined question banks, EduBridge dynamically generates quizzes using **Retrieval-Augmented Generation (RAG)** and **Google Gemini**, ensuring every assessment is relevant to the student's own notes.

---

# 🎯 Objectives

The Quiz Engine is designed to:

- Automatically generate quizzes from uploaded notes.
- Assess student understanding.
- Identify weak concepts.
- Personalize quiz difficulty.
- Provide detailed explanations.
- Track learning progress over time.
- Recommend revision topics based on performance.

---

# 🏗️ System Overview

```text
                  Student
                     │
                     ▼
             Select Study Notes
                     │
                     ▼
          Retrieve Document Context
                     │
                     ▼
          AI Quiz Generation
                     │
                     ▼
              Create Questions
                     │
                     ▼
             Student Attempts Quiz
                     │
                     ▼
          Evaluate Performance
                     │
                     ▼
        Update Learning Analytics
```

---

# 📚 Quiz Generation Workflow

```text
Student Opens Quiz Module
             │
             ▼
Choose Study Notes
             │
             ▼
Select Difficulty
             │
             ▼
Generate Quiz
             │
             ▼
Answer Questions
             │
             ▼
Submit Quiz
             │
             ▼
Evaluate Responses
             │
             ▼
Generate Report
```

---

# 🤖 AI Quiz Generation Pipeline

```text
Uploaded Notes

↓

Text Retrieval

↓

Relevant Chunks

↓

Prompt Builder

↓

Google Gemini

↓

Generate Questions

↓

Generate Answers

↓

Generate Explanations

↓

Store Quiz
```

---

# 🧠 AI Responsibilities

The AI is responsible for:

- Extracting important concepts
- Generating meaningful questions
- Creating answer choices
- Generating correct answers
- Writing explanations
- Assigning difficulty levels
- Avoiding duplicate questions

---

# 📋 Quiz Configuration

Students can customize quiz generation.

Options include:

- Number of Questions
- Difficulty Level
- Study Material
- Topic Selection (Future)
- Time Limit (Future)

Example

```text
Questions

10

Difficulty

Medium

Source

Operating Systems Notes
```

---

# 🎯 Difficulty Levels

## Easy

Focuses on:

- Definitions
- Basic concepts
- Terminology

Example

```text
What is RAM?

A. Memory
B. CPU
C. Cache
D. Register
```

---

## Medium

Focuses on:

- Conceptual understanding
- Comparisons
- Practical applications

Example

```text
Which scheduling algorithm
provides the shortest average waiting time?
```

---

## Hard

Focuses on:

- Analytical thinking
- Scenario-based questions
- Multi-step reasoning

Example

```text
A deadlock occurs under which
combination of operating system conditions?
```

---

# 📝 Supported Question Types

Current Version

- Multiple Choice Questions (MCQs)

Future Versions

- True / False
- Fill in the Blanks
- Short Answer
- Long Answer
- Coding Questions
- Match the Following
- Assertion & Reason
- Diagram-Based Questions

---

# 📄 Question Structure

Each question contains:

```text
Question

↓

Options

↓

Correct Answer

↓

Explanation

↓

Difficulty

↓

Topic
```

Example

```text
Question

Which data structure uses FIFO?

A. Stack

B. Queue

C. Heap

D. Tree

Correct Answer

Queue

Explanation

A Queue follows the
First In First Out principle.
```

---

# ⏱️ Quiz Attempt Workflow

```text
Quiz Generated
       │
       ▼
Student Starts Quiz
       │
       ▼
Answer Questions
       │
       ▼
Submit Quiz
       │
       ▼
Evaluate Answers
       │
       ▼
Display Results
```

---

# 📊 Quiz Evaluation

After submission, EduBridge calculates:

- Total Score
- Correct Answers
- Incorrect Answers
- Accuracy
- Time Taken
- Topic-wise Performance

Example

```text
Score

8 / 10

Accuracy

80%

Time

12 Minutes
```

---

# 📈 Performance Analysis

The Quiz Engine analyzes:

- Frequently incorrect questions
- Weak topics
- Strong topics
- Accuracy trends
- Difficulty performance
- Revision requirements

Workflow

```text
Quiz Results

↓

Performance Analysis

↓

Knowledge Gap Detection

↓

Progress Update

↓

Revision Recommendations
```

---

# 🧠 AI Explanations

Every question includes an explanation.

Example

```text
Question

Which protocol is connection-oriented?

Correct Answer

TCP

Explanation

TCP establishes a reliable
connection before transmitting
data, ensuring ordered delivery.
```

Providing explanations helps students learn from mistakes rather than simply viewing the correct answer.

---

# 🎯 Personalized Recommendations

Based on quiz performance, EduBridge recommends:

- Topics to revise
- Additional quizzes
- Flashcards
- AI Tutor sessions
- Related study material

Example

```text
Weak Topic

Deadlocks

Recommendation

Generate Flashcards
```

---

# 🔄 End-to-End Quiz Workflow

```text
Student Selects Notes
          │
          ▼
Retrieve Context
          │
          ▼
Generate Quiz
          │
          ▼
Attempt Quiz
          │
          ▼
Evaluate Answers
          │
          ▼
Generate Analytics
          │
          ▼
Update Dashboard
          │
          ▼
Recommend Revision
```

---

# 📚 Quiz History

Students can review previous attempts.

Each attempt stores:

- Quiz Title
- Date
- Score
- Accuracy
- Time Taken
- Weak Topics

Example

```text
Operating Systems

Score

9 / 10

Accuracy

90%

Completed

Yesterday
```

---

# 🌐 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/quizzes/generate` | Generate quiz |
| GET | `/api/quizzes` | Get quiz history |
| GET | `/api/quizzes/:id` | Get quiz details |
| POST | `/api/quizzes/:id/submit` | Submit quiz |
| GET | `/api/quizzes/:id/result` | Get results |
| DELETE | `/api/quizzes/:id` | Delete quiz |

---

# 🗄️ Database Structure

## Quiz

| Field | Type |
|------|------|
| id | UUID |
| studentId | UUID |
| noteId | UUID |
| title | String |
| difficulty | Enum |
| totalQuestions | Integer |
| createdAt | DateTime |

---

## Quiz Question

| Field | Type |
|------|------|
| id | UUID |
| quizId | UUID |
| question | Text |
| optionA | String |
| optionB | String |
| optionC | String |
| optionD | String |
| correctAnswer | String |
| explanation | Text |
| difficulty | Enum |

---

## Quiz Attempt

| Field | Type |
|------|------|
| id | UUID |
| quizId | UUID |
| studentId | UUID |
| score | Integer |
| accuracy | Float |
| timeTaken | Integer |
| submittedAt | DateTime |

---

# 📂 Backend Structure

```text
server/

src/

├── controllers/
│   └── quiz.controller.ts
│
├── routes/
│   └── quiz.routes.ts
│
├── services/
│   ├── quiz.service.ts
│   ├── aiQuiz.service.ts
│   ├── evaluation.service.ts
│   └── analytics.service.ts
│
├── prompts/
│   └── quiz.prompt.ts
│
└── utils/
    └── scoreCalculator.ts
```

---

# 🎨 Frontend Components

```text
components/

├── QuizGenerator
├── QuizCard
├── QuestionCard
├── OptionButton
├── Timer
├── ProgressIndicator
├── ResultSummary
├── PerformanceChart
├── ReviewAnswers
└── QuizHistory
```

---

# 🔒 Security Considerations

The Quiz Engine follows these security practices:

- JWT authentication required.
- Students can access only their own quizzes.
- AI generates questions only from authorized study material.
- Quiz submissions are validated server-side.
- Prevent duplicate submissions.
- Protect against API abuse using rate limiting (Future).

---

# 🚀 Future Enhancements

Future versions may include:

- Adaptive Difficulty Based on Performance
- Timed Examinations
- Negative Marking
- Subject-wise Quiz Templates
- Coding Challenges
- AI-Proctored Exams
- Leaderboards
- Multiplayer Quiz Battles
- Question Bookmarking
- Export Results (PDF)
- Teacher-Created Custom Quizzes

---

# 📋 Deliverables

- ✅ AI Quiz Generation Pipeline
- ✅ Quiz Configuration
- ✅ Multiple Difficulty Levels
- ✅ Question Generation
- ✅ Answer Evaluation
- ✅ AI Explanations
- ✅ Performance Analysis
- ✅ Personalized Recommendations
- ✅ Quiz History
- ✅ API Endpoints
- ✅ Database Design
- ✅ Frontend Components
- ✅ Security Strategy
- ✅ Future Enhancements

---

## 📌 Document Status

**Status:** ✅ Completed

This document defines the complete Quiz Engine for EduBridge. It serves as the implementation guide for generating AI-powered quizzes from student-uploaded study material, evaluating performance, identifying knowledge gaps, and driving personalized learning through intelligent assessment and analytics.