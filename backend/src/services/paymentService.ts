import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { ContractStatus, JobStatus, UserRole } from '@prisma/client';

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
      title: 'Tibeb Escrow',
      description: `Escrow funding for job ${job.title}`,
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

  const updatedEscrow = await prisma.escrowPayment.update({
    where: { id: escrow.id },
    data: {
      status: 'REFUNDED',
      refundedAt: new Date(),
    },
  });

  await prisma.contract.update({
    where: { id: job.contract.id },
    data: { status: ContractStatus.CANCELLED },
  });

  await prisma.job.update({
    where: { id: jobId },
    data: { status: JobStatus.OPEN },
  });

  await prisma.escrowDispute.create({
    data: {
      escrowPaymentId: escrow.id,
      jobId,
      contractId: job.contract.id,
      raisedById: userId,
      type: 'REFUND_REQUEST',
      status: 'RESOLVED',
      reason,
      resolvedAt: new Date(),
    },
  });

  return updatedEscrow;
}

export async function openEscrowDispute(
  jobId: string,
  userId: string,
  userRole: UserRole,
  reason?: string
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

  const dispute = await prisma.escrowDispute.create({
    data: {
      escrowPaymentId: escrow.id,
      jobId,
      contractId: job.contract.id,
      raisedById: userId,
      type: 'DISPUTE',
      reason,
    },
  });

  await prisma.escrowPayment.update({
    where: { id: escrow.id },
    data: { status: 'DISPUTED' },
  });

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

  return escrow;
}
