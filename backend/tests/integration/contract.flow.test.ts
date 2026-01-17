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

describe('Contract flow', () => {
  beforeEach(async () => {
    await resetDb();
  });

  const client = {
    email: 'client-contract@example.com',
    password: 'password123',
    firstName: 'Client',
    lastName: 'Contract',
    role: 'CLIENT' as const,
  };

  const freelancer = {
    email: 'freelancer-contract@example.com',
    password: 'password123',
    firstName: 'Free',
    lastName: 'Lancer',
    role: 'FREELANCER' as const,
  };

  it('creates contract, moves job to CONTRACTED, IN_PROGRESS, COMPLETED, and both can review', async () => {
    await registerUser(client);
    await verifyUser(client.email);
    const clientToken = (await loginUser(client.email, client.password)).body.data.token as string;

    await registerUser(freelancer);
    await verifyUser(freelancer.email);
    const freelancerToken = (await loginUser(freelancer.email, freelancer.password)).body.data.token as string;

    const jobResponse = await createJob(clientToken, {
      title: 'Contract flow job',
      description: 'Full contract flow.',
      budget: 1200,
      category: 'WEB_DEVELOPMENT',
    });
    const jobId = jobResponse.body.data.id as string;
    await publishJob(clientToken, jobId);

    const proposalResponse = await submitProposal(freelancerToken, {
      jobId,
      message: 'Ready to work.',
      proposedAmount: 1100,
    });
    const proposalId = proposalResponse.body.data.id as string;
    await offerProposal(clientToken, proposalId);
    await acceptProposal(freelancerToken, proposalId);

    const contract = await prisma.contract.findUnique({
      where: { proposalId },
    });
    expect(contract).toBeTruthy();
    expect(contract?.status).toBe('ACTIVE');

    const jobAfterAccept = await prisma.job.findUnique({ where: { id: jobId } });
    expect(jobAfterAccept?.status).toBe('CONTRACTED');

    await prisma.escrowPayment.create({
      data: {
        jobId,
        contractId: contract!.id,
        clientId: contract!.clientId,
        freelancerId: contract!.freelancerId,
        amount: contract!.agreedAmount || 1200,
        platformFee: 100,
        currency: 'ETB',
        status: 'PAID',
        txRef: `test_${jobId}_paid`,
      },
    });

    const inProgressResponse = await request(app)
      .patch(`/api/jobs/${jobId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'IN_PROGRESS' });
    expect(inProgressResponse.status).toBe(200);
    expect(inProgressResponse.body.data.status).toBe('IN_PROGRESS');

    const completedResponse = await request(app)
      .patch(`/api/jobs/${jobId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'COMPLETED' });
    expect(completedResponse.status).toBe(200);
    expect(completedResponse.body.data.status).toBe('COMPLETED');

    const clientReview = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        jobId,
        revieweeId: contract!.freelancerId,
        rating: 5,
        comment: 'Excellent work',
      });
    expect(clientReview.status).toBe(201);

    const freelancerReview = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({
        jobId,
        revieweeId: contract!.clientId,
        rating: 4,
        comment: 'Great client',
      });
    expect(freelancerReview.status).toBe(201);
  });
});
