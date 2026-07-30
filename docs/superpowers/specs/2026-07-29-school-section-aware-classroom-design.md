# School Section-Aware Classroom — Design Spec

**Date:** 2026-07-29
**Status:** Approved by user (schools context: Class = grade, Section = letter)
**Author:** Yash + ZCode
**Builds on:** Exam Scores & Mastery Gap (2026-07-24), Section-Aware Enrollment draft (2026-07-29)

---

## Problem

Teachers in Indian schools teach multiple `(Class, Section)` pairs (e.g., "6th • A", "6th • B", "7th • A"). Today the dashboard shows everything lumped together under the teacher's default subject. There's no way for a teacher to:
1. See which `(Class, Section)` a student belongs to
2. Filter the roster to one specific `(Class, Section)`
3. Scope exams, push assignments, and analytics to that section

---

## Solution

Add structured `className` + `section` to `TeacherStudent`. Every teacher-facing page scopes to exactly one `(className, section)` pair at a time. The teacher picks which to view via a sidebar dropdown. Everything on the page (stats, heatmap, roster, exam list, push targets) updates with that selection.

---

## 1. Data model

### TeacherStudent (modified)

```prisma
model TeacherStudent {
  id            String   @id @default(uuid())
  teacherId     String
  studentId     String
  subject       String?             // teaching subject ("Mathematics", "English") — optional, display only
  className     String              // grade: "6th", "7th", "10th" — REQUIRED
  section       String              // letter: "A", "B", "C" — REQUIRED, normalized to uppercase
  manualExamAvg Float?
  createdAt     DateTime @default(now())

  teacher User @relation("TeacherStudents", fields: [teacherId], references: [id], onDelete: Cascade)
  student User @relation("StudentTeachers", fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([teacherId, studentId, className, section])  // changed from [teacherId, studentId]
  @@index([teacherId])
  @@index([studentId])
  @@index([teacherId, className, section])              // new — scope lookups
}
```

### Exam (modified)

Add optional `className` + `section` so an exam belongs to one (Class, Section) or "ALL":

```prisma
model Exam {
  id          String   @id @default(uuid())
  title       String
  subject     String
  className   String?              // nullable = "ALL classes" (legacy or global exam)
  section     String?              // nullable = "ALL sections"
  maxMarks    Int
  examDate    String
  teacherId   String
  teacher     User     @relation("TeacherExams", fields: [teacherId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())

  scores ExamScore[]

  @@index([teacherId])
  @@index([teacherId, className, section])  // new
}
```

**No other models touched** — `ExamScore`, `TeacherPushAssignment`, `AttendanceRecord` all stay as-is. Scoping is done at the controller layer via query params.

---

## 2. Scope semantics

- A teacher has 0..N distinct `(className, section)` pairs they teach
- Every teacher-facing query accepts `?className=&section=` (both required together, or both omitted = first pair)
- The active scope is **persisted in localStorage** under `eduBridge.teacherScope` and applied to all API calls
- Student must be in `TeacherStudent` rows matching the active `(className, section)` to appear in any view
- Same student can appear in multiple `(className, section)` pairs (e.g., switched sections)

**"All Classes" view** (legacy / unscoped): when a teacher has NO enrollments with className/section yet, fall back to showing all enrollments and label them "Unassigned". This handles migration gracefully.

---

## 3. Backend changes

### New endpoints / modifications

| Endpoint | Change |
|---|---|
| `POST /api/teacher/students` | Accept `className` + `section` in body. Required (400 if missing). Normalize section to uppercase. Upsert on `(teacherId, studentId, className, section)`. |
| `GET /api/teacher/students/unassigned` | Unchanged |
| `DELETE /api/teacher/students/:studentId` | Changed: now deletes enrollment by `(className, section)` scope. Body must include `className` + `section` (or pass them as query params). |
| `GET /api/teacher/heatmap` | Accept `?className=&section=`. Defaults to first `(className, section)` for the teacher. Returns `studentRoster` filtered to students in that scope. Heatmap scoped to those students' attempts. |
| `GET /api/teacher/student/:studentId` | Accept `?className=&section=`. Verifies student is in teacher's scope. 403 otherwise. |
| `GET /api/teacher/exams` | Accept `?className=&section=`. Lists exams matching the scope OR `className=null AND section=null` (legacy/ALL). |
| `POST /api/teacher/exams` | Accept `className` + `section` in body. Required unless `allClasses=true` flag. |
| `POST /api/teacher/push-assignment` | If `studentId === 'ALL'`, only targets students in active `(className, section)` scope. |
| `PATCH /api/teacher/students/:studentId/exam-avg` | Accept `?className=&section=`. Updates `TeacherStudent.manualExamAvg` for that enrollment (not `User.manualExamAvg`). |

### Helper additions (teacher.controller.ts)

```ts
async function resolveScope(req): Promise<{ className: string; section: string } | null>
```
- Reads `className` + `section` from query/body, validates both present, looks up an existing `TeacherStudent` row for the teacher
- Returns the scope, or 400 if invalid
- Default behavior: pick first alphabetical `(className, section)` from teacher's enrollments

### Migration

This is a **schema change**:
1. Add `className String?` and `section String?` to `TeacherStudent`. (Nullable first.)
2. Backfill existing rows: assign `("General", "A")` to all current sample data.
3. Make fields required.
4. Update `@@unique`.
5. Add same fields to `Exam`.

**User chose: "Don't touch dev.db"** — implement the migration; user runs `npm run db:reset` manually when ready.

---

## 4. Frontend changes

### New: `client/src/context/ClassScopeContext.tsx`

React context that holds `className: string | null` + `section: string | null` in state, synced with `localStorage`. Exposes `setScope(className, section)` and `clearScope()`. Auto-initializes from localStorage on mount.

### New: `client/src/components/teacher/ClassScopeSelector.tsx`

Dropdown UI:
- Shows teacher's distinct `(Class • Section)` pairs as options
- Selected scope highlighted with a primary color
- Active scope chip displayed next to the user's name

### Modified: `client/src/components/layout/Sidebar.tsx`

- Show `ClassScopeSelector` in the sidebar header below the user name
- Active scope visible on all teacher pages at a glance

### Modified: `client/src/app/teacher-dashboard/page.tsx`

- Use `useClassScope()` hook; pass scope to all API calls
- Header: "Viewing: Mathematics · Class 6th · Section A" + scope change button
- Roster table: add "Class • Section" column (since same student can appear in multiple pairs)
- Stats cards, heatmap, weak-topic detection all respect the scope

### Modified: `client/src/app/teacher-exams/page.tsx`

- Create Exam modal: require `(Class, Section)` selection OR "All Classes" toggle
- Exam cards: filter to scope + "ALL"
- Add a "(All Classes)" filter pill in the existing subject filter bar

### Modified: `client/src/app/teacher-push/page.tsx`

- Student dropdown: only shows students in active scope
- Push history table: add "(Class • Section)" column showing where each push was targeted
- "Push to ALL" targets only scope's students

### Modified: `client/src/app/teacher-dashboard/page.tsx` — Enroll modal

- New required fields: `className` + `section`
- Class dropdown (or free text) showing teacher's existing class names + "new" option
- Section dropdown (free text, normalized to uppercase)
- Validation: both required before submit

---

## 5. Seed changes

Each of the 6 sample students gets assigned to a specific `(className, section)`:
- Aarav Patel → "6th" • "A"
- Diya Reddy → "6th" • "A"
- Vihaan Nair → "6th" • "B"  ← Surface Practice story
- Ananya Gupta → "6th" • "B"
- Arjun Singh → "7th" • "A"   ← Needs Support story
- Ishaan Khan → "7th" • "A"

Yash Sharma → "6th" • "A" (primary)

This gives the dashboard 3 distinct scopes to switch between (6th-A: 3 students, 6th-B: 2 students, 7th-A: 2 students).

---

## 6. File structure (new + modified)

**Backend:**
- Modify: `server/prisma/schema.prisma` — add `className` + `section` to `TeacherStudent` and `Exam`, update constraints
- Modify: `server/prisma/seed.ts` — assign className + section to sample students and exams
- Modify: `server/src/controllers/teacher.controller.ts` — add `resolveScope`, scope all queries
- Modify: `server/src/controllers/exam.controller.ts` — accept + require scope on create, scope list
- Modify: `server/src/routes/teacher.routes.ts` — no changes (scope flows via query/body)

**Frontend:**
- Create: `client/src/context/ClassScopeContext.tsx`
- Create: `client/src/components/teacher/ClassScopeSelector.tsx`
- Modify: `client/src/components/layout/Sidebar.tsx`
- Modify: `client/src/app/teacher-dashboard/page.tsx`
- Modify: `client/src/app/teacher-exams/page.tsx`
- Modify: `client/src/app/teacher-push/page.tsx`
- Modify: `client/src/lib/api.ts` — add scope query param helper (optional but recommended)

---

## 7. What's NOT in scope

- Student-side dashboard changes (student sees own data, no need to scope to teacher)
- Cross-student note/quiz sharing
- Timetable overhaul, parent accounts, grading system rewrite
- Multi-teacher same-section scenarios (still single teacher per enrollment)
- Exam PDF upload / auto-grading

---

## 8. Success criteria

1. ✅ Teacher can enroll a student with `(className, section)` — the student shows up in that scope's roster
2. ✅ Same student enrolled in multiple `(className, section)` pairs appears independently in each
3. ✅ Sidebar dropdown lets teacher switch between scopes; all stats, roster, heatmap update
4. ✅ Class + Section label visible on every student row + every push target
5. ✅ Teacher cannot see or push to students outside their active scope
6. ✅ Exam creation requires `(Class, Section)` OR "All Classes"
7. ✅ Seed produces 3 distinct scopes so the dashboard is demoable immediately
8. ✅ All existing tests still pass; new scope-filtering tests added

---

## Risks

| Risk | Mitigation |
|---|---|
| Active scope state out of sync with server | Server re-validates scope on every teacher query; rejects invalid scope with 400 |
| Same student in multiple sections inflates class stats | Each scope has its own stats; "total students" means "in this scope" |
| Legacy data has no className/section | Fall back to "Unassigned" pseudo-scope, then prompt teacher to assign |
| Section case mismatches (`a` vs `A`) | Normalize section to uppercase on write AND on read |
| SQLite migration corrupts data | Migration is nullable-first → backfill → enforce-non-null |
