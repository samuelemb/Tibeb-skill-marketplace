import request from 'supertest';
import app from '../../src/app';
import { resetDb, registerUser, verifyUser, loginUser } from '../utils';

describe('Job system', () => {
  beforeEach(async () => {
    await resetDb();
  });

  const client = {
    email: 'client@example.com',
    password: 'password123',
    firstName: 'Client',
    lastName: 'User',
    role: 'CLIENT' as const,
  };

  const freelancer = {
    email: 'freelancer@example.com',
    password: 'password123',
    firstName: 'Free',
    lastName: 'Lancer',
    role: 'FREELANCER' as const,
  };

  async function getToken(email: string, password: string) {
    const response = await loginUser(email, password);
    return response.body.data.token as string;
  }

  it('client creates draft job and publishes to open', async () => {
    await registerUser(client);
    await verifyUser(client.email);
    const token = await getToken(client.email, client.password);

    const createResponse = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Build a landing page',
        description: 'Need a responsive landing page.',
        budget: 500,
        category: 'WEB_DEVELOPMENT',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.status).toBe('DRAFT');

    const jobId = createResponse.body.data.id as string;

    const publishResponse = await request(app)
      .patch(`/api/jobs/${jobId}/publish`)
      .set('Authorization', `Bearer ${token}`);

    expect(publishResponse.status).toBe(200);
    expect(publishResponse.body.data.status).toBe('OPEN');
  });

  it('freelancer can see OPEN jobs but not DRAFT', async () => {
    await registerUser(client);
    await verifyUser(client.email);
    const clientToken = await getToken(client.email, client.password);

    await registerUser(freelancer);
    await verifyUser(freelancer.email);

    const draftResponse = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        title: 'Draft job',
        description: 'Draft only job.',
        budget: 300,
        category: 'WEB_DEVELOPMENT',
      });

    const publishedResponse = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        title: 'Open job',
        description: 'Published job.',
        budget: 700,
        category: 'WEB_DEVELOPMENT',
      });

    const publishJobId = publishedResponse.body.data.id as string;
    await request(app)
      .patch(`/api/jobs/${publishJobId}/publish`)
      .set('Authorization', `Bearer ${clientToken}`);

    const listResponse = await request(app).get('/api/jobs?status=OPEN');
    expect(listResponse.status).toBe(200);
    const jobs = listResponse.body.data as Array<{ id: string; title: string }>;
    expect(jobs.some((job) => job.title === 'Open job')).toBe(true);
    expect(jobs.some((job) => job.title === 'Draft job')).toBe(false);
  });

  it('client can edit own job but others cannot', async () => {
    await registerUser(client);
    await verifyUser(client.email);
    const clientToken = await getToken(client.email, client.password);

    await registerUser(freelancer);
    await verifyUser(freelancer.email);
    const freelancerToken = await getToken(freelancer.email, freelancer.password);

    const jobResponse = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        title: 'Editable job',
        description: 'Original description.',
        budget: 400,
        category: 'WEB_DEVELOPMENT',
      });
    const jobId = jobResponse.body.data.id as string;

    const updateResponse = await request(app)
      .put(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        title: 'Edited job',
        description: 'Updated description.',
      });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.title).toBe('Edited job');

    const forbiddenResponse = await request(app)
      .put(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({
        title: 'Hacked job',
      });
    expect(forbiddenResponse.status).toBe(403);
  });
});
