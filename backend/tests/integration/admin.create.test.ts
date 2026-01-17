import request from 'supertest';
import app from '../../src/app';

describe('Admin creation security', () => {
  it('rejects admin creation without secret', async () => {
    const response = await request(app).post('/api/admin/create').send({
      email: 'admin@example.com',
      password: 'StrongPass123',
      firstName: 'Admin',
      lastName: 'User',
    });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
