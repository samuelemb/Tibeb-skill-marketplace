import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { ContractStatus, JobStatus, UserRole } from '@prisma/client';
import { notifyAdmins, notifyUser, NotificationType } from './notificationService';

const CHAPA_API_URL = 'https://api.chapa.co/v1/transaction';
const CURRENCY = 'ETB';
const PLATFORM_FEE_RATE = 0.1;

type ChapaInitResponse = {
  status: string;
  message: string;
  data?: {
    checkout_url: string;
    tx_ref: string;
  };
};

type ChapaVerifyResponse = {
  status: string;
  message: string;
  data?: {
    status: string;
    tx_ref: string;
    amount: string;
    currency: string;
  };
};

function getChapaSecret() {
  const key = process.env.CHAPA_SECRET_KEY;
  if (!key) {
    throw new ValidationError('Chapa secret key is not configured');
  }
  return key;
}

function getReturnUrl() {
  return process.env.CHAPA_RETURN_URL || 'http://localhost:3000/payments/chapa/return';
}

function getWebhookUrl() {
  return process.env.CHAPA_WEBHOOK_URL || 'http://localhost:5000/api/payments/chapa/webhook';
}

function buildReturnUrl(txRef: string, jobId: string) {
  const base = getReturnUrl();
  try {
    const url = new URL(base);
    url.searchParams.set('tx_ref', txRef);
    url.searchParams.set('jobId', jobId);
    return url.toString();
  } catch {
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}tx_ref=${encodeURIComponent(txRef)}&jobId=${encodeURIComponent(jobId)}`;
  }
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength);
}

export async function initializeEscrowPayment(jobId: string, userId: string, userRole: string) {
  if (userRole !== 'CLIENT') {
    throw new ForbiddenError('Only clients can fund escrow');
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      contract: true,
      client: true,
    },
  });

  if (!job) {
    throw new NotFoundError('Job not found');
  }

  if (job.clientId !== userId) {
    throw new ForbiddenError('You can only fund escrow for your own jobs');
  }

  if (!job.contract) {
    throw new ValidationError('Job must have an accepted contract before escrow funding');
  }

  if (job.status !== JobStatus.CONTRACTED) {
    throw new ValidationError('Escrow can only be funded for CONTRACTED jobs');
  }

  const amount = job.contract.agreedAmount || job.budget;
  if (!amount) {
    throw new ValidationError('No agreed amount available for escrow funding');
  }

  const existingEscrow = await prisma.escrowPayment.findFirst({
    where: {
      jobId,
      status: { in: ['PAID', 'RELEASED'] },
    },
  });

  if (existingEscrow) {
    throw new ValidationError('Escrow already funded for this job');
  }

  const txRef = `escrow_${jobId}_${Date.now()}`;
  const platformFee = Number(amount) * PLATFORM_FEE_RATE;

  const initPayload = {
    amount: Number(amount).toFixed(2),
    currency: CURRENCY,
    tx_ref: txRef,
    return_url: buildReturnUrl(txRef, jobId),
    callback_url: getWebhookUrl(),
    email: job.client.email,
    first_name: job.client.firstName,
    last_name: job.client.lastName,
    customization: {
      title: truncate('Tibeb Escrow', 50),
      description: truncate(`Escrow funding for job ${job.title}`, 50),
    },
  };

  const response = await fetch(`${CHAPA_API_URL}/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getChapaSecret()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(initPayload),
  });

  const payload = (await response.json()) as ChapaInitResponse;
  if (!response.ok || payload.status !== 'success' || !payload.data?.checkout_url) {
    throw new ValidationError(payload.message || 'Failed to initialize payment');
  }

  const escrow = await prisma.escrowPayment.create({
    data: {
      jobId,
      contractId: job.contract.id,
      clientId: job.clientId,
      freelancerId: job.contract.freelancerId,
      amount: amount,
      platformFee: platformFee,
      currency: CURRENCY,
      status: 'PENDING',
      txRef,
      checkoutUrl: payload.data.checkout_url,
    },
  });

  await notifyUser(
    job.clientId,
    NotificationType.PAYMENT,
    'Escrow Initiated',
    `Your escrow payment for "${job.title}" has been initiated.`,
    `/jobs/${job.id}`
  );
  await notifyUser(
    job.contract.freelancerId,
    NotificationType.PAYMENT,
    'Escrow Initiated',
    `Escrow has been initiated for "${job.title}".`,
    `/jobs/${job.id}`
  );

  return {
    checkoutUrl: escrow.checkoutUrl!,
    txRef: escrow.txRef,
  };
}

export async function verifyEscrowPayment(txRef: string) {
  const escrow = await prisma.escrowPayment.findUnique({
    where: { txRef },
    include: { job: true, contract: true },
  });

  if (!escrow) {
    throw new NotFoundError('Escrow payment not found');
  }

  if (escrow.status === 'PAID' || escrow.status === 'RELEASED') {
    return escrow;
  }

  const response = await fetch(`${CHAPA_API_URL}/verify/${txRef}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getChapaSecret()}`,
    },
  });

  const payload = (await response.json()) as ChapaVerifyResponse;
  if (!response.ok || payload.status !== 'success' || !payload.data) {
    throw new ValidationError(payload.message || 'Failed to verify payment');
  }

  const normalizedStatus = payload.data.status?.toLowerCase();
  const successStatuses = new Set(['success', 'successful', 'completed', 'paid']);
  const pendingStatuses = new Set(['pending', 'processing', 'queued', 'in_progress']);

  if (!successStatuses.has(normalizedStatus || '')) {
    if (pendingStatuses.has(normalizedStatus || '')) {
      return escrow;
    }

    await prisma.escrowPayment.update({
      where: { txRef },
      data: { status: (payload.data.status || 'FAILED').toUpperCase() },
    });
    throw new ValidationError('Payment not completed');
  }

  const updatedEscrow = await prisma.escrowPayment.update({
    where: { txRef },
    data: {
      status: 'PAID',
      paidAt: new Date(),
    },
  });

  await notifyUser(
    escrow.clientId,
    NotificationType.PAYMENT,
    'Escrow Funded',
    `Your escrow payment for "${escrow.job.title}" was received.`,
    `/jobs/${escrow.jobId}`
  );
  await notifyUser(
    escrow.freelancerId,
    NotificationType.PAYMENT,
    'Escrow Funded',
    `Escrow funding for "${escrow.job.title}" is complete.`,
    `/jobs/${escrow.jobId}`
  );

  return updatedEscrow;
}

export async function getPaidEscrowForJob(jobId: string) {
  return prisma.escrowPayment.findFirst({
    where: {
      jobId,
      status: 'PAID',
    },
  });
}

export async function getLatestEscrowForJob(jobId: string) {
  return prisma.escrowPayment.findFirst({
    where: {
      jobId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function requestEscrowRefund(
  jobId: string,
  userId: string,
  userRole: UserRole,
  reason?: string
) {
  if (userRole !== UserRole.CLIENT) {
    throw new ForbiddenError('Only clients can request a refund');
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { contract: true },
  });

  if (!job || !job.contract) {
    throw new NotFoundError('Job or contract not found');
  }

  if (job.clientId !== userId) {
    throw new ForbiddenError('You can only request a refund for your own jobs');
  }

  if (job.status !== JobStatus.CONTRACTED) {
    throw new ValidationError('Refunds are only available before work starts');
  }

  const escrow = await prisma.escrowPayment.findFirst({
    where: {
      jobId,
      status: 'PAID',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!escrow) {
    throw new ValidationError('No funded escrow available for this job');
  }

  const existingRequest = await prisma.escrowDispute.findFirst({
    where: {
      escrowPaymentId: escrow.id,
      type: 'REFUND_REQUEST',
      status: 'OPEN',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existingRequest) {
    return prisma.escrowPayment.update({
      where: { id: escrow.id },
      data: { status: 'HELD' },
    });
  }

  await prisma.escrowDispute.create({
    data: {
      escrowPaymentId: escrow.id,
      jobId,
      contractId: job.contract.id,
      raisedById: userId,
      type: 'REFUND_REQUEST',
      status: 'OPEN',
      reason,
    },
  });

  const updatedEscrow = await prisma.escrowPayment.update({
    where: { id: escrow.id },
    data: { status: 'HELD' },
  });

  await notifyUser(
    escrow.clientId,
    NotificationType.DISPUTE,
    'Refund Requested',
    'Your refund request has been submitted and escrow is on hold.',
    `/jobs/${jobId}`
  );
  await notifyUser(
    escrow.freelancerId,
    NotificationType.DISPUTE,
    'Refund Requested',
    'A refund request was submitted for this job. Escrow is on hold.',
    `/jobs/${jobId}`
  );
  await notifyAdmins(
    NotificationType.ADMIN_ALERT,
    'Refund Request Submitted',
    'A refund request needs review.',
    `/admin?tab=escrow`
  );

  return updatedEscrow;
}

export async function openEscrowDispute(
  jobId: string,
  userId: string,
  userRole: UserRole,
  reason?: string,
  details?: string,
  evidenceUrls?: string[]
) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { contract: true },
  });

  if (!job || !job.contract) {
    throw new NotFoundError('Job or contract not found');
  }

  if (job.clientId !== userId && job.contract.freelancerId !== userId) {
    throw new ForbiddenError('You are not part of this contract');
  }

  const escrow = await prisma.escrowPayment.findFirst({
    where: {
      jobId,
      status: 'PAID',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!escrow) {
    throw new ValidationError('No funded escrow available for this job');
  }

  const existingDispute = await prisma.escrowDispute.findFirst({
    where: {
      escrowPaymentId: escrow.id,
      status: 'OPEN',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existingDispute) {
    return existingDispute;
  }

  const dispute = await prisma.escrowDispute.create({
    data: {
      escrowPaymentId: escrow.id,
      jobId,
      contractId: job.contract.id,
      raisedById: userId,
      type: 'DISPUTE',
      reason,
      details,
      evidenceUrls: evidenceUrls && evidenceUrls.length > 0 ? evidenceUrls : undefined,
    },
  });

  await prisma.escrowPayment.update({
    where: { id: escrow.id },
    data: { status: 'DISPUTED' },
  });

  await notifyUser(
    escrow.clientId,
    NotificationType.DISPUTE,
    'Escrow Dispute Opened',
    'A dispute has been opened for this job.',
    `/jobs/${jobId}`
  );
  await notifyUser(
    escrow.freelancerId,
    NotificationType.DISPUTE,
    'Escrow Dispute Opened',
    'A dispute has been opened for this job.',
    `/jobs/${jobId}`
  );
  await notifyAdmins(
    NotificationType.ADMIN_ALERT,
    'Escrow Dispute Opened',
    'An escrow dispute needs review.',
    `/admin?tab=escrow`
  );

  return dispute;
}

export async function releaseEscrowForJob(jobId: string) {
  const escrow = await prisma.escrowPayment.findFirst({
    where: {
      jobId,
      status: 'PAID',
    },
  });

  if (!escrow) {
    throw new ValidationError('No funded escrow available for this job');
  }

  const payoutAmount = Number(escrow.amount) - Number(escrow.platformFee);

  const wallet = await prisma.wallet.upsert({
    where: { userId: escrow.freelancerId },
    update: {
      balance: {
        increment: payoutAmount,
      },
    },
    create: {
      userId: escrow.freelancerId,
      balance: payoutAmount,
    },
  });

  await prisma.walletTransaction.create({
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
      },
    },
  });

  await prisma.escrowPayment.update({
    where: { id: escrow.id },
    data: {
      status: 'RELEASED',
      releasedAt: new Date(),
    },
  });

  await notifyUser(
    escrow.freelancerId,
    NotificationType.PAYMENT,
    'Payment Released',
    'Escrow funds have been released to your wallet.',
    `/payments`
  );
  await notifyUser(
    escrow.clientId,
    NotificationType.PAYMENT,
    'Payment Released',
    'Escrow funds have been released to the freelancer.',
    `/jobs/${escrow.jobId}`
  );

  return escrow;
}

export async function getClientTotalSpent(clientId: string) {
  const summary = await prisma.escrowPayment.aggregate({
    where: {
      clientId,
      refundedAt: null,
      status: { in: ['PAID', 'RELEASED', 'HELD', 'DISPUTED'] },
    },
    _sum: { amount: true },
  });

  return summary._sum.amount ? Number(summary._sum.amount) : 0;
}
