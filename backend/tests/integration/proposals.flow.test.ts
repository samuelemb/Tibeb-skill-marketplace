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

describe('Proposal flow', () => {
  beforeEach(async () => {
    await resetDb();
  });

  const client = {
    email: 'client-proposal@example.com',
    password: 'password123',
    firstName: 'Client',
    lastName: 'Proposal',
    role: 'CLIENT' as const,
  };

  const freelancer = {
    email: 'freelancer-proposal@example.com',
    password: 'password123',
    firstName: 'Free',
    lastName: 'Lancer',
    role: 'FREELANCER' as const,
  };

  it('client offers and freelancer accepts proposal', async () => {
    await registerUser(client);
    await verifyUser(client.email);
    const clientToken = (await loginUser(client.email, client.password)).body.data.token as string;

    await registerUser(freelancer);
    await verifyUser(freelancer.email);
    const freelancerToken = (await loginUser(freelancer.email, freelancer.password)).body.data.token as string;

    const jobResponse = await createJob(clientToken, {
      title: 'API integration',
      description: 'Integrate APIs',
      budget: 800,
      category: 'WEB_DEVELOPMENT',
    });
    const jobId = jobResponse.body.data.id as string;
    await publishJob(clientToken, jobId);

    const proposalResponse = await submitProposal(freelancerToken, {
      jobId,
      message: 'I can do this job.',
      proposedAmount: 750,
    });
    expect(proposalResponse.status).toBe(201);
    expect(proposalResponse.body.data.status).toBe('PENDING');
    const proposalId = proposalResponse.body.data.id as string;

    const offerResponse = await offerProposal(clientToken, proposalId);
    expect(offerResponse.status).toBe(200);
    expect(offerResponse.body.data.status).toBe('OFFERED');

    const acceptResponse = await acceptProposal(freelancerToken, proposalId);
    expect(acceptResponse.status).toBe(200);

    const updatedProposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });
    expect(updatedProposal?.status).toBe('ACCEPTED');

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });
    expect(job?.status).toBe('CONTRACTED');
  });
});
