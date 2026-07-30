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

  it('returns empty or filtered heatmap for teacher before enrollment', async () => {
    const r = await request(app).get('/api/teacher/heatmap').set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(200);
    expect(r.body.summary).toBeDefined();
    const rosterIds = r.body.studentRoster.map((st: any) => st.id);
    expect(rosterIds).not.toContain(studentId);
  });

  it('lists unassigned students including newly registered pupil', async () => {
    const r = await request(app).get('/api/teacher/students/unassigned').set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(200);
    const ids = r.body.students.map((st: any) => st.id);
    expect(ids).toContain(studentId);
  });

  it('enrolls a student into the classroom', async () => {
    const r = await request(app).post('/api/teacher/students').set('Authorization', `Bearer ${teacherToken}`).send({
      studentId,
      className: '6th',
      section: 'A',
    });
    expect(r.status).toBe(201);
    expect(r.body.mapping.studentId).toBe(studentId);
  });

  it('returns student in heatmap after enrollment', async () => {
    const r = await request(app).get('/api/teacher/heatmap').set('Authorization', `Bearer ${teacherToken}`).query({ className: '6th', section: 'A' });
    expect(r.status).toBe(200);
    const rosterIds = r.body.studentRoster.map((st: any) => st.id);
    expect(rosterIds).toContain(studentId);
  });

  it('requires noteId or quizId on push', async () => {
    const r = await request(app).post('/api/teacher/push-assignment').set('Authorization', `Bearer ${teacherToken}`).send({
      studentId, title: 'Read this',
    });
    expect(r.status).toBe(400);
  });

  it('unenrolls a student from the classroom', async () => {
    const r = await request(app).delete(`/api/teacher/students/${studentId}`).query({ className: '6th', section: 'A' }).set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(200);

    // After removing the only enrollment, no scope is valid anymore; heatmap returns empty roster
    const heatmapRes = await request(app).get('/api/teacher/heatmap').set('Authorization', `Bearer ${teacherToken}`);
    expect(heatmapRes.status).toBe(200);
    const rosterIds = (heatmapRes.body.studentRoster || []).map((st: any) => st.id);
    expect(rosterIds).not.toContain(studentId);
  });
});

afterAll(async () => { await prisma.$disconnect(); });
