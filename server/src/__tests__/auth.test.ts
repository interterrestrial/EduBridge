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
