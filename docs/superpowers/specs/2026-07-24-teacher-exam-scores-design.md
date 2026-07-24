# Teacher Portal: Exam Scores & Mastery Gap Design

**Date:** 2026-07-24
**Status:** Approved by user

## Problem

The teacher sidebar has 3 links that all point to `/teacher-dashboard` — they appear broken. More critically, the teacher portal (the core selling point of EduBridge) lacks real exam score management. Currently "mastery" is just average quiz accuracy, which measures practice effort, not actual understanding. Teachers need to record real exam marks to identify the gap between students who practice (high quiz accuracy) but don't actually understand the material (low exam scores).

## Solution

Three changes:
1. **Split the sidebar** into 3 distinct teacher pages
2. **Add exam management** — teachers create exams and enter student scores via a table
3. **Redefine mastery** as 60% exam average + 40% quiz accuracy, and surface the "gap" (students whose quiz accuracy is high but exam scores are low)

---

## 1. Sidebar Restructure

### Current (broken)
All 3 teacher links point to `/teacher-dashboard`:
- "Classroom Command" → `/teacher-dashboard`
- "Class Heatmap & Roster" → `/teacher-dashboard`
- "Push Remedial Notes" → `/teacher-dashboard`

### New
| Sidebar Link | Route | Page purpose |
|---|---|---|
| Classroom Command | `/teacher-dashboard` | Overview: stats, heatmap, roster with gap indicator |
| Exam Scores & Mastery | `/teacher-exams` | Create exams, enter/edit scores in a table, view mastery breakdown |
| Push Remediation | `/teacher-push` | Push notes/quizzes to struggling students, view push history |

Plus Settings at the bottom (unchanged).

**Files changed:**
- Modify: `client/src/components/layout/Sidebar.tsx` — update `teacherLinks` array with 3 distinct routes
- Create: `client/src/app/teacher-exams/page.tsx`
- Create: `client/src/app/teacher-push/page.tsx`
- Modify: `client/src/app/teacher-dashboard/page.tsx` — remove push modal (moved to `/teacher-push`), add exam avg + gap column to roster

---

## 2. Data Model

### New Prisma models

```prisma
model Exam {
  id        String   @id @default(uuid())
  title     String            // e.g., "Midterm Exam 1"
  subject   String            // e.g., "Database Systems"
  maxMarks  Int               // e.g., 100
  examDate  String            // e.g., "2026-08-15"
  teacherId String
  teacher   User     @relation("TeacherExams", fields: [teacherId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  scores ExamScore[]

  @@index([teacherId])
}

model ExamScore {
  id        String   @id @default(uuid())
  examId    String
  exam      Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
  studentId String
  student   User     @relation("StudentExamScores", fields: [studentId], references: [id], onDelete: Cascade)
  marks     Int               // what the student scored (e.g., 78 out of 100)
  createdAt DateTime @default(now())

  @@unique([examId, studentId])  // one score per student per exam
  @@index([studentId])
  @@index([examId])
}
```

### User model additions

Add two relations to `User`:
```prisma
  examsCreated  Exam[]       @relation("TeacherExams")
  examScores    ExamScore[]  @relation("StudentExamScores")
```

### Mastery calculation

**Old:** `mastery = avg quiz accuracy`

**New:** `mastery = round(0.6 * examPct + 0.4 * quizAccuracy)`

Where:
- `examPct` = average of `(marks / maxMarks) * 100` across all the student's exam scores (0 if no exams)
- `quizAccuracy` = average of all quiz attempt accuracies (0 if no attempts)

**Gap indicator:** `gap = quizAccuracy - examPct`
- `gap > 20` → "Surface Practice" (high quiz, low exam — needs real understanding help)
- `0 ≤ gap ≤ 20` → "Aligned" (practice matches performance)
- `gap < 0` → "Exam Strong" (scores better than practice suggests)

---

## 3. Backend Endpoints

### New exam controller + routes

Mount: `/api/teacher` (same router, already has `authenticate + requireRole('teacher')`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/teacher/exams` | Create an exam (title, subject, maxMarks, examDate) |
| GET | `/api/teacher/exams` | List all exams (with score count + class average) |
| GET | `/api/teacher/exams/:examId` | Get one exam with all student scores |
| PUT | `/api/teacher/exams/:examId/scores` | Bulk-save scores (array of `{ studentId, marks }`) |
| PATCH | `/api/teacher/exams/:examId/scores/:studentId` | Edit one student's score |
| DELETE | `/api/teacher/exams/:examId` | Delete an exam (cascades scores) |

### Modified existing endpoints

**`GET /api/teacher/heatmap`** — `studentRoster` now includes:
```json
{
  "id": "...",
  "name": "...",
  "email": "...",
  "quizAccuracy": 72,        // was "masteryScore" (renamed for clarity)
  "examAverage": 65,         // NEW: average exam percentage
  "masteryScore": 68,        // NEW: blended 60/40
  "gap": 7,                  // NEW: quizAccuracy - examAverage
  "gapStatus": "Aligned",    // NEW: "Surface Practice" | "Aligned" | "Exam Strong"
  "quizzesTaken": 3,
  "attendancePct": 80,
  "status": "On Track",      // based on masteryScore now, not just quiz accuracy
  "weakTopics": ["Binning", "IQR Method"]
}
```

**`GET /api/teacher/student/:studentId`** — now includes exam history:
```json
{
  "student": {
    // ...existing fields...
    "examScores": [
      { "id": "...", "examTitle": "Midterm 1", "subject": "DB Systems", "marks": 78, "maxMarks": 100, "percentage": 78, "examDate": "2026-08-15" }
    ],
    "examAverage": 65
  }
}
```

---

## 4. Frontend Pages

### Page 1: Classroom Command (`/teacher-dashboard`) — MODIFIED

**Changes:**
- Roster table: replace single "Mastery Accuracy" column with 3 columns: "Quiz Accuracy", "Exam Avg", "Mastery" (blended). Add a "Gap" column with color-coded badge.
- Remove the push modal (moved to `/teacher-push`)
- Keep: stats cards, heatmap, roster table
- Roster row click → navigates to `/teacher-push?studentId=...` (to push remediation to that student)

### Page 2: Exam Scores & Mastery (`/teacher-exams`) — NEW

**Layout:**
1. **Header**: "Exam Scores & Mastery" + "Create Exam" button
2. **Exam cards grid**: Each exam shows title, subject, date, max marks, # scored, class average (color-coded). Click a card to open the score-entry view.
3. **Score-entry view** (replaces the card grid when an exam is selected):
   - Back button to return to exam list
   - Exam title + details at top
   - Table: rows = all students, columns = Name | Marks (editable input) | Percentage (auto-calculated, color-coded)
   - "Save All Scores" button
   - Students with no score yet show empty input
   - Color coding on percentage: green ≥80%, amber 50-79%, red <50%
4. **Mastery breakdown section** (below the exam list):
   - Per-subject average scores
   - List of students below 50% threshold ("Needs Intervention")

### Page 3: Push Remediation (`/teacher-push`) — NEW

**Layout:**
1. **Header**: "Push Remediation" + description
2. **Student selection**: dropdown or list of students (with their mastery + weak topics shown)
3. **Push form**: assignment title, material type toggle (Note / Quiz), note/quiz dropdown (same as current modal but as a full page)
4. **Push history**: table of previously pushed assignments (student, title, material, status, date)

---

## 5. Seed Data Updates

The seed script should generate:
- 2-3 exams per subject (created by the teacher)
- Exam scores for all synthetic students (varied: some high, some low — creating the gap)
- This makes the dashboard immediately show realistic gap data on demo day

---

## 6. File Structure

**Backend (new + modified):**
- Create: `server/src/controllers/exam.controller.ts` — 6 handlers (create, list, getOne, saveScores, editScore, delete)
- Modify: `server/src/routes/teacher.routes.ts` — add 6 exam routes
- Modify: `server/src/controllers/teacher.controller.ts` — update `getClassroomHeatmap` roster to include exam data + gap; update `getStudentDetail` to include exam scores
- Modify: `server/prisma/schema.prisma` — add `Exam` + `ExamScore` models + User relations
- Modify: `server/prisma/seed.ts` — generate exams + scores for synthetic students

**Frontend (new + modified):**
- Modify: `client/src/components/layout/Sidebar.tsx` — 3 distinct teacher routes
- Modify: `client/src/app/teacher-dashboard/page.tsx` — roster with exam/gap columns, remove push modal
- Create: `client/src/app/teacher-exams/page.tsx` — exam management + score entry table
- Create: `client/src/app/teacher-push/page.tsx` — push remediation as full page + history

---

## 7. What's NOT in Scope

- No student-facing exam view (students don't see their exam scores in this iteration — teachers manage and view scores). Can be a follow-up.
- No exam PDF upload or auto-grading. Teachers enter marks manually.
- No exam question generation (exams are real-world assessments, not AI-generated).
- No teacher-student enrollment model (single-classroom model continues — teacher sees all students).

---

## 8. Success Criteria

1. Teacher sidebar has 3 working links to 3 distinct pages
2. Teacher can create an exam, enter scores for all students in a table, and save
3. Dashboard roster shows exam avg, quiz accuracy, blended mastery, and the gap
4. Students with high quiz accuracy but low exam scores are visually flagged ("Surface Practice")
5. Seed data populates exams + scores so the dashboard is immediately demoable
6. All existing backend tests still pass; new exam endpoints have tests
