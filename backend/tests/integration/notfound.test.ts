import request from 'supertest';
import app from '../../src/app';

describe('Not found handler', () => {
  it('returns 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route');
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
    });
  });
});
