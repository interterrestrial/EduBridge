import request from 'supertest';
import app from '../app';
import prisma from '../prisma';

let teacherToken: string;
let otherTeacherToken: string;
let studentId: string;

beforeAll(async () => {
  const t1 = await request(app).post('/api/auth/register').send({
    name: 'ExamTeacher', email: 'examteacher@test.io', password: 'pw1234', role: 'teacher',
  });
  teacherToken = t1.body.token;

  const t2 = await request(app).post('/api/auth/register').send({
    name: 'OtherTeacher', email: 'otherteacher@test.io', password: 'pw1234', role: 'teacher',
  });
  otherTeacherToken = t2.body.token;

  const s = await request(app).post('/api/auth/register').send({
    name: 'ExamStudent', email: 'examstudent@test.io', password: 'pw1234', role: 'student',
  });
  studentId = s.body.user.id;

  // Enroll student into ExamTeacher's classroom
  await request(app).post('/api/teacher/students').set('Authorization', `Bearer ${teacherToken}`).send({ studentId, className: '6th', section: 'A' });
});

describe('exam endpoints', () => {
  let examId: string;

  it('creates an exam', async () => {
    const r = await request(app).post('/api/teacher/exams').set('Authorization', `Bearer ${teacherToken}`).send({
      title: 'Midterm 1',
      subject: 'Algorithms',
      maxMarks: 100,
      examDate: '2026-08-15',
      className: '6th',
      section: 'A',
    });
    expect(r.status).toBe(201);
    expect(r.body.exam.title).toBe('Midterm 1');
    expect(r.body.exam.maxMarks).toBe(100);
    expect(r.body.exam.className).toBe('6th');
    expect(r.body.exam.section).toBe('A');
    examId = r.body.exam.id;
  });

  it('rejects exam creation with missing fields', async () => {
    const r = await request(app).post('/api/teacher/exams').set('Authorization', `Bearer ${teacherToken}`).send({
      title: 'Bad exam',
    });
    expect(r.status).toBe(400);
  });

  it('blocks students from creating exams', async () => {
    const s = await request(app).post('/api/auth/register').send({
      name: 'SExam', email: 'sexam@test.io', password: 'pw1234', role: 'student',
    });
    const r = await request(app).post('/api/teacher/exams').set('Authorization', `Bearer ${s.body.token}`).send({
      title: 'Nope', subject: 'X', maxMarks: 100, examDate: '2026-08-15',
    });
    expect(r.status).toBe(403);
  });

  it('lists only the teacher\'s own exams', async () => {
    const ownRes = await request(app).get('/api/teacher/exams').set('Authorization', `Bearer ${teacherToken}`);
    expect(ownRes.status).toBe(200);
    expect(ownRes.body.exams.length).toBeGreaterThanOrEqual(1);
    expect(ownRes.body.exams.every((e: any) => e.title === 'Midterm 1')).toBe(true);

    const otherRes = await request(app).get('/api/teacher/exams').set('Authorization', `Bearer ${otherTeacherToken}`);
    expect(otherRes.status).toBe(200);
    expect(otherRes.body.exams.length).toBe(0);
  });

  it('returns exam details with all classroom students', async () => {
    const r = await request(app).get(`/api/teacher/exams/${examId}`).set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(200);
    expect(r.body.exam.title).toBe('Midterm 1');
    expect(Array.isArray(r.body.students)).toBe(true);
    const found = r.body.students.find((s: any) => s.id === studentId);
    expect(found).toBeDefined();
    expect(found.marks).toBeNull();
  });

  it('bulk-saves scores (upsert) and reports class average', async () => {
    const r = await request(app)
      .put(`/api/teacher/exams/${examId}/scores`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ scores: [{ studentId, marks: 78 }] });
    expect(r.status).toBe(200);

    const getRes = await request(app).get(`/api/teacher/exams/${examId}`).set('Authorization', `Bearer ${teacherToken}`);
    const studentScore = getRes.body.students.find((s: any) => s.id === studentId);
    expect(studentScore.marks).toBe(78);
    expect(studentScore.percentage).toBe(78);

    const listRes = await request(app).get('/api/teacher/exams').set('Authorization', `Bearer ${teacherToken}`);
    const exam = listRes.body.exams.find((e: any) => e.id === examId);
    expect(exam.scoreCount).toBe(1);
    expect(exam.classAveragePct).toBe(78);
  });

  it('clamps marks above maxMarks', async () => {
    const r = await request(app)
      .put(`/api/teacher/exams/${examId}/scores`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ scores: [{ studentId, marks: 9999 }] });
    expect(r.status).toBe(200);

    const getRes = await request(app).get(`/api/teacher/exams/${examId}`).set('Authorization', `Bearer ${teacherToken}`);
    const studentScore = getRes.body.students.find((s: any) => s.id === studentId);
    expect(studentScore.marks).toBeLessThanOrEqual(100);
  });

  it('patches a single student\'s score', async () => {
    const r = await request(app)
      .patch(`/api/teacher/exams/${examId}/scores/${studentId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ marks: 85 });
    expect(r.status).toBe(200);
    expect(r.body.score.marks).toBe(85);
    expect(r.body.score.percentage).toBe(85);
  });

  it('blocks a different teacher from accessing another teacher\'s exam', async () => {
    const r = await request(app).get(`/api/teacher/exams/${examId}`).set('Authorization', `Bearer ${otherTeacherToken}`);
    expect(r.status).toBe(404);
  });

  it('exposes examAverage, masteryScore, and gap on the classroom heatmap', async () => {
    const r = await request(app).get('/api/teacher/heatmap').query({ className: '6th', section: 'A' }).set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(200);
    expect(r.body.scope).toEqual({ className: '6th', section: 'A' });
    const student = r.body.studentRoster.find((s: any) => s.id === studentId);
    expect(student).toBeDefined();
    expect(student.quizAccuracy).toBeDefined();
    expect(student.examAverage).toBe(85);
    expect(student.masteryScore).toBeDefined();
    expect(typeof student.gap).toBe('number');
    expect(['Aligned', 'Surface Practice', 'Exam Strong', 'No Exam Data']).toContain(student.gapStatus);
  });

  it('exposes exam history on /api/teacher/student/:studentId', async () => {
    const r = await request(app).get(`/api/teacher/student/${studentId}`).query({ className: '6th', section: 'A' }).set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(200);
    expect(r.body.student.id).toBe(studentId);
    expect(r.body.student.className).toBe('6th');
    expect(r.body.student.section).toBe('A');
    expect(Array.isArray(r.body.student.examScores)).toBe(true);
    const score = r.body.student.examScores.find((s: any) => s.examId === examId);
    expect(score).toBeDefined();
    expect(score.marks).toBe(85);
    expect(score.maxMarks).toBe(100);
    expect(score.percentage).toBe(85);
  });

  it('deletes an exam and cascades its scores', async () => {
    const r = await request(app).delete(`/api/teacher/exams/${examId}`).set('Authorization', `Bearer ${teacherToken}`);
    expect(r.status).toBe(200);

    const getRes = await request(app).get(`/api/teacher/exams/${examId}`).set('Authorization', `Bearer ${teacherToken}`);
    expect(getRes.status).toBe(404);

    const remaining = await prisma.examScore.count({ where: { examId } });
    expect(remaining).toBe(0);
  });
});

afterAll(async () => { await prisma.$disconnect(); });
