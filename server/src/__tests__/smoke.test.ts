import request from 'supertest';
import app from '../app';

describe('smoke', () => {
  it('returns 200 on health route placeholder', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('EduBridge');
  });
});
