import request from 'supertest';
import app from '../../src/app';
import {
  resetDb,
  registerUser,
  verifyUser,
  loginUser,
  createJob,
  publishJob,
  submitProposal,
  offerProposal,
  acceptProposal,
} from '../utils';

describe('Escrow payment flow', () => {
  beforeEach(async () => {
    await resetDb();
  });

  const client = {
    email: 'client-pay@example.com',
    password: 'password123',
    firstName: 'Client',
    lastName: 'Pay',
    role: 'CLIENT' as const,
  };

  const freelancer = {
    email: 'freelancer-pay@example.com',
    password: 'password123',
    firstName: 'Free',
    lastName: 'Lancer',
    role: 'FREELANCER' as const,
  };

  it('rejects escrow initialize when job not contracted', async () => {
    await registerUser(client);
    await verifyUser(client.email);
    const clientToken = (await loginUser(client.email, client.password)).body.data.token as string;

    const jobResponse = await createJob(clientToken, {
      title: 'Draft escrow',
      description: 'Needs escrow later.',
      budget: 600,
      category: 'WEB_DEVELOPMENT',
    });
    const jobId = jobResponse.body.data.id as string;

    const response = await request(app)
      .post('/api/payments/chapa/initialize')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ jobId });

    expect(response.status).toBe(400);
  });

  it('initializes escrow for contracted job', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          checkout_url: 'https://example.com/checkout',
          tx_ref: 'test-ref',
        },
      }),
    } as any);

    await registerUser(client);
    await verifyUser(client.email);
    const clientToken = (await loginUser(client.email, client.password)).body.data.token as string;

    await registerUser(freelancer);
    await verifyUser(freelancer.email);
    const freelancerToken = (await loginUser(freelancer.email, freelancer.password)).body.data.token as string;

    const jobResponse = await createJob(clientToken, {
      title: 'Escrow job',
      description: 'Needs escrow.',
      budget: 900,
      category: 'WEB_DEVELOPMENT',
    });
    const jobId = jobResponse.body.data.id as string;
    await publishJob(clientToken, jobId);

    const proposalResponse = await submitProposal(freelancerToken, {
      jobId,
      message: 'Ready to start.',
      proposedAmount: 850,
    });
    const proposalId = proposalResponse.body.data.id as string;
    await offerProposal(clientToken, proposalId);
    await acceptProposal(freelancerToken, proposalId);

    const response = await request(app)
      .post('/api/payments/chapa/initialize')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ jobId });

    expect(response.status).toBe(200);
    expect(response.body.data.checkoutUrl).toBeDefined();

    global.fetch = originalFetch;
  });
});
