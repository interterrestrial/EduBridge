# Skill Observation Log

Observations captured during task-oriented work. Each entry identifies a
potential skill improvement or new skill opportunity.

**Status key:** OPEN = not yet actioned | ACTIONED = skill updated/created |
DECLINED = user decided not to pursue

---

## 2026-07-24

### Observation 1: Stale README contradicts actual implementation stack
**Date:** 2026-07-24
**Session context:** Context ingestion of EduBridge project — verifying handover doc against actual codebase
**Skill:** New skill candidate: context-ingestion-verifier
**Type:** open-source
**Phase/Area:** Documentation drift detection

**Issue:** During context ingestion, the root README.md described the backend as "FastAPI + Python" and the database as "PostgreSQL + Prisma ORM" with authentication via "Clerk Authentication" and deployment on "Vercel / Railway". The ACTUAL codebase is Node.js + Express + TypeScript, SQLite, JWT-based auth, and a Groq+Gemini multi-provider LLM pipeline. A separate docs/implementation.md ("AI/ML Implementation Guide") was accurate. This caused a momentary contradiction that had to be resolved by reading the actual code rather than trusting the README.

**Suggested improvement:** A context-ingestion skill should include an explicit step: "cross-check the project's primary README/marketing docs against the actual package.json / source files, and flag any stack mismatch BEFORE trusting the documentation." Trust hierarchy should be: source code + package manifests > handover doc > README/marketing docs.

**Principle:** Documentation drifts from implementation faster than implementation drifts from documentation. When ingesting a codebase, the source of truth is the code and manifests, not the README. A verification skill must explicitly de-rank prose documentation below code-level evidence.

---

### Observation 2: No CLAUDE.md / config-level task-observer trigger present
**Date:** 2026-07-24
**Session context:** First session start; task-observer was activated by the SessionStart hook, not by a config instruction
**Skill:** task-observer (self-referential)
**Type:** open-source
**Phase/Area:** Recommended Activation Setup

**Issue:** The workspace has no CLAUDE.md, GEMINI.md, or AGENTS.md at root (only .agents/AGENTS.md with a single error-transparency rule). task-observer fired only because of the harness SessionStart hook. The skill's own guidance states the structural trigger is the primary reliable activation mechanism and a config-level instruction is the recommended dual-layer safety net.

**Suggested improvement:** Add a task-observer activation instruction to the project's config (CLAUDE.md or root AGENTS.md) so that description-level matching is not the sole activation path. Without it, sessions that don't match the description triggers may skip observation capture.

**Principle:** Reliable skill activation requires structural (config-level) triggers, not just description matching. A harness hook works in one environment but does not generalize; a config instruction travels with the project.

---

### Observation 3: Handover doc omitted the /dashboard redirect route and /settings page
**Date:** 2026-07-24
**Session context:** Frontend verification against handover doc's page list
**Skill:** New skill candidate: context-ingestion-verifier
**Type:** open-source
**Phase/Area:** Route/page completeness

**Issue:** The handover doc listed 12 client pages but omitted two that exist and are wired into the auth flow: `/dashboard` (a pure redirect hub that `useAuth().login()` always targets, dispatching by role to `/student-dashboard` or `/teacher-dashboard`) and `/settings` (linked from the Sidebar, role-agnostic). A developer trusting the handover doc as authoritative would not know these routes exist, and would be confused that `login()` routes to `/dashboard` instead of a role-specific path.

**Suggested improvement:** A context-ingestion skill should, when a route map is given, verify it against the router/page files directly (glob for page.tsx files in app router) rather than trusting the prose list, and explicitly call out undocumented routes.

**Principle:** Prose route lists in handover docs are inevitably incomplete. The authoritative route inventory is the filesystem (page.tsx locations in Next.js App Router, or route definitions in Express). Always derive the route map from the filesystem.

---

### Observation 4: Significant security posture gap — no authentication on data-mutating endpoints
**Date:** 2026-07-24
**Session context:** Backend verification; tracing which endpoints are protected
**Skill:** New skill candidate: context-ingestion-verifier (security dimension)
**Type:** open-source
**Phase/Area:** Security cross-check during ingestion

**Issue:** The `authenticate` middleware exists and is applied ONLY to `/api/auth/me` and `/api/auth/update-role`. Every other endpoint — note upload, AI chat, quiz generate/submit, flashcard generate/delete, analytics, teacher heatmap, teacher push-assignment — is completely unauthenticated and trusts a `studentId` parameter from the request body/params. This means any client can read/modify any student's data by guessing or supplying a studentId. Additionally, `server/.env` with live Groq/Gemini API keys is committed to the repo. The handover doc's "Important Rules" mention JWT but do not surface this as a known risk.

**Suggested improvement:** A context-ingestion skill for a full-stack app should include a mandatory security posture check: enumerate which endpoints are auth-protected vs open, check whether secrets are committed, and surface these as a distinct findings category alongside architecture understanding. Do not let a "context ingestion" task silently skip a security audit when the code is plainly insecure — flag it explicitly to the user.

**Principle:** Context ingestion of a codebase is not purely descriptive — it has an evaluative duty. When the code contains security issues obvious from a structural read, the ingestion report must surface them rather than just documenting how the (insecure) flow works. Understanding the architecture and noting its risks are part of the same activity.


### Observation 5: Subagent-driven plan execution surfaces spec verbatim-code that doesn't compile against real schema
**Date:** 2026-07-24
**Session context:** Executing a 15-task backend finalization plan via subagent-driven development; multiple implementer subagents reported DONE_WITH_CONCERNS
**Skill:** New skill candidate: context-ingestion-verifier (extends to plan execution)
**Type:** open-source
**Phase/Area:** Plan authoring — verbatim code accuracy

**Issue:** The writing-plans skill produced a high-quality plan with complete verbatim code in every step. However, when subagent implementers pasted the verbatim code, several tasks failed to compile against the ACTUAL schema/codebase state. Examples encountered: (1) `semester: 6` (number) but schema field is `String?` → needed `'6'`; (2) `skipDuplicates: true` on `createMany` but SQLite connector types it as `never` → TS2322; (3) `setupFilesAfterEach` is not a real Jest config key (typo for `setupFilesAfterEnv`); (4) the analytics `ClassroomSummary` type required fields the spec's verbatim summary object didn't include; (5) Express 5 types `req.params` as `string | string[]` requiring `as string` casts. Each implementer correctly diagnosed and fixed these, but they were all preventable.

**Suggested improvement:** A writing-plans skill (or a pre-execution verification step) should type-check the plan's verbatim code against the actual schema and tsconfig BEFORE the plan is finalized. At minimum, the plan's self-review step should include "compile-check any code blocks against the real schema/types" as an explicit checklist item. The current self-review checks spec coverage, placeholders, and type-name consistency, but not compile-ability of the code itself.

**Principle:** Verbatim code in a plan is a promise that the code will compile. When it doesn't, every implementer burns context diagnosing the same class of issue. Plans with code should be compile-verified against the target codebase's types before handoff — the cost of a `tsc --noEmit` on the plan's code is far lower than N subagents each debugging independently.

---

### Observation 6: Final code reviewer found narrow IDOR gaps the per-task reviewers missed
**Date:** 2026-07-24
**Session context:** Subagent-driven development with two-stage review per task; final holistic review caught issues per-task reviews didn't
**Skill:** subagent-driven-development (process improvement)
**Type:** open-source
**Phase/Area:** Review completeness — per-task vs holistic

**Issue:** Every task passed its two-stage review (spec compliance + code quality). But the final holistic review of the entire diff found two ownership-check gaps that per-task reviews missed: `chatTutor` accepted an arbitrary `sessionId` from the body without verifying it belonged to the caller, and `submitQuiz` used `findUnique` (any quiz) instead of `findFirst` with `studentId` (owned quiz). The per-task reviewer for Task 7 checked that `resolveStudentId` was used and that mutation handlers had ownership checks — but didn't catch that `chatTutor` received a `sessionId` from the body and wrote into it, or that `submitQuiz` looked up the quiz without scoping by owner. The holistic reviewer, seeing the entire diff at once, spotted the inconsistency: `getSessionMessages`/`deleteSession` DID check ownership but `chatTutor` (same file) didn't.

**Suggested improvement:** The subagent-driven-development skill should note that per-task reviews verify the task's explicit requirements, but cross-cutting security invariants (like "every body-supplied ID must be ownership-checked") are best caught by a final holistic review that looks for pattern CONSISTENCY across files, not just pattern PRESENCE within a file. The skill already mandates a final review — this observation reinforces WHY it's mandatory, not optional.

**Principle:** Per-task reviews catch what's missing WITHIN a task's scope. A final holistic review catches what's INCONSISTENT ACROSS tasks — same pattern implemented in 4 of 5 handlers but not the 5th. Security invariants are cross-cutting; they need a cross-cutting review.

---

### Observation 7: `git add -A` in a dirty working tree swept unrelated files into a scoped commit
**Date:** 2026-07-24
**Session context:** Executing Task 12 (delete dead file) directly; used `git add -A` which staged 12 files instead of 1
**Skill:** subagent-driven-development (execution hygiene)
**Type:** open-source
**Phase/Area:** Commit hygiene during direct execution

**Issue:** When executing a small task directly (not via subagent), I used `git add -A` to stage the deletion. But the working tree had many pre-existing unstaged changes from prior work (client pages, services, dev.db, plan doc, observation log). `git add -A` staged ALL of them into a commit titled "remove unused scoreCalculator utility" — 12 files, 3230 insertions. This required a `git reset --soft HEAD~1` followed by selective `git add <specific-file>` to fix. The subagent implementers correctly avoided this by always using `git add <specific-files>`, but when the controller executes directly, the same discipline must apply.

**Suggested improvement:** When the subagent-driven-development controller executes tasks directly (for small mechanical tasks), it should follow the same commit-scoping discipline as subagent implementers: stage only the task's specific files, never `git add -A` or `git add .` in a dirty working tree. The skill's implementer prompt template says "git add <specific files>" — the controller should hold itself to the same standard.

**Principle:** Commit hygiene discipline applies to the controller, not just the subagents. `git add -A` in a dirty tree is a footgun that mixes unrelated changes into scoped commits. Always stage by explicit path.

