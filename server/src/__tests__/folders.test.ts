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
