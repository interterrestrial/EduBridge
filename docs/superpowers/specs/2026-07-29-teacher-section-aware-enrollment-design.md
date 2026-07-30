# Section-Aware Teacher Enrollment — Design Spec

**Date:** 2026-07-29
**Status:** Draft (awaiting user approval before implementation)
**Author:** Yash + ZCode
**Related work:** Built on the Exam Scores & Mastery Gap feature (2026-07-24)

---

## Problem

Today the `TeacherStudent` table links a teacher to a student, but the link carries no academic context. A student can appear in a teacher's roster regardless of whether they're teaching the student Math or Physics, in Class 10A or 10B. Analytics (heatmap, exam averages, mastery) load everything by `studentId`, silently mixing subjects and sections. The teacher portal feels data-rich but cannot answer the basic question: **"How is my Mathematics, Class 10, Section A doing?"**

This blocks the core teacher use case — pushing targeted material to one section of students, separate from other sections — and the most important EduBridge insight: the gap between practice and exam scores for *this specific group of students I actually teach*.

## Solution

Make `(subject, className, section)` a required, indexed tuple on `TeacherStudent`. Every teacher-facing analytics query and write must scope to a chosen enrollment. The teacher dashboard gets a Subject → Class → Section filter that drives every downstream value. Students see enrollment cards, not a global "My Class."

---

## Data model

### TeacherStudent (replaces existing)

```prisma
model TeacherStudent {
  id            String   @id @default(uuid())
  teacherId     String
  studentId     String
  subject       String
  className     String
  section       String
  manualExamAvg Float?
  createdAt     DateTime @default(now())

  teacher User @relation("TeacherStudents", fields: [teacherId], references: [id], onDelete: Cascade)
  student User @relation("StudentTeachers", fields: [studentId], references: [id], onDelete: Cascade)

  teacherExams        Exam[]
  pushAssignments     TeacherPushAssignment[]
  attendanceRecords   AttendanceRecord[]

  @@unique([teacherId, studentId, subject, className, section])
  @@index([teacherId, subject, className, section])
  @@index([studentId])
}
```

**Constraints**
- `subject`, `className`, `section` are non-null strings.
- A teacher may enroll the same student in multiple subjects/sections simultaneously.
- Normalization: `subject` and `className` trimmed; `section` trimmed and capitalized to first-letter-uppercase rest-lower (e.g. `a` → `A`, `morning` → `Morning`).

### Cascading relations added

```prisma
model Exam {
  // ... existing fields ...
  teacherStudentId String?
  teacherStudent   TeacherStudent? @relation(fields: [teacherStudentId], references: [id], onDelete: SetNull)
}

model TeacherPushAssignment {
  // ... existing fields ...
  teacherStudentId String?
  teacherStudent   TeacherStudent? @relation(fields: [teacherStudentId], references: [id], onDelete: SetNull)
}

model AttendanceRecord {
  // ... existing fields ...
  teacherStudentId String?
  teacherStudent   TeacherStudent? @relation(fields: [teacherStudentId], references: [id], onDelete: SetNull)
}
```

`ExamScore` inherits scope transitively via `Exam.teacherStudentId`. Student-owned records (notes, quizzes, flashcards, chat sessions, study schedules) remain student-owned — the plan explicitly carves out student AI notes.

### User.manualExamAvg

Removed. The single source of manual-override is `TeacherStudent.manualExamAvg` (enrollment-level). Different teachers in different classrooms can record different manual scores for the same student.

---

## Migration safety (dev DB only)

Per the plan, this migration targets the dev SQLite database only — no destructive reset on production. Steps:

1. Add `className String?` and `section String?` to `TeacherStudent`. Existing rows backfill to `("General", "Unassigned", "A")` via an `updateMany`.
2. Make all three fields required (`String`).
3. Replace `@@unique([teacherId, studentId])` with `@@unique([teacherId, studentId, subject, className, section])`. Resolve any post-backfill conflicts manually in seed data.
4. Add `teacherStudentId String?` + relation to `Exam`, `TeacherPushAssignment`, `AttendanceRecord`.
5. Backfill `teacherStudentId` on existing teacher-owned records by matching each record's `studentId` + teacher to a `TeacherStudent` row. Records with no matching enrollment keep `teacherStudentId = null` (orphaned — handled by controller-layer guard: teachers only see records whose `teacherStudentId` is in their active scope, OR records with `teacherStudentId = null` ONLY if the student is in their roster).

---

## Teacher enrollment flow

### UI (enrollment modal on `/teacher-dashboard`)

Required fields:

- **Student** — email OR enrollment code (a free-text input that matches either `User.email` or `User.studentCode`)
- **Subject** — text input with autocomplete from this teacher's existing subjects
- **Class** — free text (e.g. `10`, `BSc CS`, `Grade 8`); trimmed
- **Section** — text input; trimmed and normalized (first letter uppercase)

Confirmation text before submit: **"Add student to {subject}, Class {className}, Section {section}."**

### Backend validation (`POST /api/teacher/enrollments`)

- Authenticated user must be `teacher`. Reject otherwise.
- Trim all strings. Reject empty / whitespace-only.
- `subject` and `className` and `section` lengths: 1–64 chars.
- Find student by `email` or `studentCode`. If neither matches → 404.
- Compute canonical section string (capitalize first letter, trim).
- `upsert` on `(teacherId, studentId, subject, className, section)`. Returns the row.
- Never accept a `teacherId` from the body — always use `req.user.id`.

### Other endpoints

- `GET /api/teacher/enrollments` — list this teacher's enrollments, grouped client-side by `subject → className → section`.
- `DELETE /api/teacher/enrollments/:id` — must belong to the calling teacher; cascade to `teacherStudentId` on linked records.
- `GET /api/teacher/scope?subject=...&className=...&section=...` — validates that the requested scope exists in the teacher's enrollments; returns `{ teacherStudentId, subject, className, section }` plus the student IDs in that scope.

---

## Teacher dashboard — scope filter

### Filter UX

Cascading dropdowns in a sticky bar above the roster:

1. **Subject** dropdown — list from this teacher's enrollments. Default: first enrollment's subject.
2. **Class** dropdown — populated from enrollments matching the chosen subject. Default: first class for that subject.
3. **Section** dropdown — populated from enrollments matching subject+class. Default: first section.

Active scope displayed prominently: **"Mathematics · Class 10 · Section A"** (used everywhere as a chip).

The selection persists in `localStorage` under key `eduBridge.teacherScope`. Default selection is computed from the first available enrollment on the teacher dashboard mount if no localStorage value exists.

### What the filter scopes

Every value in the teacher dashboard must respect the active scope:

- Student roster (`getClassroomHeatmap.studentRoster`)
- Quiz accuracy, exam average, blended mastery, gap
- Attendance percentage
- Weak topics heatmap (only from quiz attempts of students in scope)
- Teacher-created exams list (`GET /api/teacher/exams`)
- Exam scores in roster
- Push history (`GET /api/teacher/push-history`)
- "Push to all" actions scope to students in the active section
- `getStudentDetail` — must verify the requested student belongs to the active scope for the calling teacher; 403 otherwise

**Out of scope for this iteration:** timetable overhaul, parent accounts, grading system rewrite, institution admin panel. The plan's "final product boundary" section is honored.

---

## Student experience

The student dashboard, timetable, assignments, exams, and teacher list must use enrollment-specific data.

- Student dashboard replaces any global "My Class" with a list of enrollment cards:
  ```
  Mathematics — Class 10, Section A
  Teacher: Mr. Rao
  ```
  ```
  Physics — Class 10, Section B
  Teacher: Ms. Khan
  ```
- Each card links to subject-specific timetable, assignments, and exam history.
- `getStudentAnalytics` and similar student endpoints accept a `teacherStudentId` query param to scope attendance/exams to that enrollment. Default to the student's primary enrollment if none provided.
- Students do not see other students in their class — analytics remain personal.

---

## Scoping every teacher-owned record

Per plan section 6, this is where teams usually miss. Every analytics query must filter by the active enrollment's `teacherStudentId` set.

### Modified Prisma queries

| Endpoint | Old `where` | New `where` (additive) |
|---|---|---|
| `getClassroomHeatmap` | `role: 'student'` | `enrollments: { some: { id: teacherStudentId } }` for the active scope |
| `getStudentDetail` | `id: studentId, role: 'student'` | `id: studentId AND enrollments: { some: { id: activeTeacherStudentId } }` |
| `pushMaterialToStudent` | `studentId, teacherId` | + `teacherStudentId: activeScopeId` |
| `getPushHistory` | `teacherId` | + `teacherStudentId: activeScopeId` OR no scope (all teacher history) |
| `createExam` | `teacherId` | + `teacherStudentId: activeScopeId` |
| `getExams` | `teacherId` | + filter by `teacherStudentId: activeScopeId` (or null = legacy, surfaced separately) |
| `saveScores`, `editScore`, `deleteExam` | already scoped via `Exam.teacherId` | + verify `Exam.teacherStudentId === activeScopeId` OR `null` (legacy) |
| `getClassroomHeatmap.attendancePct` | counts all attendance for student | only `AttendanceRecord.teacherStudentId = activeScopeId` |

### Legacy records

Existing records with `teacherStudentId = null` are treated as "global/legacy." Teachers see them but flagged as unscoped. New records always carry `teacherStudentId`. Migration step 5 backfills where possible.

---

## Security requirements

Every teacher endpoint must verify:

1. The authenticated user is actually a teacher (already enforced via `requireRole('teacher')`).
2. The requested enrollment belongs to that teacher — checked by `prisma.teacherStudent.findFirst({ where: { id, teacherId: req.user.id } })`.
3. The student belongs to that exact `(subject, className, section)` — `enrollments: { some: { id: activeScopeId } }`.
4. The selected note or quiz is accessible — students' own resources are fine; cross-student resources require explicit teacher assignment (out of scope for this iteration, but the controller pattern is: `note.studentId` must be in the active scope's student IDs).
5. "Push to all" targets only students in the selected mapping.
6. Student detail pages cannot be accessed through another teacher's enrollment.
7. No client-provided `teacherId` is trusted — always `req.user.id`.
8. No client-provided `studentId` bypasses the enrollment check — student IDs must come from the active scope's student list.

### Edge cases to test (per plan section 8)

- One student, two teachers, same subject, different sections → 2 enrollment rows, both work independently
- One teacher, one student, two different subjects → 2 enrollment rows, scoping switches cleanly
- One teacher, two sections of the same subject → filter switches between them, no data bleed
- Same student added twice to same subject/class/section → upsert returns existing row, no duplicate
- Teacher tries to view another teacher's section → 403
- Teacher tries to push content to another section → 403
- Student has no enrollments → empty-state UI, no crash
- Existing mapping has missing legacy values → backfill step covers it
- Section names differ only by casing (`a` vs `A`) → normalize → upsert finds existing
- Deleted teacher or student → cascade rules clean up
- Empty class, empty section, oversized input, malformed IDs → controller-level validation rejects with 400
- Two teachers simultaneously enrolling the same student → DB unique constraint serializes, no duplicate

---

## Demo flow (the winning run)

1. Teacher logs in → sees Mathematics · Class 10 · Section A by default.
2. Dashboard roster shows only that section's 5 students.
3. Heatmap reveals "Binning" as the shared weak topic.
4. Teacher clicks "Push Remediation" → pre-filtered to Section A.
5. Student sees the push under "Mathematics, Mr. Rao" on their dashboard.
6. Student completes the pushed quiz.
7. Section A's mastery and heatmap update in real time on the next dashboard refresh.
8. Teacher switches to Section B → proves the data is fully separate (different students, different scores).

---

## Ship order

1. Database migration: nullable fields → backfill → required; unique constraint swap; cascading `teacherStudentId` columns; backfill existing records. Dev DB only.
2. Enrollment API: `POST/GET/DELETE /api/teacher/enrollments`, `GET /api/teacher/scope`, with full validation.
3. Enrollment modal on `/teacher-dashboard`.
4. Cascading subject/class/section filter in the dashboard UI.
5. Student enrollment cards on `/student-dashboard`.
6. Scope teacher-owned records (`Exam`, `ExamScore`, `TeacherPushAssignment`, `AttendanceRecord`) at the controller layer.
7. Manual security tests covering plan section 8.
8. Fix loading / timeout / duplicate-submit / empty-state behavior.
9. Seed: realistic demo data for 2 sections (per plan section 9).
10. Record the demo only after the flow above passes.

---

## Out of scope

Per the plan's product boundary:

- Student-facing exam view (students don't see exam scores in this iteration)
- Exam PDF upload / auto-grading
- Exam question generation
- Full school-management system (timetabling overhaul, parent accounts, grading system rewrite, institution admin panel)
- Cross-student note/quiz sharing for teachers (enrollment-scoped but student-owned resources remain student-owned)

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Migration drops existing TeacherStudent rows if backfill conflicts | All backfill happens nullable-first; only after backfill passes do we enforce non-null |
| Active scope state on client gets out of sync with server | Server re-validates scope on every teacher query; rejects mismatched localStorage values with 400 |
| `teacherStudentId = null` records become inaccessible | Treated as "global/legacy," surfaced in a separate UI banner so teachers can re-scope them |
| SQLite doesn't enforce some Prisma features | Already known — types `req.params` as `string \| string[]`, casting is documented in observation log |
| Frontend `useSearchParams` for scope causes another Suspense issue | Wrap scope-reading in `<Suspense>` if added to a page that uses it (pattern established for ai-chat and teacher-push) |

---

## Success criteria

- Teacher can enroll a student with `(subject, className, section)`, and the same student can appear under multiple enrollments independently.
- Teacher dashboard filter switches between sections; every visible value (roster, mastery, exam averages, attendance, heatmap, push targets) updates.
- A teacher cannot view or modify a student outside their active enrollment.
- Student dashboard shows per-enrollment cards.
- Demo flow above completes without data bleed.
- All existing tests still pass; new endpoints have basic happy-path tests.
