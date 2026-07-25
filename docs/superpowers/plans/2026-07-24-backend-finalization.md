# EduBridge Backend Finalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finalize the EduBridge Express backend so it is secure (JWT-protected, ownership-scoped), complete (all folder/deck CRUD, teacher quiz-push), consistent (typed controllers, `AuthRequest` everywhere), and demo-ready (clean seed, working build, healthcheck, env hygiene).

**Architecture:** Extend the existing Express 5 + Prisma + FAISS stack. Introduce an ownership-scoped auth layer (`requireRole` + `resolveStudentId`) that replaces the trust-everything `studentId`-from-body pattern. Add the missing folder/deck CRUD endpoints. Wire the `Quiz` model into teacher push-assignments. Extract inline schedule prompts into `prompts/schedule.prompt.ts`. Remove dead code. Add a minimal Jest smoke test harness.

**Tech Stack:** Node.js 20+, Express 5, TypeScript, Prisma (SQLite), Jest 29 + Supertest 7, ts-node,jsonwebtoken, bcrypt, multer, groq-sdk, @langchain/google-genai, faiss-node.

---

## Scope Check

This plan covers one cohesive subsystem — the backend server. It does NOT touch the frontend (a follow-up plan will align `client/` API calls with the new auth contract). Each task below produces working, testable software on its own and commits independently.

---

## File Structure

**Files created:**
- `server/src/middleware/authorize.ts` — `requireRole(...roles)` + `resolveStudentId(req, opts)` helpers; the ownership/role guard layer.
- `server/src/utils/asyncHandler.ts` — `asyncHandler(fn)` wrapper that routes Promise rejections to Express error handling (removes try/catch boilerplate from controllers).
- `server/src/utils/apiError.ts` — `ApiError` class + `throwIfMissing(values, message)` for clean 400s.
- `server/src/prompts/schedule.prompt.ts` — extracted schedule-generation prompt builder (currently inline in `schedule.controller.ts`).
- `server/src/controllers/health.controller.ts` — `GET /api/health` handler.
- `server/src/routes/health.routes.ts` — health router.
- `server/src/__tests__/auth.test.ts` — Jest + Supertest tests for auth flow.
- `server/src/__tests__/folders.test.ts` — Jest + Supertest tests for folder CRUD.
- `server/src/__tests__/teacher.test.ts` — Jest + Supertest tests for teacher endpoints.
- `server/src/__tests__/setup.ts` — Jest global setup (in-memory DB, mock LLM).
- `server/jest.config.ts` — Jest config with TS support.
- `server/.env.example` — non-secret env template.
- `server/.gitignore` — ignores `.env`, `dev.db`, `dist/`, `vector_db/`, `uploads/`, `node_modules/`.

**Files modified:**
- `server/src/app.ts` — register health router, global error handler, request logger.
- `server/src/middleware/authenticate.ts` — add `requireRole` re-export bridge (kept for compatibility).
- `server/src/controllers/auth.controller.ts` — use `asyncHandler`, harden `googleAuth` (remove unused `OAuth2Client`).
- `server/src/controllers/folder.controller.ts` — convert to `AuthRequest`, add ownership checks, add `updateNoteFolder`, `deleteNoteFolder`, `updateFlashcardFolder`, `deleteFlashcardFolder`.
- `server/src/controllers/note.controller.ts` — convert to `AuthRequest`, derive `studentId` from `req.user`, add `deleteNote`.
- `server/src/controllers/ai.controller.ts` — convert to `AuthRequest`, derive `studentId` from `req.user`.
- `server/src/controllers/flashcard.controller.ts` — convert to `AuthRequest`, derive `studentId` from `req.user`, add `updateFlashcard`.
- `server/src/controllers/quiz.controller.ts` — convert to `AuthRequest`, derive `studentId` from `req.user`, remove dead `KnowledgeGapService`.
- `server/src/controllers/analytics.controller.ts` — convert to `AuthRequest`, derive `studentId` from `req.user`.
- `server/src/controllers/schedule.controller.ts` — convert to `AuthRequest`, derive `studentId` from `req.user`, use extracted prompt.
- `server/src/controllers/teacher.controller.ts` — convert to `AuthRequest`, enforce `teacher` role, derive `teacherId` from `req.user`, support `quizId` push.
- `server/src/routes/folder.routes.ts` — add PATCH/DELETE for folders & decks, apply `authenticate` + `requireRole('student')`.
- `server/src/routes/note.routes.ts` — apply `authenticate`, add DELETE route, switch to `:studentId` self-derived.
- `server/src/routes/ai.routes.ts` — apply `authenticate`.
- `server/src/routes/flashcard.routes.ts` — apply `authenticate`, add PATCH route.
- `server/src/routes/quiz.routes.ts` — apply `authenticate`.
- `server/src/routes/analytics.routes.ts` — apply `authenticate`, add `requireRole('student')`.
- `server/src/routes/schedule.routes.ts` — apply `authenticate`.
- `server/src/routes/teacher.routes.ts` — apply `authenticate` + `requireRole('teacher')`.
- `server/package.json` — add `build`, `test`, `test:watch`, `db:seed`, `db:reset` scripts; add `prisma.seed` config; add Jest/Supertest devDeps; add `@langchain/textsplitters` as explicit dep.
- `server/prisma/seed.ts` — make resumable (delete-many before create), remove FAISS side-effect from seed (keep seed DB-only).
- `server/prisma/schema.prisma` — no structural change; add `@@index` on `Note.studentId`, `Flashcard.studentId`, `Quiz.studentId`, `ChatMessage.studentId` for query performance (additive).
- `server/tsconfig.json` — no change (already includes `src/**/*`).
- `server/.env` — (operator action, not code) rotate keys; tracked in Task 14.

---

## Task 1: Add Jest + Supertest test harness with in-memory DB

**Files:**
- Create: `server/jest.config.ts`
- Create: `server/src/__tests__/setup.ts`
- Modify: `server/package.json` (scripts + devDeps)
- Create: `server/src/__tests__/smoke.test.ts`

- [ ] **Step 1: Install test devDependencies**

Run:
```bash
cd server && npm install --save-dev jest@29 ts-jest@29 @types/jest@29 supertest@7 @types/supertest@7
```
Expected: packages added to `devDependencies`.

- [ ] **Step 2: Create `server/jest.config.ts`**

```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEach: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
};

export default config;
```

- [ ] **Step 3: Create `server/src/__tests__/setup.ts`**

This provides a separate SQLite test DB file and wipes it before each test suite, plus a mock LLM so tests never hit Groq/Gemini.

```ts
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TEST_DB = path.join(__dirname, '..', '..', 'prisma', 'test.db');
const TEST_DB_URL = `file:${TEST_DB}`;

// Point Prisma at the test DB before importing the app
process.env.DATABASE_URL = TEST_DB_URL;
process.env.JWT_SECRET = 'test_secret';
process.env.GEMINI_API_KEY = 'dummy_key_for_test';
// No GROQ keys set -> LlmService falls straight to (mocked) Gemini path

// Mock the LlmService before any controller imports it
jest.mock('../services/llm.service', () => {
  const LlmService = jest.fn().mockImplementation(() => ({
    generate: jest.fn().mockResolvedValue('{"answer":"mocked"}'),
    getModel: jest.fn(),
  }));
  return { LlmService };
});

beforeAll(() => {
  // Push schema into the test DB
  execSync('npx prisma db push --force-reset --skip-generate', {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: 'inherit',
  });
});

afterAll(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});
```

- [ ] **Step 4: Create `server/src/__tests__/smoke.test.ts`**

```ts
import request from 'supertest';
import app from '../app';

describe('smoke', () => {
  it('returns 200 on health route placeholder', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('EduBridge');
  });
});
```

- [ ] **Step 5: Add npm scripts to `server/package.json`**

In the `"scripts"` block, add:
```json
"test": "jest --runInBand",
"test:watch": "jest --watch"
```

- [ ] **Step 6: Run tests to verify the harness works**

Run: `cd server && npm test`
Expected: 1 passing test ("returns 200 on health route placeholder"). If `prisma db push` fails because `test.db` doesn't exist yet, that is expected on first run — Prisma creates it. If it errors on `--force-reset`, drop that flag for the first run only.

- [ ] **Step 7: Commit**

```bash
cd server
git add jest.config.ts src/__tests__/ package.json
git commit -m "test: add Jest + Supertest harness with in-memory DB and mocked LLM"
```

---

## Task 2: Add `asyncHandler` and `ApiError` utilities

**Files:**
- Create: `server/src/utils/asyncHandler.ts`
- Create: `server/src/utils/apiError.ts`

- [ ] **Step 1: Create `server/src/utils/asyncHandler.ts`**

```ts
import { Request, Response, NextFunction } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps an async controller so rejected promises are forwarded to Express error handling
 * instead of silently swallowed by an unhandled try/catch.
 */
export const asyncHandler =
  (fn: AsyncFn) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
```

- [ ] **Step 2: Create `server/src/utils/apiError.ts`**

```ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Throws an ApiError(400) if any value is null/undefined/empty-string.
 * `fields` is a record of fieldName -> value.
 */
export function throwIfMissing(fields: Record<string, unknown>, message = 'Missing required field(s)'): void {
  const missing = Object.entries(fields)
    .filter(([, v]) => v === undefined || v === null || (typeof v === 'string' && v.trim() === ''))
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new ApiError(400, `${message}: ${missing.join(', ')}`);
  }
}
```

- [ ] **Step 3: Add a failing test for `throwIfMissing`**

Create `server/src/__tests__/apiError.test.ts`:
```ts
import { ApiError, throwIfMissing } from '../utils/apiError';

describe('apiError utils', () => {
  it('throws ApiError(400) when a field is missing', () => {
    expect(() => throwIfMissing({ a: undefined, b: 'x' })).toThrow(ApiError);
    expect(() => throwIfMissing({ a: undefined })).toThrow(/Missing required field\(s\): a/);
  });
  it('does not throw when all fields present', () => {
    expect(() => throwIfMissing({ a: 1, b: 'y' })).not.toThrow();
  });
});
```

- [ ] **Step 4: Run the test**

Run: `cd server && npm test -- apiError`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
cd server
git add src/utils/asyncHandler.ts src/utils/apiError.ts src/__tests__/apiError.test.ts
git commit -m "feat(utils): add asyncHandler and ApiError helpers"
```

---

## Task 3: Add `requireRole` + `resolveStudentId` authorization middleware

**Files:**
- Create: `server/src/middleware/authorize.ts`

- [ ] **Step 1: Create `server/src/middleware/authorize.ts`**

This file builds on the existing `AuthRequest` from `authenticate.ts`. It does NOT re-implement JWT verification — `authenticate` runs first, then these guards consume `req.user`.

```ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { ApiError } from '../utils/apiError';

/**
 * Returns middleware that 403s unless req.user.role is in the allow-list.
 * Must be mounted AFTER `authenticate`.
 */
export const requireRole =
  (...roles: string[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized: authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `Forbidden: requires role ${roles.join(' or ')}`);
    }
    next();
  };

/**
 * Resolves the "owner" studentId for an endpoint.
 *
 * - Students OWN their data: the studentId is taken from req.user.id (the JWT),
 *   NEVER from the request body or URL. This prevents IDOR.
 * - Teachers may act on any student: in that case studentId comes from req.body
 *   or req.params. The route must wrap this with requireRole('teacher').
 *
 * Usage:
 *   router.get('/student/me', authenticate, requireRole('student'), (req,res) => {
 *     const studentId = resolveStudentId(req, { allowTeacherOverride: false });
 *     ...
 *   });
 */
export function resolveStudentId(
  req: AuthRequest,
  opts: { allowTeacherOverride?: boolean } = {},
): string {
  const { allowTeacherOverride = false } = opts;
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized: authentication required');
  }
  if (req.user.role === 'student') {
    return req.user.id;
  }
  if (allowTeacherOverride && req.user.role === 'teacher') {
    const fromParams = req.params.studentId as string | undefined;
    const fromBody = req.body?.studentId as string | undefined;
    const resolved = fromParams || fromBody;
    if (!resolved) {
      throw new ApiError(400, 'studentId is required for teacher override');
    }
    return resolved;
  }
  throw new ApiError(403, 'Forbidden: only students may access their own data');
}
```

- [ ] **Step 2: Add a failing test**

Create `server/src/__tests__/authorize.test.ts`:
```ts
import { requireRole, resolveStudentId } from '../middleware/authorize';
import { ApiError } from '../utils/apiError';
import type { AuthRequest } from '../middleware/authenticate';

const mockReq = (user: AuthRequest['user'] | undefined, params = {}, body = {}): AuthRequest =>
  ({ user, params, body } as AuthRequest);

describe('requireRole', () => {
  const next = jest.fn();
  beforeEach(() => next.mockClear());

  it('403s when user role not allowed', () => {
    expect(() => requireRole('teacher')(mockReq({ id: 's1', email: 'e', role: 'student' }), {} as any, next)).toThrow(ApiError);
  });
  it('passes when role allowed', () => {
    requireRole('student')(mockReq({ id: 's1', email: 'e', role: 'student' }), {} as any, next);
    expect(next).toHaveBeenCalled();
  });
  it('401s when no user', () => {
    expect(() => requireRole('student')(mockReq(undefined), {} as any, next)).toThrow(ApiError);
  });
});

describe('resolveStudentId', () => {
  it('returns req.user.id for students (never body)', () => {
    const id = resolveStudentId(mockReq({ id: 'real-id', email: 'e', role: 'student' }, {}, { studentId: 'hacked-id' }));
    expect(id).toBe('real-id');
  });
  it('allows teacher override from params', () => {
    const id = resolveStudentId(mockReq({ id: 't1', email: 'e', role: 'teacher' }, { studentId: 's1' }), { allowTeacherOverride: true });
    expect(id).toBe('s1');
  });
  it('blocks teacher override when not allowed', () => {
    expect(() => resolveStudentId(mockReq({ id: 't1', email: 'e', role: 'teacher' }, { studentId: 's1' }))).toThrow(ApiError);
  });
});
```

- [ ] **Step 3: Run the test**

Run: `cd server && npm test -- authorize`
Expected: 5 passing.

- [ ] **Step 4: Commit**

```bash
cd server
git add src/middleware/authorize.ts src/__tests__/authorize.test.ts
git commit -m "feat(auth): add requireRole and resolveStudentId ownership guards"
```

---

## Task 4: Add global error handler + request logger to `app.ts`

**Files:**
- Modify: `server/src/app.ts`

- [ ] **Step 1: Replace `server/src/app.ts` with the hardened version**

```ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import noteRoutes from './routes/note.routes';
import folderRoutes from './routes/folder.routes';
import aiRoutes from './routes/ai.routes';
import quizRoutes from './routes/quiz.routes';
import flashcardRoutes from './routes/flashcard.routes';
import analyticsRoutes from './routes/analytics.routes';
import scheduleRoutes from './routes/schedule.routes';
import teacherRoutes from './routes/teacher.routes';
import healthRoutes from './routes/health.routes';
import { ApiError } from './utils/apiError';

const app: Application = express();

app.use(cors());
app.use(express.json());

// Lightweight request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/teacher', teacherRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'EduBridge API', time: new Date().toISOString() });
});

// 404 for unmatched routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Central error handler — converts ApiError to its status, everything else to 500
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
```

- [ ] **Step 2: Create `server/src/routes/health.routes.ts` and `server/src/controllers/health.controller.ts`**

`server/src/controllers/health.controller.ts`:
```ts
import { Request, Response } from 'express';
import prisma from '../prisma';

export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'disconnected', time: new Date().toISOString() });
  }
};
```

`server/src/routes/health.routes.ts`:
```ts
import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/', asyncHandler(healthCheck));
export default router;
```

- [ ] **Step 3: Run existing tests to ensure nothing broke**

Run: `cd server && npm test`
Expected: all previously passing tests still pass, plus the smoke test now also exercises `GET /api/health` indirectly (still passes).

- [ ] **Step 4: Commit**

```bash
cd server
git add src/app.ts src/routes/health.routes.ts src/controllers/health.controller.ts
git commit -m "feat(app): add global error handler, request logger, and health route"
```

---

## Task 5: Convert `auth.controller.ts` to asyncHandler + harden googleAuth

**Files:**
- Modify: `server/src/controllers/auth.controller.ts`
- Modify: `server/src/routes/auth.routes.ts`

- [ ] **Step 1: Rewrite `server/src/controllers/auth.controller.ts`**

```ts
import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../prisma';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/authenticate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

const sanitizeUser = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
});

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password, role } = req.body;
  throwIfMissing({ name, email, password, role });

  if (role !== 'student' && role !== 'teacher') {
    throw new ApiError(400, 'Invalid role. Must be student or teacher.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'User already exists');

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      studentProfile: role === 'student' ? { create: {} } : undefined,
      teacherProfile: role === 'teacher' ? { create: {} } : undefined,
    },
  });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  res.status(201).json({ message: 'User registered successfully', token, user: sanitizeUser(user) });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  throwIfMissing({ email, password });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) throw new ApiError(401, 'Invalid email or password');

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  res.status(200).json({ message: 'Login successful', token, user: sanitizeUser(user) });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Unauthorized');
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { studentProfile: true, teacherProfile: true },
  });
  if (!user) throw new ApiError(404, 'User not found');
  const { password: _pw, ...userWithoutPassword } = user;
  res.status(200).json({ user: userWithoutPassword });
});

export const googleAuth = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  throwIfMissing({ token });

  // NOTE: removed unused OAuth2Client instantiation. Google token verification
  // uses the userinfo endpoint directly (the pre-existing approach).
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new ApiError(400, 'Invalid Google token');

  const payload = await response.json();
  if (!payload?.email) throw new ApiError(400, 'Invalid Google payload');

  const { email, name, sub: googleId, picture: avatar } = payload;

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(randomPassword);
    user = await prisma.user.create({
      data: { name: name || 'Google User', email, password: hashedPassword, role: 'unassigned', provider: 'google', googleId, avatar },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { email },
      data: { googleId, provider: 'google', avatar: user.avatar || avatar },
    });
  }

  const jwtToken = generateToken({ id: user.id, email: user.email, role: user.role });
  res.status(200).json({ message: 'Google login successful', token: jwtToken, user: sanitizeUser(user) });
});

export const updateRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Unauthorized');
  const { role } = req.body;
  if (role !== 'student' && role !== 'teacher') throw new ApiError(400, 'Invalid role. Must be student or teacher.');

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role !== 'unassigned') throw new ApiError(400, 'Role is already assigned');

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      role,
      studentProfile: role === 'student' ? { create: {} } : undefined,
      teacherProfile: role === 'teacher' ? { create: {} } : undefined,
    },
  });

  const jwtToken = generateToken({ id: updated.id, email: updated.email, role: updated.role });
  res.status(200).json({ message: 'Role updated successfully', token: jwtToken, user: sanitizeUser(updated) });
});
```

- [ ] **Step 2: `server/src/routes/auth.routes.ts` — no signature changes needed, but ensure handlers are wrapped**

```ts
import { Router } from 'express';
import { register, login, getMe, googleAuth, updateRole } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/update-role', authenticate, updateRole);
router.get('/me', authenticate, getMe);

export default router;
```
(Note: `asyncHandler` is applied inside the controller exports, so the route file stays clean.)

- [ ] **Step 3: Add an auth flow test**

Create `server/src/__tests__/auth.test.ts`:
```ts
import request from 'supertest';
import app from '../app';

describe('auth flow', () => {
  it('registers a student, logs in, and reads /me', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Test Student', email: 'stu@test.io', password: 'pw1234', role: 'student',
    });
    expect(reg.status).toBe(201);
    const token = reg.body.token;

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('stu@test.io');

    // /me without token
    const nope = await request(app).get('/api/auth/me');
    expect(nope.status).toBe(401);
  });

  it('rejects duplicate registration', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Dup', email: 'dup@test.io', password: 'pw1234', role: 'student',
    });
    const second = await request(app).post('/api/auth/register').send({
      name: 'Dup', email: 'dup@test.io', password: 'pw1234', role: 'student',
    });
    expect(second.status).toBe(409);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `cd server && npm test -- auth`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
cd server
git add src/controllers/auth.controller.ts src/routes/auth.routes.ts src/__tests__/auth.test.ts
git commit -m "refactor(auth): convert to asyncHandler, harden googleAuth, add auth tests"
```

---

## Task 6: Finalize folder CRUD (create/update/delete for notes & decks)

**Files:**
- Modify: `server/src/controllers/folder.controller.ts`
- Modify: `server/src/routes/folder.routes.ts`

- [ ] **Step 1: Rewrite `server/src/controllers/folder.controller.ts`**

Adds `updateNoteFolder`, `deleteNoteFolder`, `updateFlashcardFolder`, `deleteFlashcardFolder`, and converts all handlers to `AuthRequest` + `resolveStudentId` + `asyncHandler`.

```ts
import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authenticate';
import { resolveStudentId } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

// --- NOTE FOLDERS ---

export const createNoteFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { name, color } = req.body;
  throwIfMissing({ name });
  const folder = await prisma.noteFolder.create({
    data: { name, color: color || '#6366f1', studentId },
    include: { notes: true },
  });
  res.status(201).json({ message: 'Note folder created successfully', folder });
});

export const getNoteFolders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const folders = await prisma.noteFolder.findMany({
    where: { studentId },
    include: { notes: { select: { id: true, title: true, fileType: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ folders });
});

export const updateNoteFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { folderId } = req.params;
  const { name, color } = req.body;
  throwIfMissing({ folderId });
  // Ownership check
  const existing = await prisma.noteFolder.findFirst({ where: { id: folderId, studentId } });
  if (!existing) throw new ApiError(404, 'Folder not found or not owned by you');
  const updated = await prisma.noteFolder.update({
    where: { id: folderId },
    data: { ...(name && { name }), ...(color && { color }) },
    include: { notes: true },
  });
  res.status(200).json({ message: 'Folder updated', folder: updated });
});

export const deleteNoteFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { folderId } = req.params;
  throwIfMissing({ folderId });
  const existing = await prisma.noteFolder.findFirst({ where: { id: folderId, studentId } });
  if (!existing) throw new ApiError(404, 'Folder not found or not owned by you');
  // Schema onDelete: SetNull on Note.folderId, so notes become uncategorized (safe)
  await prisma.noteFolder.delete({ where: { id: folderId } });
  res.status(200).json({ message: 'Folder deleted; notes moved to uncategorized' });
});

export const moveNoteToFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { noteId } = req.params;
  const { folderId } = req.body; // string or null to unassign
  throwIfMissing({ noteId });
  const note = await prisma.note.findFirst({ where: { id: noteId, studentId } });
  if (!note) throw new ApiError(404, 'Note not found or not owned by you');
  if (folderId) {
    const folder = await prisma.noteFolder.findFirst({ where: { id: folderId, studentId } });
    if (!folder) throw new ApiError(404, 'Target folder not found or not owned by you');
  }
  const updated = await prisma.note.update({
    where: { id: noteId },
    data: { folderId: folderId || null },
  });
  res.status(200).json({ message: 'Note folder updated successfully', note: updated });
});

// --- FLASHCARD FOLDERS / DECKS ---

export const createFlashcardFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { name, topic, noteId } = req.body;
  throwIfMissing({ name });
  const deck = await prisma.flashcardFolder.create({
    data: { name, topic: topic || 'General', studentId, noteId: noteId || null },
    include: { flashcards: true },
  });
  res.status(201).json({ message: 'Flashcard deck created successfully', deck });
});

export const getFlashcardFolders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const decks = await prisma.flashcardFolder.findMany({
    where: { studentId },
    include: { flashcards: true },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ decks });
});

export const updateFlashcardFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { folderId } = req.params;
  const { name, topic } = req.body;
  throwIfMissing({ folderId });
  const existing = await prisma.flashcardFolder.findFirst({ where: { id: folderId, studentId } });
  if (!existing) throw new ApiError(404, 'Deck not found or not owned by you');
  const updated = await prisma.flashcardFolder.update({
    where: { id: folderId },
    data: { ...(name && { name }), ...(topic && { topic }) },
    include: { flashcards: true },
  });
  res.status(200).json({ message: 'Deck updated', deck: updated });
});

export const deleteFlashcardFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { folderId } = req.params;
  throwIfMissing({ folderId });
  const existing = await prisma.flashcardFolder.findFirst({ where: { id: folderId, studentId } });
  if (!existing) throw new ApiError(404, 'Deck not found or not owned by you');
  await prisma.flashcardFolder.delete({ where: { id: folderId } });
  res.status(200).json({ message: 'Deck deleted; flashcards moved to uncategorized' });
});

export const moveFlashcardToFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { cardId } = req.params;
  const { folderId } = req.body;
  throwIfMissing({ cardId });
  const card = await prisma.flashcard.findFirst({ where: { id: cardId, studentId } });
  if (!card) throw new ApiError(404, 'Flashcard not found or not owned by you');
  if (folderId) {
    const deck = await prisma.flashcardFolder.findFirst({ where: { id: folderId, studentId } });
    if (!deck) throw new ApiError(404, 'Target deck not found or not owned by you');
  }
  const updated = await prisma.flashcard.update({
    where: { id: cardId },
    data: { folderId: folderId || null },
  });
  res.status(200).json({ message: 'Flashcard moved to deck successfully', flashcard: updated });
});
```

- [ ] **Step 2: Rewrite `server/src/routes/folder.routes.ts`**

```ts
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import {
  createNoteFolder,
  getNoteFolders,
  updateNoteFolder,
  deleteNoteFolder,
  moveNoteToFolder,
  createFlashcardFolder,
  getFlashcardFolders,
  updateFlashcardFolder,
  deleteFlashcardFolder,
  moveFlashcardToFolder,
} from '../controllers/folder.controller';

const router = Router();

router.use(authenticate, requireRole('student'));

// Note Folders
router.post('/notes', createNoteFolder);
router.get('/notes/student/:studentId', getNoteFolders);
router.patch('/notes/:folderId', updateNoteFolder);
router.delete('/notes/:folderId', deleteNoteFolder);
router.patch('/notes/:noteId/move', moveNoteToFolder);

// Flashcard Folders / Decks
router.post('/flashcards', createFlashcardFolder);
router.get('/flashcards/student/:studentId', getFlashcardFolders);
router.patch('/flashcards/:folderId', updateFlashcardFolder);
router.delete('/flashcards/:folderId', deleteFlashcardFolder);
router.patch('/flashcards/:cardId/move', moveFlashcardToFolder);

export default router;
```

- [ ] **Step 3: Add a folder CRUD test**

Create `server/src/__tests__/folders.test.ts`:
```ts
import request from 'supertest';
import app from '../app';
import prisma from '../prisma';

let token: string;

beforeAll(async () => {
  const r = await request(app).post('/api/auth/register').send({
    name: 'Folder Stu', email: 'fold@test.io', password: 'pw1234', role: 'student',
  });
  token = r.body.token;
});

const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

describe('folder CRUD', () => {
  let folderId: string;
  it('creates a note folder', async () => {
    const r = await auth(request(app).post('/api/folders/notes').send({ name: 'Algorithms', color: '#ff0000' }));
    expect(r.status).toBe(201);
    folderId = r.body.folder.id;
  });
  it('updates the folder', async () => {
    const r = await auth(request(app).patch(`/api/folders/notes/${folderId}`).send({ name: 'Algos v2' }));
    expect(r.status).toBe(200);
    expect(r.body.folder.name).toBe('Algos v2');
  });
  it('lists folders', async () => {
    const r = await auth(request(app).get('/api/folders/notes/student/anything'));
    expect(r.status).toBe(200);
    expect(r.body.folders.length).toBeGreaterThanOrEqual(1);
  });
  it('deletes the folder', async () => {
    const r = await auth(request(app).delete(`/api/folders/notes/${folderId}`));
    expect(r.status).toBe(200);
  });
  it('rejects unauthenticated access', async () => {
    const r = await request(app).get('/api/folders/notes/student/x');
    expect(r.status).toBe(401);
  });
});

afterAll(async () => { await prisma.$disconnect(); });
```

- [ ] **Step 4: Run tests**

Run: `cd server && npm test -- folders`
Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
cd server
git add src/controllers/folder.controller.ts src/routes/folder.routes.ts src/__tests__/folders.test.ts
git commit -m "feat(folders): add update/delete for note folders & flashcard decks with ownership checks"
```

---

## Task 7: Convert notes, flashcards, quizzes, analytics, ai controllers to AuthRequest

This task applies the same ownership pattern to the remaining student-facing controllers. Each controller is converted to use `resolveStudentId(req)` instead of `req.body.studentId` / `req.params.studentId`.

**Files:**
- Modify: `server/src/controllers/note.controller.ts` (also adds `deleteNote`)
- Modify: `server/src/controllers/flashcard.controller.ts` (also adds `updateFlashcard`)
- Modify: `server/src/controllers/quiz.controller.ts` (also removes dead `KnowledgeGapService`)
- Modify: `server/src/controllers/analytics.controller.ts`
- Modify: `server/src/controllers/ai.controller.ts`
- Modify: all corresponding route files to apply `authenticate` + `requireRole('student')`

- [ ] **Step 1: Rewrite `server/src/controllers/note.controller.ts`**

```ts
import { Response } from 'express';
import fs from 'fs';
import prisma from '../prisma';
import { ExtractionService } from '../services/extraction.service';
import { ChunkingService } from '../services/chunking.service';
import { EmbeddingService } from '../services/embedding.service';
import { VectorService } from '../services/vector.service';
import path from 'path';
import { AuthRequest } from '../middleware/authenticate';
import { resolveStudentId } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

const extractionService = new ExtractionService();
const chunkingService = new ChunkingService();
const embeddingService = new EmbeddingService();
const vectorService = new VectorService(embeddingService);

export const uploadNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  const studentId = resolveStudentId(req);
  const { title, folderId } = req.body;
  if (!file) throw new ApiError(400, 'No file uploaded');

  const noteTitle = title || file.originalname;
  const note = await prisma.note.create({
    data: {
      title: noteTitle,
      filePath: file.path,
      fileType: path.extname(file.originalname).toLowerCase(),
      studentId,
      folderId: folderId || null,
    },
    include: { folder: true },
  });

  const rawDocs = await extractionService.extractFromFile(file.path);
  const chunks = await chunkingService.chunkDocuments(rawDocs, {
    studentId,
    documentId: note.id,
    documentTitle: note.title,
  });
  await vectorService.indexDocuments(studentId, chunks);

  res.status(201).json({ message: 'Note uploaded and indexed successfully', note, chunkCount: chunks.length });
});

export const getNotes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const notes = await prisma.note.findMany({
    where: { studentId },
    include: { folder: true },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ notes });
});

export const deleteNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { noteId } = req.params;
  throwIfMissing({ noteId });
  const note = await prisma.note.findFirst({ where: { id: noteId, studentId } });
  if (!note) throw new ApiError(404, 'Note not found or not owned by you');
  // Best-effort delete the uploaded file from disk
  if (note.filePath) {
    fs.promises.unlink(note.filePath).catch(() => {});
  }
  // NOTE: vector deletion is out of scope here (FAISS doesn't support deletion cleanly);
  // a follow-up task will handle re-indexing. We delete the DB row only.
  await prisma.note.delete({ where: { id: noteId } });
  res.status(200).json({ message: 'Note deleted successfully' });
});
```

- [ ] **Step 2: Rewrite `server/src/routes/note.routes.ts`**

```ts
import { Router } from 'express';
import { uploadNote, getNotes, deleteNote } from '../controllers/note.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate, requireRole('student'));

router.post('/upload', upload.single('file'), uploadNote);
router.get('/student/:studentId', getNotes);
router.delete('/:noteId', deleteNote);

export default router;
```

- [ ] **Step 3: Rewrite `server/src/controllers/flashcard.controller.ts`**

```ts
import { Response } from 'express';
import prisma from '../prisma';
import { EmbeddingService } from '../services/embedding.service';
import { VectorService } from '../services/vector.service';
import { RetrievalService } from '../services/retrieval.service';
import { LlmService } from '../services/llm.service';
import { RagService } from '../services/rag.service';
import { AiFlashcardService } from '../services/aiFlashcard.service';
import { AuthRequest } from '../middleware/authenticate';
import { resolveStudentId } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

const embeddingService = new EmbeddingService();
const vectorService = new VectorService(embeddingService);
const retrievalService = new RetrievalService(vectorService);
const llmService = new LlmService();
const ragService = new RagService(retrievalService, llmService);
const flashcardService = new AiFlashcardService(ragService);

export const generateFlashcards = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { noteId, count = 5 } = req.body;
  const cards = await flashcardService.generateFlashcards({ studentId, noteId, count: Number(count) });
  const savedCards = await Promise.all(
    cards.map((card) =>
      prisma.flashcard.create({
        data: { question: card.question, answer: card.answer, topic: card.topic, type: card.type, noteId: noteId || null, studentId },
      }),
    ),
  );
  res.status(201).json({ message: 'Flashcards generated successfully', flashcards: savedCards });
});

export const getFlashcards = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const flashcards = await prisma.flashcard.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } });
  res.status(200).json({ flashcards });
});

export const updateFlashcard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { id } = req.params;
  const { question, answer, topic, folderId } = req.body;
  throwIfMissing({ id });
  const existing = await prisma.flashcard.findFirst({ where: { id, studentId } });
  if (!existing) throw new ApiError(404, 'Flashcard not found or not owned by you');
  const updated = await prisma.flashcard.update({
    where: { id },
    data: {
      ...(question !== undefined && { question }),
      ...(answer !== undefined && { answer }),
      ...(topic !== undefined && { topic }),
      ...(folderId !== undefined && { folderId: folderId || null }),
    },
  });
  res.status(200).json({ message: 'Flashcard updated', flashcard: updated });
});

export const deleteFlashcard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { id } = req.params;
  throwIfMissing({ id });
  const existing = await prisma.flashcard.findFirst({ where: { id, studentId } });
  if (!existing) throw new ApiError(404, 'Flashcard not found or not owned by you');
  await prisma.flashcard.delete({ where: { id } });
  res.status(200).json({ message: 'Flashcard deleted successfully' });
});
```

- [ ] **Step 4: Rewrite `server/src/routes/flashcard.routes.ts`**

```ts
import { Router } from 'express';
import { generateFlashcards, getFlashcards, updateFlashcard, deleteFlashcard } from '../controllers/flashcard.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();

router.use(authenticate, requireRole('student'));

router.post('/generate', generateFlashcards);
router.get('/student/:studentId', getFlashcards);
router.patch('/:id', updateFlashcard);
router.delete('/:id', deleteFlashcard);

export default router;
```

- [ ] **Step 5: Rewrite `server/src/controllers/quiz.controller.ts`** (removes dead `KnowledgeGapService`)

```ts
import { Response } from 'express';
import prisma from '../prisma';
import { EmbeddingService } from '../services/embedding.service';
import { VectorService } from '../services/vector.service';
import { RetrievalService } from '../services/retrieval.service';
import { LlmService } from '../services/llm.service';
import { RagService } from '../services/rag.service';
import { AiQuizService } from '../services/aiQuiz.service';
import { EvaluationService } from '../services/evaluation.service';
import { AuthRequest } from '../middleware/authenticate';
import { resolveStudentId } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

const embeddingService = new EmbeddingService();
const vectorService = new VectorService(embeddingService);
const retrievalService = new RetrievalService(vectorService);
const llmService = new LlmService();
const ragService = new RagService(retrievalService, llmService);
const quizService = new AiQuizService(ragService);
const evalService = new EvaluationService();

export const generateQuiz = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { noteId, difficulty = 'medium', count = 5, title } = req.body;
  const questions = await quizService.generateQuiz({ studentId, noteId, difficulty, count: Number(count) });
  const quiz = await prisma.quiz.create({
    data: { title: title || `Quiz on ${difficulty} level`, difficulty, questionsJson: JSON.stringify(questions), noteId: noteId || null, studentId },
  });
  res.status(201).json({ id: quiz.id, title: quiz.title, difficulty: quiz.difficulty, questions, createdAt: quiz.createdAt });
});

export const submitQuiz = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { quizId, answers } = req.body;
  throwIfMissing({ quizId, answers });
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) throw new ApiError(404, 'Quiz not found');
  const questions = JSON.parse(quiz.questionsJson);
  const result = evalService.evaluateQuizAttempt({ quizId, studentId, answers }, questions);
  const attempt = await prisma.quizAttempt.create({
    data: { quizId, studentId, score: result.score, totalQuestions: result.totalQuestions, accuracy: result.accuracy, weakTopicsJson: JSON.stringify(result.weakTopics) },
  });
  res.status(200).json({ attemptId: attempt.id, score: result.score, totalQuestions: result.totalQuestions, accuracy: result.accuracy, evaluations: result.evaluations, weakTopics: result.weakTopics, strongTopics: result.strongTopics });
});

export const getQuizzes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const quizzes = await prisma.quiz.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' }, include: { attempts: true } });
  const formatted = quizzes.map((q) => ({ id: q.id, title: q.title, difficulty: q.difficulty, questions: JSON.parse(q.questionsJson), attemptCount: q.attempts.length, createdAt: q.createdAt }));
  res.status(200).json({ quizzes: formatted });
});
```

- [ ] **Step 6: Rewrite `server/src/routes/quiz.routes.ts`**

```ts
import { Router } from 'express';
import { generateQuiz, submitQuiz, getQuizzes } from '../controllers/quiz.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();
router.use(authenticate, requireRole('student'));
router.post('/generate', generateQuiz);
router.post('/submit', submitQuiz);
router.get('/student/:studentId', getQuizzes);
export default router;
```

- [ ] **Step 7: Rewrite `server/src/controllers/analytics.controller.ts`** (full rewrite — the existing one computes mastery inline; we keep that logic but convert to AuthRequest)

```ts
import { Response } from 'express';
import prisma from '../prisma';
import { LlmService } from '../services/llm.service';
import { RecommendationService } from '../services/recommendation.service';
import { AuthRequest } from '../middleware/authenticate';
import { resolveStudentId } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';

const llmService = new LlmService();
const recService = new RecommendationService(llmService);

export const getStudentAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const [attempts, flashcards, profile] = await Promise.all([
    prisma.quizAttempt.findMany({ where: { studentId } }),
    prisma.flashcard.findMany({ where: { studentId } }),
    prisma.studentProfile.findUnique({ where: { userId: studentId } }),
  ]);

  const accuracies = attempts.map((a) => a.accuracy);
  const avgAccuracy = accuracies.length ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;
  const masteryScore = avgAccuracy;
  const readinessScore = Math.min(100, masteryScore + (flashcards.length * 2));
  const studyHours = profile?.totalStudyHours ?? 0;

  const badges = [
    { id: 'first_quiz', name: 'First Steps', earned: attempts.length >= 1, icon: '🎯' },
    { id: 'ten_cards', name: 'Card Collector', earned: flashcards.length >= 10, icon: '🃏' },
    { id: 'quiz_master', name: 'Quiz Master', earned: attempts.length >= 5, icon: '🏆' },
    { id: 'scholar', name: 'Scholar', earned: studyHours >= 20, icon: '📚' },
  ];

  const weakTopics = Array.from(new Set(attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'))));

  res.status(200).json({
    readinessScore,
    attendancePct: 100,
    studyHours,
    masteryScore,
    badges,
    weakTopics,
  });
});

export const getTeacherInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Reserved for teacher role; route-level guard handles authorization.
  const students = await prisma.user.findMany({
    where: { role: 'student' },
    include: { quizAttempts: true, studentProfile: true },
  });
  const summary = {
    totalStudents: students.length,
    avgMastery: students.length
      ? Math.round(students.reduce((acc, s) => acc + (s.quizAttempts.length ? s.quizAttempts.reduce((x, a) => x + a.accuracy, 0) / s.quizAttempts.length : 0), 0) / students.length)
      : 0,
    weakTopics: Array.from(new Set(students.flatMap((s) => s.quizAttempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'))))),
  };
  const insights = await recService.generateTeacherInsights(summary);
  res.status(200).json({ summary, insights });
});
```

- [ ] **Step 8: Rewrite `server/src/routes/analytics.routes.ts`**

```ts
import { Router } from 'express';
import { getStudentAnalytics, getTeacherInsights } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();

// Student analytics: student role
router.get('/student/:studentId', authenticate, requireRole('student'), getStudentAnalytics);
// Teacher insights: teacher role
router.get('/teacher/insights', authenticate, requireRole('teacher'), getTeacherInsights);

export default router;
```

- [ ] **Step 9: Rewrite `server/src/controllers/ai.controller.ts`** (convert existing handlers to AuthRequest + asyncHandler; the RAG/grouping logic is unchanged)

```ts
import { Response } from 'express';
import prisma from '../prisma';
import { EmbeddingService } from '../services/embedding.service';
import { VectorService } from '../services/vector.service';
import { RetrievalService } from '../services/retrieval.service';
import { LlmService } from '../services/llm.service';
import { RagService } from '../services/rag.service';
import { AiChatService } from '../services/aiChat.service';
import { AiGroupingService } from '../services/aiGrouping.service';
import { AuthRequest } from '../middleware/authenticate';
import { resolveStudentId } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

const embeddingService = new EmbeddingService();
const vectorService = new VectorService(embeddingService);
const retrievalService = new RetrievalService(vectorService);
const llmService = new LlmService();
const ragService = new RagService(retrievalService, llmService);
const chatService = new AiChatService(ragService);
const groupingService = new AiGroupingService(llmService);

export const createSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { title = 'New Study Conversation' } = req.body;
  const session = await prisma.chatSession.create({ data: { studentId, title } });
  res.status(201).json({ session });
});

export const getSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const sessions = await prisma.chatSession.findMany({
    where: { studentId },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { messages: true } } },
  });
  res.status(200).json({ sessions });
});

export const getSessionMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sessionId = req.params.sessionId as string;
  throwIfMissing({ sessionId });
  // Ownership: ensure session belongs to caller
  const studentId = resolveStudentId(req);
  const session = await prisma.chatSession.findFirst({ where: { id: sessionId, studentId } });
  if (!session) throw new ApiError(404, 'Session not found or not owned by you');
  const messages = await prisma.chatMessage.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } });
  const formatted = messages.map((msg) => ({
    id: msg.id,
    question: msg.question,
    answer: msg.answer,
    sources: JSON.parse(msg.sourcesJson || '[]'),
    createdAt: msg.createdAt,
  }));
  res.status(200).json({ messages: formatted });
});

export const deleteSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sessionId = req.params.sessionId as string;
  throwIfMissing({ sessionId });
  const studentId = resolveStudentId(req);
  const session = await prisma.chatSession.findFirst({ where: { id: sessionId, studentId } });
  if (!session) throw new ApiError(404, 'Session not found or not owned by you');
  await prisma.chatSession.delete({ where: { id: sessionId } });
  res.status(200).json({ message: 'Chat session deleted successfully' });
});

export const chatTutor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { question, noteId, folderId, sessionId } = req.body;
  throwIfMissing({ question });

  let effectiveNoteId = noteId;
  let targetFolderNoteIds: string[] | undefined = undefined;

  if (folderId) {
    const folderNotes = await prisma.note.findMany({ where: { folderId, studentId }, select: { id: true } });
    targetFolderNoteIds = folderNotes.map((n) => n.id);
  }

  // Parse inline @Tag if present
  const tagMatch = question.match(/@([^\s@]+(?:\s+[^\s@]+)*)/);
  if (tagMatch && tagMatch[1] && !effectiveNoteId && !targetFolderNoteIds) {
    const tagQuery = tagMatch[1].trim();
    const matchedFolder = await prisma.noteFolder.findFirst({
      where: { studentId, name: { contains: tagQuery } },
      include: { notes: { select: { id: true } } },
    });
    if (matchedFolder && matchedFolder.notes.length > 0) {
      targetFolderNoteIds = matchedFolder.notes.map((n) => n.id);
    } else {
      const matchedNote = await prisma.note.findFirst({ where: { studentId, title: { contains: tagQuery } } });
      if (matchedNote) effectiveNoteId = matchedNote.id;
    }
  }

  let activeSessionId = sessionId;
  if (!activeSessionId) {
    const newSession = await prisma.chatSession.create({ data: { studentId, title: question.slice(0, 30) + '...' } });
    activeSessionId = newSession.id;
  } else {
    await prisma.chatSession.update({ where: { id: activeSessionId }, data: { updatedAt: new Date() } }).catch(() => {});
  }

  const chatResponse = await chatService.askTutor(studentId, question, effectiveNoteId, targetFolderNoteIds);
  const message = await prisma.chatMessage.create({
    data: {
      studentId,
      sessionId: activeSessionId,
      noteId: effectiveNoteId || null,
      question,
      answer: chatResponse.answer,
      sourcesJson: JSON.stringify(chatResponse.sources),
    },
  });
  res.status(200).json({ id: message.id, sessionId: activeSessionId, answer: chatResponse.answer, sources: chatResponse.sources, createdAt: message.createdAt });
});

export const autoGroupItems = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { type } = req.body;
  throwIfMissing({ type });
  if (type !== 'notes' && type !== 'flashcards') throw new ApiError(400, 'Invalid type. Use "notes" or "flashcards"');

  if (type === 'notes') {
    const uncategorizedNotes = await prisma.note.findMany({ where: { studentId, folderId: null }, select: { id: true, title: true } });
    const folders = await prisma.noteFolder.findMany({ where: { studentId }, select: { id: true, name: true } });
    const itemsToGroup = uncategorizedNotes.map((n) => ({ id: n.id, title: n.title, contentSnippet: n.title }));
    const mapping = await groupingService.autoGroupItems(itemsToGroup, folders);
    for (const match of mapping) {
      if (match.folderId) {
        await prisma.note.update({ where: { id: match.itemId }, data: { folderId: match.folderId } });
      }
    }
    res.status(200).json({ message: 'Notes auto-grouped successfully', mapping });
  } else {
    const uncategorizedCards = await prisma.flashcard.findMany({ where: { studentId, folderId: null }, select: { id: true, topic: true, question: true } });
    const folders = await prisma.flashcardFolder.findMany({ where: { studentId }, select: { id: true, name: true } });
    const itemsToGroup = uncategorizedCards.map((c) => ({ id: c.id, title: c.topic || 'General Flashcard', contentSnippet: c.question || '' }));
    const mapping = await groupingService.autoGroupItems(itemsToGroup, folders);
    for (const match of mapping) {
      if (match.folderId) {
        await prisma.flashcard.update({ where: { id: match.itemId }, data: { folderId: match.folderId } });
      }
    }
    res.status(200).json({ message: 'Flashcards auto-grouped successfully', mapping });
  }
});
```

- [ ] **Step 10: Rewrite `server/src/routes/ai.routes.ts`**

```ts
import { Router } from 'express';
import { createSession, getSessions, getSessionMessages, deleteSession, chatTutor, autoGroupItems } from '../controllers/ai.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();
router.use(authenticate, requireRole('student'));

router.post('/chat', chatTutor);
router.post('/auto-group', autoGroupItems);
router.post('/sessions', createSession);
router.get('/sessions/:studentId', getSessions);
router.get('/sessions/messages/:sessionId', getSessionMessages);
router.delete('/sessions/:sessionId', deleteSession);

export default router;
```

- [ ] **Step 11: Run all tests**

Run: `cd server && npm test`
Expected: all previously passing tests still pass. The `auth` and `folders` suites still pass (they exercise the new patterns).

- [ ] **Step 12: Commit**

```bash
cd server
git add src/controllers/note.controller.ts src/controllers/flashcard.controller.ts src/controllers/quiz.controller.ts src/controllers/analytics.controller.ts src/controllers/ai.controller.ts src/routes/note.routes.ts src/routes/flashcard.routes.ts src/routes/quiz.routes.ts src/routes/analytics.routes.ts src/routes/ai.routes.ts
git commit -m "refactor: convert all student controllers to AuthRequest with ownership guards; add deleteNote/updateFlashcard; remove dead KnowledgeGapService"
```

---

## Task 8: Finalize teacher endpoints (role guard, quizId push, hardcoded student_1 fix)

**Files:**
- Modify: `server/src/controllers/teacher.controller.ts`
- Modify: `server/src/routes/teacher.routes.ts`

- [ ] **Step 1: Rewrite `server/src/controllers/teacher.controller.ts`**

```ts
import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authenticate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

export const getClassroomHeatmap = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;

  // Students belonging to this teacher: we treat all students as belonging to the platform teacher
  // (single-classroom model). A future task may add teacher->student enrollment.
  const students = await prisma.user.findMany({
    where: { role: 'student' },
    include: { quizAttempts: true, attendance: true, studentProfile: true },
  });

  const topicAccuracyMap: Record<string, { correctSum: number; totalSum: number }> = {};
  const studentRoster = [];

  for (const student of students) {
    const attempts = student.quizAttempts;
    const accuracies = attempts.map((a) => a.accuracy);
    const avgAccuracy = accuracies.length > 0 ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;
    const presentCount = student.attendance.filter((r) => r.status === 'present').length;
    const attendancePct = student.attendance.length > 0 ? Math.round((presentCount / student.attendance.length) * 100) : 100;
    const weakTopics = Array.from(new Set(attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'))));

    studentRoster.push({
      id: student.id,
      name: student.name,
      email: student.email,
      masteryScore: avgAccuracy,
      quizzesTaken: attempts.length,
      attendancePct,
      status: avgAccuracy >= 80 ? 'Excelling' : avgAccuracy >= 60 ? 'On Track' : 'Needs Support',
      weakTopics,
    });

    attempts.forEach((attempt) => {
      const weakList: string[] = JSON.parse(attempt.weakTopicsJson || '[]');
      weakList.forEach((topic) => {
        if (!topicAccuracyMap[topic]) topicAccuracyMap[topic] = { correctSum: 0, totalSum: 0 };
        topicAccuracyMap[topic].totalSum += 10;
        topicAccuracyMap[topic].correctSum += Math.round((attempt.accuracy / 100) * 10);
      });
    });
  }

  const heatmap = Object.entries(topicAccuracyMap).map(([topic, stat]) => {
    const avgAcc = stat.totalSum > 0 ? Math.round((stat.correctSum / stat.totalSum) * 100) : 50;
    return { topic, averageAccuracy: avgAcc, severity: avgAcc < 50 ? 'high' : avgAcc < 70 ? 'medium' : 'low' };
  });

  res.status(200).json({
    summary: {
      totalStudents: students.length,
      averageClassMastery: Math.round(studentRoster.reduce((acc, s) => acc + s.masteryScore, 0) / (students.length || 1)),
      averageAttendance: Math.round(studentRoster.reduce((acc, s) => acc + s.attendancePct, 0) / (students.length || 1)),
      teacherId,
    },
    heatmap,
    studentRoster,
  });
});

export const pushMaterialToStudent = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'teacher') throw new ApiError(403, 'Forbidden: teacher role required');
  const teacherId = req.user.id;
  const { studentId, title, noteId, quizId, dueDate } = req.body;
  throwIfMissing({ studentId, title });
  if (!noteId && !quizId) throw new ApiError(400, 'Either noteId or quizId is required');

  // Verify the student exists
  const student = await prisma.user.findFirst({ where: { id: studentId, role: 'student' } });
  if (!student) throw new ApiError(404, 'Target student not found');

  const assignment = await prisma.teacherPushAssignment.create({
    data: {
      teacherId,
      studentId,
      title,
      noteId: noteId || null,
      quizId: quizId || null,
      dueDate: dueDate || 'End of Week',
      status: 'pending',
    },
    include: { note: true, quiz: true },
  });

  res.status(201).json({ message: 'Assignment pushed directly to student agenda!', assignment });
});
```

- [ ] **Step 2: Rewrite `server/src/routes/teacher.routes.ts`**

```ts
import { Router } from 'express';
import { getClassroomHeatmap, pushMaterialToStudent } from '../controllers/teacher.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();

router.use(authenticate, requireRole('teacher'));

router.get('/heatmap', getClassroomHeatmap);
router.post('/push-assignment', pushMaterialToStudent);

export default router;
```

- [ ] **Step 3: Add a teacher test**

Create `server/src/__tests__/teacher.test.ts`:
```ts
import request from 'supertest';
import app from '../app';
import prisma from '../prisma';

let teacherToken: string;
let studentId: string;

beforeAll(async () => {
  const t = await request(app).post('/api/auth/register').send({
    name: 'Teach', email: 'teach@test.io', password: 'pw1234', role: 'teacher',
  });
  teacherToken = t.body.token;

  const s = await request(app).post('/api/auth/register').send({
    name: 'Pupil', email: 'pupil@test.io', password: 'pw1234', role: 'student',
  });
  studentId = s.body.user.id;
});

describe('teacher endpoints', () => {
  it('blocks students from teacher routes', async () => {
    const s = await request(app).post('/api/auth/register').send({
      name: 'S2', email: 's2@test.io', password: 'pw1234', role: 'student',
    });
    const r = await request(app).get('/api/teacher/heatmap').set('Authorization', `Bearer ${s.body.token}`);
    expect(r.status).toBe(403);
  });
  it('returns heatmap for teacher', async () => {
    const r = await request(app).get('/api/teacher/heatmap').set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(200);
    expect(r.body.summary).toBeDefined();
  });
  it('requires noteId or quizId on push', async () => {
    const r = await request(app).post('/api/teacher/push-assignment').set('Authorization', `Bearer ${teacherToken}`).send({
      studentId, title: 'Read this',
    });
    expect(r.status).toBe(400);
  });
});

afterAll(async () => { await prisma.$disconnect(); });
```

- [ ] **Step 4: Run tests**

Run: `cd server && npm test -- teacher`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
cd server
git add src/controllers/teacher.controller.ts src/routes/teacher.routes.ts src/__tests__/teacher.test.ts
git commit -m "feat(teacher): enforce teacher role, derive teacherId from JWT, require noteId/quizId on push"
```

---

## Task 9: Extract schedule prompt; convert schedule controller to AuthRequest

**Files:**
- Create: `server/src/prompts/schedule.prompt.ts`
- Modify: `server/src/controllers/schedule.controller.ts`
- Modify: `server/src/routes/schedule.routes.ts`

- [ ] **Step 1: Create `server/src/prompts/schedule.prompt.ts`**

```ts
export interface SchedulePromptInput {
  examDate: string;
  subjects: string[];
  dailyHours: number;
  noteTitles: string[];
  weakTopics: string[];
}

export const buildSchedulePrompt = (input: SchedulePromptInput): string => {
  const { examDate, subjects, dailyHours, noteTitles, weakTopics } = input;
  return `You are EduBridge AI Schedule Planner.
Generate an optimized, daily study timetable leading up to an upcoming exam.

Student Details:
- Exam Date: ${examDate}
- Subjects: ${subjects.join(', ')}
- Daily Available Study Hours: ${dailyHours} hours
- Available Uploaded Notes: ${noteTitles.join(', ') || 'General Notes'}
- Identified Weak Topics Needing Revision: ${weakTopics.join(', ') || 'Fundamentals'}

INSTRUCTIONS:
Return a JSON array of daily study blocks for the next 7 days. Each block must have:
- day: e.g. "Day 1", "Day 2"
- date: e.g. "Tomorrow"
- title: clear study block title
- focusTopic: specific concept/topic
- linkedNoteTitle: title of note to read (if available)
- actionType: "read_note" | "take_quiz" | "review_flashcards"
- durationMinutes: estimated duration in minutes

Output ONLY valid JSON array with no markdown formatting.`;
};
```

- [ ] **Step 2: Rewrite `server/src/controllers/schedule.controller.ts`**

```ts
import { Response } from 'express';
import prisma from '../prisma';
import { LlmService } from '../services/llm.service';
import { buildSchedulePrompt } from '../prompts/schedule.prompt';
import { AuthRequest } from '../middleware/authenticate';
import { resolveStudentId } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

const llmService = new LlmService();

export const generateSchedule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { examDate, subjects = ['Computer Science'], dailyHours = 2 } = req.body;
  throwIfMissing({ examDate });

  const notes = await prisma.note.findMany({ where: { studentId } });
  const attempts = await prisma.quizAttempt.findMany({ where: { studentId } });
  const weakTopics = Array.from(new Set(attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'))));

  const prompt = buildSchedulePrompt({
    examDate,
    subjects,
    dailyHours: Number(dailyHours),
    noteTitles: notes.map((n) => n.title),
    weakTopics,
  });

  const rawOutput = await llmService.generate(prompt);
  const cleaned = rawOutput.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  let scheduleBlocks: any[];
  try {
    scheduleBlocks = JSON.parse(cleaned);
  } catch {
    scheduleBlocks = [
      { day: 'Day 1', date: 'Today', title: 'Review Core Concepts & Weak Topics', focusTopic: weakTopics[0] || 'Fundamentals', actionType: 'read_note', durationMinutes: 45 },
      { day: 'Day 1', date: 'Today', title: 'Practice Quiz & Knowledge Check', focusTopic: 'Assessment', actionType: 'take_quiz', durationMinutes: 20 },
    ];
  }

  const schedule = await prisma.studySchedule.create({
    data: { studentId, examDate, subject: subjects.join(', '), dailyHours: Number(dailyHours), scheduleJson: JSON.stringify(scheduleBlocks) },
  });

  res.status(201).json({ id: schedule.id, examDate: schedule.examDate, subject: schedule.subject, dailyHours: schedule.dailyHours, blocks: scheduleBlocks });
});

export const getTodayAgenda = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const latestSchedule = await prisma.studySchedule.findFirst({ where: { studentId }, orderBy: { createdAt: 'desc' } });
  const pushAssignments = await prisma.teacherPushAssignment.findMany({
    where: { studentId, status: 'pending' },
    include: { note: true, quiz: true },
  });

  let blocks: any[] = [];
  if (latestSchedule) {
    blocks = (JSON.parse(latestSchedule.scheduleJson || '[]')).slice(0, 2);
  } else {
    blocks = [
      { day: 'Today', date: 'Today', title: 'RAG Study Session', focusTopic: 'Review Uploaded Notes', actionType: 'read_note', durationMinutes: 30 },
      { day: 'Today', date: 'Today', title: 'Active Recall Check', focusTopic: 'Weak Topic Quiz', actionType: 'take_quiz', durationMinutes: 15 },
    ];
  }

  const teacherTasks = pushAssignments.map((p) => ({
    id: p.id,
    title: `Teacher Assignment: ${p.title}`,
    focusTopic: p.note?.title || p.quiz?.title || 'Assignment',
    actionType: p.noteId ? 'read_note' : 'take_quiz',
    noteId: p.noteId,
    quizId: p.quizId,
    isTeacherPush: true,
  }));

  res.status(200).json({ agenda: [...teacherTasks, ...blocks] });
});

export const getStudentSchedules = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const schedules = await prisma.studySchedule.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } });
  const formatted = schedules.map((s) => ({
    id: s.id,
    examDate: s.examDate,
    subject: s.subject,
    dailyHours: s.dailyHours,
    blocks: JSON.parse(s.scheduleJson || '[]'),
    createdAt: s.createdAt,
  }));
  res.status(200).json({ schedules: formatted });
});
```

- [ ] **Step 3: Rewrite `server/src/routes/schedule.routes.ts`**

```ts
import { Router } from 'express';
import { generateSchedule, getTodayAgenda, getStudentSchedules } from '../controllers/schedule.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();
router.use(authenticate, requireRole('student'));

router.post('/generate', generateSchedule);
router.get('/today/:studentId', getTodayAgenda);
router.get('/student/:studentId', getStudentSchedules);

export default router;
```

- [ ] **Step 4: Run all tests**

Run: `cd server && npm test`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
cd server
git add src/prompts/schedule.prompt.ts src/controllers/schedule.controller.ts src/routes/schedule.routes.ts
git commit -m "refactor(schedule): extract prompt to prompts/schedule.prompt.ts and convert to AuthRequest"
```

---

## Task 10: Clean up seed script + add db scripts

**Files:**
- Modify: `server/prisma/seed.ts`
- Modify: `server/package.json`

- [ ] **Step 1: Rewrite `server/prisma/seed.ts`** to be DB-only (no FAISS side-effect; the FAISS indexing belongs in the upload flow, not the seed), idempotent (deletes before create), and use the new auth-aware data shapes.

```ts
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/hash';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding EduBridge demo data...');

  // 1. Demo student
  const studentPassword = await hashPassword('demo1234');
  const student = await prisma.user.upsert({
    where: { email: 'student@edubridge.edu' },
    update: {},
    create: {
      id: 'student_1',
      name: 'Yash Sharma',
      email: 'student@edubridge.edu',
      password: studentPassword,
      role: 'student',
      studentProfile: { create: { institution: 'Tech Institute of Engineering', course: 'Computer Science & Data Analytics', semester: 6, totalStudyHours: 42 } },
    },
  });

  // 2. Demo teacher
  const teacherPassword = await hashPassword('demo1234');
  await prisma.user.upsert({
    where: { email: 'teacher@edubridge.edu' },
    update: {},
    create: {
      id: 'teacher_1',
      name: 'Prof. Verma',
      email: 'teacher@edubridge.edu',
      password: teacherPassword,
      role: 'teacher',
      teacherProfile: { create: { organization: 'Tech Institute', department: 'Computer Science', specialization: 'Algorithms', experience: 12 } },
    },
  });

  // 3. Note folders
  const folderDataPrep = await prisma.noteFolder.upsert({
    where: { id: 'folder_dataprep' },
    update: {},
    create: { id: 'folder_dataprep', name: 'Data Preprocessing & Analytics', color: '#6366f1', studentId: student.id },
  });
  const folderAlgo = await prisma.noteFolder.upsert({
    where: { id: 'folder_algo' },
    update: {},
    create: { id: 'folder_algo', name: 'Design & Analysis of Algorithms', color: '#ec4899', studentId: student.id },
  });
  const folderDB = await prisma.noteFolder.upsert({
    where: { id: 'folder_db' },
    update: {},
    create: { id: 'folder_db', name: 'Database Systems & Indexing', color: '#10b981', studentId: student.id },
  });

  // 4. Notes (filePath points to placeholder files; actual indexing happens via upload API)
  await prisma.note.upsert({
    where: { id: 'note_binning' },
    update: {},
    create: { id: 'note_binning', title: 'Equal-Width & Equal-Frequency Binning', filePath: 'uploads/binning_and_classing_notes.txt', fileType: '.txt', folderId: folderDataPrep.id, studentId: student.id },
  });
  await prisma.note.upsert({
    where: { id: 'note_outlier' },
    update: {},
    create: { id: 'note_outlier', title: 'Outlier Detection & IQR Method', filePath: 'uploads/outlier_detection_notes.txt', fileType: '.txt', folderId: folderDataPrep.id, studentId: student.id },
  });
  await prisma.note.upsert({
    where: { id: 'note_master' },
    update: {},
    create: { id: 'note_master', title: 'Asymptotic Complexity & Recurrence Relations', filePath: 'uploads/master_theorem_notes.txt', fileType: '.txt', folderId: folderAlgo.id, studentId: student.id },
  });
  await prisma.note.upsert({
    where: { id: 'note_bplus' },
    update: {},
    create: { id: 'note_bplus', title: 'B+ Tree Indexing & Storage Engines', filePath: 'uploads/bplus_tree_notes.txt', fileType: '.txt', folderId: folderDB.id, studentId: student.id },
  });

  // 5. Flashcard decks
  const deck1 = await prisma.flashcardFolder.upsert({
    where: { id: 'deck_dataprep' },
    update: {},
    create: { id: 'deck_dataprep', name: 'Data Preprocessing & Binning Deck', topic: 'Binning', studentId: student.id, noteId: 'note_binning' },
  });
  const deck2 = await prisma.flashcardFolder.upsert({
    where: { id: 'deck_algo' },
    update: {},
    create: { id: 'deck_algo', name: 'Algorithms & Complexity Deck', topic: 'Complexity', studentId: student.id, noteId: 'note_master' },
  });
  const deck3 = await prisma.flashcardFolder.upsert({
    where: { id: 'deck_db' },
    update: {},
    create: { id: 'deck_db', name: 'B+ Tree & Indexing Deck', topic: 'Indexing', studentId: student.id, noteId: 'note_bplus' },
  });

  // 6. Flashcards
  await prisma.flashcard.createMany({
    skipDuplicates: true,
    data: [
      { question: 'What is equal-width binning?', answer: 'Dividing the value range into k intervals of equal width.', topic: 'Binning', type: 'definition', folderId: deck1.id, noteId: 'note_binning', studentId: student.id },
      { question: 'Define equal-frequency binning.', answer: 'Each bin contains the same number of data points (quantiles).', topic: 'Binning', type: 'concept', folderId: deck1.id, noteId: 'note_binning', studentId: student.id },
      { question: 'Formula for IQR.', answer: 'IQR = Q3 - Q1', topic: 'Outliers', type: 'formula', folderId: deck1.id, noteId: 'note_outlier', studentId: student.id },
      { question: 'What is the Master Theorem?', answer: 'A method for solving recurrences of the form T(n)=aT(n/b)+f(n).', topic: 'Complexity', type: 'definition', folderId: deck2.id, noteId: 'note_master', studentId: student.id },
      { question: 'B+ tree vs B-tree?', answer: 'B+ tree stores data only in leaves; internal nodes are index-only.', topic: 'Indexing', type: 'comparison', folderId: deck3.id, noteId: 'note_bplus', studentId: student.id },
      { question: 'Define asymptotic notation.', answer: 'Describes behavior of functions as input size approaches infinity.', topic: 'Complexity', type: 'definition', folderId: deck2.id, noteId: 'note_master', studentId: student.id },
      { question: 'Why use a B+ tree for DB indexes?', answer: 'High fanout, low height, fast range queries via linked leaves.', topic: 'Indexing', type: 'concept', folderId: deck3.id, noteId: 'note_bplus', studentId: student.id },
    ],
  });

  console.log('✅ Seed complete. Login: student@edubridge.edu / demo1234 (student), teacher@edubridge.edu / demo1234 (teacher)');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
```

- [ ] **Step 2: Add npm scripts + prisma.seed config to `server/package.json`**

Add to `"scripts"`:
```json
"build": "tsc",
"db:seed": "ts-node prisma/seed.ts",
"db:reset": "npx prisma db push --force-reset && npm run db:seed"
```

Add a top-level `"prisma"` block (sibling to `"scripts"`):
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

- [ ] **Step 3: Verify the seed runs**

Run: `cd server && npm run db:seed`
Expected: console prints "✅ Seed complete..." with login credentials. Verify `dev.db` now contains the demo users/folders/notes/cards.

- [ ] **Step 4: Run all tests (seed should not interfere with the test DB because the test setup uses `test.db`)**

Run: `cd server && npm test`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
cd server
git add prisma/seed.ts package.json
git commit -m "feat(seed): idempotent DB-only seed, add teacher demo user, wire prisma.seed + db scripts"
```

---

## Task 11: Add Prisma schema indexes + verify `@langchain/textsplitters` dependency

**Files:**
- Modify: `server/prisma/schema.prisma`
- Modify: `server/package.json`

- [ ] **Step 1: Add indexes to `server/prisma/schema.prisma`**

These are additive `@@index` declarations. Add them inside the relevant models:

For `Note`:
```prisma
  @@index([studentId])
  @@index([folderId])
```

For `Flashcard`:
```prisma
  @@index([studentId])
  @@index([folderId])
```

For `Quiz`:
```prisma
  @@index([studentId])
```

For `ChatMessage`:
```prisma
  @@index([studentId])
  @@index([sessionId])
```

For `QuizAttempt`:
```prisma
  @@index([studentId])
```

For `StudySchedule`:
```prisma
  @@index([studentId])
```

For `TeacherPushAssignment`:
```prisma
  @@index([studentId])
  @@index([teacherId])
```

- [ ] **Step 2: Add `@langchain/textsplitters` as an explicit dependency**

Run: `cd server && npm install @langchain/textsplitters`
Expected: package added to `dependencies`.

- [ ] **Step 3: Push the schema**

Run: `cd server && npx prisma db push`
Expected: Prisma applies the new indexes. Output includes "Your database is now in sync with your Prisma schema."

- [ ] **Step 4: Verify build still compiles**

Run: `cd server && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd server
git add prisma/schema.prisma package.json package-lock.json
git commit -m "perf(db): add studentId/folderId indexes; pin @langchain/textsplitters"
```

---

## Task 12: Remove dead code (`scoreCalculator.ts`, unused `OAuth2Client` already removed in Task 5)

**Files:**
- Delete: `server/src/utils/scoreCalculator.ts`

- [ ] **Step 1: Confirm `scoreCalculator.ts` is unreferenced**

Run: `cd server && grep -rn "scoreCalculator\|calculateMasteryScore" src/ --include='*.ts' | grep -v scoreCalculator.ts`
Expected: no output (no references). If there ARE references, STOP and report them — do not delete.

- [ ] **Step 2: Delete the file**

Run: `cd server && rm src/utils/scoreCalculator.ts`
Expected: file removed.

- [ ] **Step 3: Verify nothing breaks**

Run: `cd server && npx tsc --noEmit && npm test`
Expected: compile clean, all tests pass.

- [ ] **Step 4: Commit**

```bash
cd server
git add -A
git commit -m "chore: remove unused scoreCalculator utility"
```

---

## Task 13: Add `.env.example` + `.gitignore` (env hygiene)

**Files:**
- Create: `server/.env.example`
- Create: `server/.gitignore`

- [ ] **Step 1: Create `server/.env.example`**

```env
# Server
PORT=5001
NODE_ENV=development

# Database (SQLite file path)
DATABASE_URL="file:./dev.db"

# Auth
JWT_SECRET="change_me_to_a_long_random_string"
OAUTH_ID="your_google_oauth_client_id"

# AI Providers
GEMINI_API_KEY="your_gemini_api_key"

# Groq key pool (add up to 6; leave blank to use Gemini-only)
GROQ_API_KEY_1=""
GROQ_API_KEY_2=""
GROQ_API_KEY_3=""
GROQ_API_KEY_4=""
GROQ_API_KEY_5=""
GROQ_API_KEY_6=""
```

- [ ] **Step 2: Create `server/.gitignore`**

```gitignore
# Secrets — NEVER commit
.env
.env.local
.env.*.local

# Build output
dist/

# Database
prisma/dev.db
prisma/test.db
prisma/*.db-journal

# Vector store & uploads (runtime artifacts)
vector_db/
uploads/

# Node
node_modules/
*.log
```

- [ ] **Step 3: Verify `.env` is now ignored (it is already tracked, so we need to untrack it without deleting it locally)**

Run: `cd server && git rm --cached .env`
Expected: `rm '.env'` output — the file is removed from the index but kept on disk.

- [ ] **Step 4: Verify the working tree still has `.env` locally**

Run: `cd server && ls -la .env`
Expected: the file exists.

- [ ] **Step 5: Run all tests one final time to ensure the test harness still finds env via setup.ts**

Run: `cd server && npm test`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
cd server
git add .gitignore .env.example .env
git commit -m "chore: gitignore .env, add .env.example template, untrack committed secrets"
```

---

## Task 14: Rotate committed secrets (OPERATOR ACTION — not code)

> ⚠️ **This task is for the human operator, not the implementing engineer.** It cannot be automated because it requires login to Groq and Google Cloud consoles. It is documented here so it is not forgotten.

- [ ] **Step 1: Revoke the 6 Groq API keys currently in the committed `.env`**

Log into https://console.groq.com/keys. Delete all 6 keys (they are now in git history). Create new keys and place them in the NEW `.env` (untracked).

- [ ] **Step 2: Revoke the committed Gemini API key**

Log into https://aistudio.google.com/apikey. Delete the key starting with `AQ.Ab8R...`. Create a new key and place it in the untracked `.env`.

- [ ] **Step 3: Scrub git history (optional but recommended)**

Since the keys are in prior commits, `git rm --cached .env` only stops future tracking. To purge them from history:

```bash
cd "E:/Chaos/Hackathons/Prometheus"
git filter-repo --path server/.env --invert-paths
```
(Requires `git-filter-repo`. Force-push to the `yash` branch after: `git push origin yash --force`.)

> ⚠️ Force-push rewrites history. Coordinate with collaborators first.

- [ ] **Step 4: No commit (this is an operator action). Document completion in the PR description.**

---

## Task 15: Final verification — full build + full test suite + manual smoke

- [ ] **Step 1: Clean install**

Run:
```bash
cd server && rm -rf node_modules && npm install
```
Expected: clean install succeeds; `@langchain/textsplitters` resolves.

- [ ] **Step 2: Compile**

Run: `cd server && npm run build`
Expected: `dist/` populated, no TS errors.

- [ ] **Step 3: Reset DB and seed**

Run: `cd server && npm run db:reset`
Expected: schema applied, seed runs, "✅ Seed complete" printed.

- [ ] **Step 4: Full test suite**

Run: `cd server && npm test`
Expected: all test suites pass (smoke, apiError, authorize, auth, folders, teacher).

- [ ] **Step 5: Manual smoke (start server, hit health + auth + folders)**

Terminal A:
```bash
cd server && npm run dev
```
Terminal B:
```bash
# Health
curl http://localhost:5001/api/health
# Register (or use seeded student)
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@edubridge.edu","password":"demo1234"}'
# Use the returned token:
TOKEN=<paste>
curl http://localhost:5001/api/folders/notes/student/me \
  -H "Authorization: Bearer $TOKEN"
```
Expected: health returns `{"status":"ok","db":"connected"...}`; login returns a token; folders list returns the 3 seeded folders.

- [ ] **Step 6: Commit any final fixes if the smoke exposed issues**

If the smoke test revealed any bug, fix it as a small commit:
```bash
cd server
git add -A
git commit -m "fix: address smoke-test finding"
```

- [ ] **Step 7: Final commit (if not already committed in Step 6)**

If everything passed with no fixes needed, no commit is required — the work is already committed task-by-task. Surface the final status to the user.

---

## Self-Review

**1. Spec coverage** — checking each roadmap item from the handover doc:
- ✅ "Expand TeacherDashboard (heatmap, push, analytics on weak topics)" → Task 8 enforces teacher role, derives teacherId from JWT, requires noteId/quizId; heatmap already exists and is preserved.
- ✅ "Backend routes for editing/deleting note folders and flashcard decks" → Task 6 adds `updateNoteFolder`, `deleteNoteFolder`, `updateFlashcardFolder`, `deleteFlashcardFolder`.
- ✅ "Ensure clean database seeds for demo day" → Task 10 makes the seed idempotent and DB-only, adds a demo teacher.
- ✅ "Student Dashboard Integration (highlight teacher-assigned tasks)" → already implemented in `getTodayAgenda`; Task 9 preserves it and converts to AuthRequest.
- ✅ Security gap (not in handover but surfaced during ingestion) → Tasks 3, 6, 7, 8 add JWT + role + ownership guards across every endpoint.
- ✅ Dead code cleanup → Task 12 removes `scoreCalculator.ts`; Task 5 removes unused `OAuth2Client`; Task 7 removes dead `KnowledgeGapService`.

**2. Placeholder scan** — searched the plan for "TBD", "TODO", "implement later", "Add appropriate error handling", "Similar to Task N". Found none. Every code step shows the actual code. No steps reference undefined types or functions.

**3. Type consistency** — checked method/property names across tasks:
- `resolveStudentId(req, opts?)` — defined in Task 3, used in Tasks 6, 7, 9 with consistent signature.
- `requireRole(...roles)` — defined in Task 3, used in Tasks 6, 7, 8, 9 with `requireRole('student')` / `requireRole('teacher')`.
- `asyncHandler(fn)` — defined in Task 2, used in all controller rewrites.
- `ApiError(statusCode, message)` and `throwIfMissing(fields, message?)` — defined in Task 2, used consistently.
- Route param names: `:folderId` used consistently for folder PATCH/DELETE (Task 6); `:noteId` for note DELETE (Task 7); `:id` for flashcard PATCH/DELETE (Task 7); `:sessionId` for chat (Task 7). No collisions.
- The `AuthRequest` interface is imported from `middleware/authenticate` everywhere (not redefined).

No issues found. The plan is internally consistent.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-24-backend-finalization.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for catching issues early since each task is verified before the next starts.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints for review. Best if you want to watch each step happen in real time.

Which approach?
