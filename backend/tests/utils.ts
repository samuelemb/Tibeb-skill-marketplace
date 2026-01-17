import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

export async function resetDb() {
  await prisma.auditLog.deleteMany();
  await prisma.escrowDispute.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.escrowPayment.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();
}

export async function registerUser(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'CLIENT' | 'FREELANCER';
}) {
  const response = await request(app).post('/api/auth/register').send(payload);
  return response;
}

export async function verifyUser(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.emailVerificationCode) {
    throw new Error('Verification code not found for user');
  }

  const response = await request(app).post('/api/auth/verify-email').send({
    email,
    code: user.emailVerificationCode,
  });
  return response;
}

export async function loginUser(email: string, password: string) {
  const response = await request(app).post('/api/auth/login').send({ email, password });
  return response;
}

export async function createJob(token: string, payload: {
  title: string;
  description: string;
  budget?: number;
  category?: string;
}) {
  const response = await request(app)
    .post('/api/jobs')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
  return response;
}

export async function publishJob(token: string, jobId: string) {
  return request(app)
    .patch(`/api/jobs/${jobId}/publish`)
    .set('Authorization', `Bearer ${token}`);
}

export async function submitProposal(token: string, payload: {
  jobId: string;
  message: string;
  proposedAmount?: number;
}) {
  return request(app)
    .post('/api/proposals')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}

export async function offerProposal(token: string, proposalId: string) {
  return request(app)
    .post(`/api/proposals/${proposalId}/offer`)
    .set('Authorization', `Bearer ${token}`);
}

export async function acceptProposal(token: string, proposalId: string) {
  return request(app)
    .post(`/api/proposals/${proposalId}/accept`)
    .set('Authorization', `Bearer ${token}`);
}
