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
