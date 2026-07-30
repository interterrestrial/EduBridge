import request from 'supertest';
import app from '../app';
import prisma from '../prisma';

let teacherToken: string;
let studentA1: string;
let studentA2: string;
let studentB1: string;

beforeAll(async () => {
  const t = await request(app).post('/api/auth/register').send({
    name: 'ScopeTeacher', email: 'scope-teacher@test.io', password: 'pw1234', role: 'teacher',
  });
  teacherToken = t.body.token;

  // Create three students in different sections of the same class
  for (const [key, email] of [
    ['A1', 'scope-a1@test.io'],
    ['A2', 'scope-a2@test.io'],
    ['B1', 'scope-b1@test.io'],
  ] as const) {
    const s = await request(app).post('/api/auth/register').send({
      name: `Student ${key}`, email, password: 'pw1234', role: 'student',
    });
    if (key === 'A1') studentA1 = s.body.user.id;
    if (key === 'A2') studentA2 = s.body.user.id;
    if (key === 'B1') studentB1 = s.body.user.id;
  }

  // Enroll A1 and A2 into "6th • A", B1 into "6th • B"
  await request(app).post('/api/teacher/students').set('Authorization', `Bearer ${teacherToken}`).send({ studentId: studentA1, className: '6th', section: 'A' });
  await request(app).post('/api/teacher/students').set('Authorization', `Bearer ${teacherToken}`).send({ studentId: studentA2, className: '6th', section: 'A' });
  await request(app).post('/api/teacher/students').set('Authorization', `Bearer ${teacherToken}`).send({ studentId: studentB1, className: '6th', section: 'B' });
});

describe('class + section scoping', () => {
  it('returns only section-A students when scoped to 6th • A', async () => {
    const r = await request(app).get('/api/teacher/heatmap').query({ className: '6th', section: 'A' }).set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(200);
    expect(r.body.scope).toEqual({ className: '6th', section: 'A' });
    const ids = r.body.studentRoster.map((s: any) => s.id);
    expect(ids).toContain(studentA1);
    expect(ids).toContain(studentA2);
    expect(ids).not.toContain(studentB1);
    expect(ids.length).toBe(2);
  });

  it('returns only section-B students when scoped to 6th • B', async () => {
    const r = await request(app).get('/api/teacher/heatmap').query({ className: '6th', section: 'B' }).set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(200);
    const ids = r.body.studentRoster.map((s: any) => s.id);
    expect(ids).toContain(studentB1);
    expect(ids).not.toContain(studentA1);
    expect(ids).not.toContain(studentA2);
  });

  it('defaults to the first alphabetical scope when no scope supplied', async () => {
    const r = await request(app).get('/api/teacher/heatmap').set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(200);
    expect(r.body.scope).toEqual({ className: '6th', section: 'A' });
  });

  it('rejects invalid scope with 400', async () => {
    const r = await request(app).get('/api/teacher/heatmap').query({ className: '99th', section: 'Z' }).set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(400);
  });

  it('enforces enrollment scope on getStudentDetail (404 for other section)', async () => {
    // B1 student, but request scoped to 6th • A → 404
    const r = await request(app).get(`/api/teacher/student/${studentB1}`).query({ className: '6th', section: 'A' }).set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(404);
  });

  it('returns student detail when scope matches enrollment', async () => {
    const r = await request(app).get(`/api/teacher/student/${studentA1}`).query({ className: '6th', section: 'A' }).set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(200);
    expect(r.body.student.className).toBe('6th');
    expect(r.body.student.section).toBe('A');
  });

  it('rejects enrollment without className/section with 400', async () => {
    const s = await request(app).post('/api/auth/register').send({
      name: 'NoScope', email: 'noscope@test.io', password: 'pw1234', role: 'student',
    });
    const r = await request(app).post('/api/teacher/students').set('Authorization', `Bearer ${teacherToken}`).send({ studentId: s.body.user.id });
    expect(r.status).toBe(400);
  });

  it('normalizes section to uppercase', async () => {
    const s = await request(app).post('/api/auth/register').send({
      name: 'CaseTest', email: 'case-test@test.io', password: 'pw1234', role: 'student',
    });
    const r = await request(app).post('/api/teacher/students').set('Authorization', `Bearer ${teacherToken}`).send({
      studentId: s.body.user.id,
      className: '7th',
      section: 'b', // lowercase — should be normalized to "B"
    });
    expect(r.status).toBe(201);
    expect(r.body.mapping.section).toBe('B');
  });

  it('creates an exam scoped to a (className, section)', async () => {
    const r = await request(app).post('/api/teacher/exams').set('Authorization', `Bearer ${teacherToken}`).send({
      title: '6A Midterm',
      subject: 'Math',
      maxMarks: 100,
      examDate: '2026-09-01',
      className: '6th',
      section: 'A',
    });
    expect(r.status).toBe(201);
    expect(r.body.exam.className).toBe('6th');
    expect(r.body.exam.section).toBe('A');
  });

  it('rejects exam creation with invalid scope (no enrollment)', async () => {
    const r = await request(app).post('/api/teacher/exams').set('Authorization', `Bearer ${teacherToken}`).send({
      title: 'Bad',
      subject: 'Math',
      maxMarks: 100,
      examDate: '2026-09-01',
      className: '99th',
      section: 'X',
    });
    expect(r.status).toBe(400);
  });

  it('accepts exam creation with allClasses: true (global exam)', async () => {
    const r = await request(app).post('/api/teacher/exams').set('Authorization', `Bearer ${teacherToken}`).send({
      title: 'School-wide Test',
      subject: 'Math',
      maxMarks: 100,
      examDate: '2026-09-02',
      allClasses: true,
    });
    expect(r.status).toBe(201);
    expect(r.body.exam.className).toBeNull();
    expect(r.body.exam.section).toBeNull();
  });

  it('lists exams scoped to (className, section) when query supplied', async () => {
    const r = await request(app).get('/api/teacher/exams').query({ className: '6th', section: 'A' }).set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(200);
    // Should include 6A-scoped exam + global "School-wide Test" (both visible in 6A scope)
    const titles = r.body.exams.map((e: any) => e.title);
    expect(titles).toContain('6A Midterm');
    expect(titles).toContain('School-wide Test');
  });

  it('removes enrollment by (className, section)', async () => {
    // Remove A2 from 6th • A — A1 and B1 should remain
    const r = await request(app).delete(`/api/teacher/students/${studentA2}`).query({ className: '6th', section: 'A' }).set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(200);
    expect(r.body.message).toMatch(/6th.*A/);

    const heatmap = await request(app).get('/api/teacher/heatmap').query({ className: '6th', section: 'A' }).set('Authorization', `Bearer ${teacherToken}`);
    const ids = heatmap.body.studentRoster.map((s: any) => s.id);
    expect(ids).toContain(studentA1);
    expect(ids).not.toContain(studentA2);
  });
});

afterAll(async () => { await prisma.$disconnect(); });
