import request from 'supertest';
import app from '../../src/app';

describe('API docs', () => {
  it('serves Swagger JSON', async () => {
    const response = await request(app).get('/api-docs.json');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveProperty('openapi');
  });
});
