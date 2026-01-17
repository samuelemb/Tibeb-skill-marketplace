import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
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

describe('Review flow', () => {
  beforeEach(async () => {
    await resetDb();
  });

  const client = {
    email: 'client-review@example.com',
    password: 'password123',
    firstName: 'Client',
    lastName: 'Review',
    role: 'CLIENT' as const,
  };

  const freelancer = {
    email: 'freelancer-review@example.com',
    password: 'password123',
    firstName: 'Free',
    lastName: 'Lancer',
    role: 'FREELANCER' as const,
  };

  it('allows review after job completion', async () => {
    await registerUser(client);
    await verifyUser(client.email);
    const clientToken = (await loginUser(client.email, client.password)).body.data.token as string;

    await registerUser(freelancer);
    await verifyUser(freelancer.email);
    const freelancerToken = (await loginUser(freelancer.email, freelancer.password)).body.data.token as string;

    const jobResponse = await createJob(clientToken, {
      title: 'Review job',
      description: 'Review flow job.',
      budget: 1000,
      category: 'WEB_DEVELOPMENT',
    });
    const jobId = jobResponse.body.data.id as string;
    await publishJob(clientToken, jobId);

    const proposalResponse = await submitProposal(freelancerToken, {
      jobId,
      message: 'Let me handle this.',
      proposedAmount: 950,
    });
    const proposalId = proposalResponse.body.data.id as string;
    await offerProposal(clientToken, proposalId);
    await acceptProposal(freelancerToken, proposalId);

    const contract = await prisma.contract.findUnique({
      where: { proposalId },
    });
    expect(contract).toBeTruthy();

    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'COMPLETED' },
    });
    if (contract) {
      await prisma.contract.update({
        where: { id: contract.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    const reviewResponse = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        jobId,
        revieweeId: contract?.freelancerId,
        rating: 5,
        comment: 'Great work',
      });

    expect(reviewResponse.status).toBe(201);
    expect(reviewResponse.body.success).toBe(true);
  });
});
