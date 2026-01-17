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

describe('E2E full user flow', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('register → job → proposal → contract → escrow → completion → payout', async () => {
    const client = {
      email: 'client-e2e@example.com',
      password: 'password123',
      firstName: 'Client',
      lastName: 'E2E',
      role: 'CLIENT' as const,
    };

    const freelancer = {
      email: 'freelancer-e2e@example.com',
      password: 'password123',
      firstName: 'Free',
      lastName: 'E2E',
      role: 'FREELANCER' as const,
    };

    await registerUser(client);
    await verifyUser(client.email);
    const clientToken = (await loginUser(client.email, client.password)).body.data.token as string;

    await registerUser(freelancer);
    await verifyUser(freelancer.email);
    const freelancerToken = (await loginUser(freelancer.email, freelancer.password)).body.data.token as string;

    const jobResponse = await createJob(clientToken, {
      title: 'E2E job',
      description: 'End to end flow.',
      budget: 1500,
      category: 'WEB_DEVELOPMENT',
    });
    const jobId = jobResponse.body.data.id as string;
    await publishJob(clientToken, jobId);

    const proposalResponse = await submitProposal(freelancerToken, {
      jobId,
      message: 'I will do it.',
      proposedAmount: 1400,
    });
    const proposalId = proposalResponse.body.data.id as string;
    await offerProposal(clientToken, proposalId);
    await acceptProposal(freelancerToken, proposalId);

    const contract = await prisma.contract.findUnique({ where: { proposalId } });
    expect(contract).toBeTruthy();

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          checkout_url: 'https://example.com/checkout',
          tx_ref: 'test-e2e-ref',
        },
      }),
    } as any);

    const escrowInit = await request(app)
      .post('/api/payments/chapa/initialize')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ jobId });
    expect(escrowInit.status).toBe(200);

    const escrow = await prisma.escrowPayment.findFirst({ where: { jobId } });
    expect(escrow).toBeTruthy();
    if (escrow) {
      await prisma.escrowPayment.update({
        where: { id: escrow.id },
        data: { status: 'PAID', paidAt: new Date() },
      });
    }

    const inProgress = await request(app)
      .patch(`/api/jobs/${jobId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'IN_PROGRESS' });
    expect(inProgress.status).toBe(200);

    const completed = await request(app)
      .patch(`/api/jobs/${jobId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'COMPLETED' });
    expect(completed.status).toBe(200);

    const wallet = await prisma.wallet.findUnique({
      where: { userId: contract!.freelancerId },
    });
    expect(wallet).toBeTruthy();
    expect(Number(wallet?.balance || 0)).toBeGreaterThan(0);

    const transactionCount = await prisma.walletTransaction.count({
      where: { walletId: wallet!.id },
    });
    expect(transactionCount).toBeGreaterThan(0);

    global.fetch = originalFetch;
  });
});
