import request from 'supertest';
import app from '../../src/app';

describe('Health endpoint', () => {
  it('returns API health', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Tibeb API is running',
    });
    expect(typeof response.body.timestamp).toBe('string');
  });
});
