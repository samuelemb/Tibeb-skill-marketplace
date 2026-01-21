import { prisma } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { ContractStatus, JobStatus } from '@prisma/client';
import { recordAuditLog } from './auditLogService';
import bcrypt from 'bcryptjs';
import { CreateAdminInput } from '../utils/validation';

async function resolveDisputeForEscrow(escrow: { id: string; jobId: string; contractId: string; clientId: string }, reason?: string) {
  const dispute = await prisma.escrowDispute.findFirst({
    where: { escrowPaymentId: escrow.id, status: 'OPEN' },
    orderBy: { createdAt: 'desc' },
  });

  if (!dispute) {
    return prisma.escrowDispute.create({
      data: {
        escrowPaymentId: escrow.id,
        jobId: escrow.jobId,
        contractId: escrow.contractId,
        raisedById: escrow.clientId,
        type: 'DISPUTE',
        status: 'RESOLVED',
        reason,
        resolvedAt: new Date(),
      },
    });
  }

  return prisma.escrowDispute.update({
    where: { id: dispute.id },
    data: { status: 'RESOLVED', reason: reason || dispute.reason, resolvedAt: new Date() },
  });
}

export async function suspendUser(userId: string, actorId: string, reason?: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isSuspended: true, suspendedReason: reason, suspendedAt: new Date() },
  });

  await recordAuditLog({
    actorId,
    action: 'USER_SUSPENDED',
    entityType: 'User',
    entityId: userId,
    metadata: { reason },
  });

  return user;
}

export async function createAdmin(input: CreateAdminInput, actorId?: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new ValidationError('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const admin = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      role: 'ADMIN',
      emailVerified: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (actorId) {
    await recordAuditLog({
      actorId,
      action: 'ADMIN_CREATED',
      entityType: 'User',
      entityId: admin.id,
      metadata: { email: admin.email },
    });
  }

  return admin;
}

export async function unsuspendUser(userId: string, actorId: string, reason?: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isSuspended: false, suspendedReason: null, suspendedAt: null },
  });

  await recordAuditLog({
    actorId,
    action: 'USER_UNSUSPENDED',
    entityType: 'User',
    entityId: userId,
    metadata: { reason },
  });

  return user;
}

export async function hideJob(jobId: string, actorId: string, reason?: string) {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: { isHidden: true, hiddenReason: reason, hiddenAt: new Date() },
  });

  await recordAuditLog({
    actorId,
    action: 'JOB_HIDDEN',
    entityType: 'Job',
    entityId: jobId,
    metadata: { reason },
  });

  return job;
}

export async function unhideJob(jobId: string, actorId: string, reason?: string) {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: { isHidden: false, hiddenReason: null, hiddenAt: null },
  });

  await recordAuditLog({
    actorId,
    action: 'JOB_UNHIDDEN',
    entityType: 'Job',
    entityId: jobId,
    metadata: { reason },
  });

  return job;
}

export async function hideProposal(proposalId: string, actorId: string, reason?: string) {
  const proposal = await prisma.proposal.update({
    where: { id: proposalId },
    data: { isHidden: true, hiddenReason: reason, hiddenAt: new Date() },
  });

  await recordAuditLog({
    actorId,
    action: 'PROPOSAL_HIDDEN',
    entityType: 'Proposal',
    entityId: proposalId,
    metadata: { reason },
  });

  return proposal;
}

export async function unhideProposal(proposalId: string, actorId: string, reason?: string) {
  const proposal = await prisma.proposal.update({
    where: { id: proposalId },
    data: { isHidden: false, hiddenReason: null, hiddenAt: null },
  });

  await recordAuditLog({
    actorId,
    action: 'PROPOSAL_UNHIDDEN',
    entityType: 'Proposal',
    entityId: proposalId,
    metadata: { reason },
  });

  return proposal;
}

export async function hideReview(reviewId: string, actorId: string, reason?: string) {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { isHidden: true, hiddenReason: reason, hiddenAt: new Date() },
  });

  await recordAuditLog({
    actorId,
    action: 'REVIEW_HIDDEN',
    entityType: 'Review',
    entityId: reviewId,
    metadata: { reason },
  });

  return review;
}

export async function unhideReview(reviewId: string, actorId: string, reason?: string) {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { isHidden: false, hiddenReason: null, hiddenAt: null },
  });

  await recordAuditLog({
    actorId,
    action: 'REVIEW_UNHIDDEN',
    entityType: 'Review',
    entityId: reviewId,
    metadata: { reason },
  });

  return review;
}

async function getEscrowForJob(jobId: string) {
  const escrow = await prisma.escrowPayment.findFirst({
    where: { jobId },
    orderBy: { createdAt: 'desc' },
  });

  if (!escrow) {
    throw new NotFoundError('Escrow payment not found');
  }

  return escrow;
}

export async function holdEscrow(jobId: string, actorId: string, reason?: string) {
  const escrow = await getEscrowForJob(jobId);

  const updatedEscrow = await prisma.escrowPayment.update({
    where: { id: escrow.id },
    data: { status: 'HELD' },
  });

  await recordAuditLog({
    actorId,
    action: 'ESCROW_HELD',
    entityType: 'EscrowPayment',
    entityId: escrow.id,
    metadata: { jobId, reason },
  });

  return updatedEscrow;
}

export async function releaseEscrow(jobId: string, actorId: string, reason?: string) {
  const escrow = await getEscrowForJob(jobId);

  if (!['PAID', 'HELD', 'DISPUTED'].includes(escrow.status)) {
    throw new ValidationError('Escrow cannot be released in its current status');
  }

  const payoutAmount = Number(escrow.amount) - Number(escrow.platformFee);

  await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { userId: escrow.freelancerId },
      update: {
        balance: { increment: payoutAmount },
      },
      create: {
        userId: escrow.freelancerId,
        balance: payoutAmount,
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount: payoutAmount,
        currency: escrow.currency,
        reference: escrow.txRef,
        metadata: {
          jobId: escrow.jobId,
          contractId: escrow.contractId,
          platformFee: escrow.platformFee,
          adminOverride: true,
        },
      },
    });

    await tx.escrowPayment.update({
      where: { id: escrow.id },
      data: { status: 'RELEASED', releasedAt: new Date() },
    });

    await tx.contract.update({
      where: { id: escrow.contractId },
      data: { status: ContractStatus.COMPLETED, completedAt: new Date() },
    });

    await tx.job.update({
      where: { id: escrow.jobId },
      data: { status: JobStatus.COMPLETED },
    });
  });

  await resolveDisputeForEscrow(escrow, reason);

  await recordAuditLog({
    actorId,
    action: 'ESCROW_RELEASED',
    entityType: 'EscrowPayment',
    entityId: escrow.id,
    metadata: { jobId, reason },
  });

  return escrow;
}

export async function refundEscrow(jobId: string, actorId: string, reason?: string) {
  const escrow = await getEscrowForJob(jobId);

  if (!['PAID', 'HELD', 'DISPUTED'].includes(escrow.status)) {
    throw new ValidationError('Escrow cannot be refunded in its current status');
  }

  await prisma.$transaction(async (tx) => {
    await tx.escrowPayment.update({
      where: { id: escrow.id },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });

    await tx.contract.update({
      where: { id: escrow.contractId },
      data: { status: ContractStatus.CANCELLED },
    });

    await tx.job.update({
      where: { id: escrow.jobId },
      data: { status: JobStatus.OPEN },
    });
  });

  await resolveDisputeForEscrow(escrow, reason);

  await recordAuditLog({
    actorId,
    action: 'ESCROW_REFUNDED',
    entityType: 'EscrowPayment',
    entityId: escrow.id,
    metadata: { jobId, reason },
  });

  return escrow;
}

export async function rejectEscrowDispute(jobId: string, actorId: string, reason?: string) {
  const escrow = await getEscrowForJob(jobId);

  const dispute = await prisma.escrowDispute.findFirst({
    where: { escrowPaymentId: escrow.id, status: 'OPEN' },
    orderBy: { createdAt: 'desc' },
  });

  if (!dispute) {
    throw new ValidationError('No open dispute found for this escrow');
  }

  await prisma.$transaction(async (tx) => {
    await tx.escrowDispute.update({
      where: { id: dispute.id },
      data: { status: 'REJECTED', reason: reason || dispute.reason, resolvedAt: new Date() },
    });

    if (['HELD', 'DISPUTED'].includes(escrow.status)) {
      await tx.escrowPayment.update({
        where: { id: escrow.id },
        data: { status: 'PAID' },
      });
    }
  });

  await recordAuditLog({
    actorId,
    action: 'ESCROW_DISPUTE_REJECTED',
    entityType: 'EscrowPayment',
    entityId: escrow.id,
    metadata: { jobId, reason },
  });

  return escrow;
}

export async function listJobReports(status?: 'OPEN' | 'RESOLVED' | 'REJECTED') {
  return prisma.jobReport.findMany({
    where: status ? { status } : undefined,
    include: {
      job: true,
      reporter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function resolveJobReport(reportId: string, actorId: string, status: 'RESOLVED' | 'REJECTED', reason?: string) {
  const report = await prisma.jobReport.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new NotFoundError('Job report not found');
  }

  const updated = await prisma.jobReport.update({
    where: { id: reportId },
    data: {
      status,
      reason: reason || report.reason,
      resolvedAt: new Date(),
    },
  });

  await recordAuditLog({
    actorId,
    action: status === 'RESOLVED' ? 'JOB_REPORT_RESOLVED' : 'JOB_REPORT_REJECTED',
    entityType: 'JobReport',
    entityId: reportId,
    metadata: { reason },
  });

  return updated;
}
