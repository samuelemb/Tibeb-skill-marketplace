import request from 'supertest';
import app from '../../src/app';

describe('Auth validation', () => {
  it('rejects empty login body', async () => {
    const response = await request(app).post('/api/auth/login').send({});
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('rejects invalid role on register', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN',
    });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('rejects invalid verify email payload', async () => {
    const response = await request(app).post('/api/auth/verify-email').send({
      email: 'not-an-email',
      code: '123',
    });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
