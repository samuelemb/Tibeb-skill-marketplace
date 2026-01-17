import { prisma } from '../config/database';
import { CreateProposalInput } from '../utils/validation';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../utils/errors';
import { UserRole, JobStatus, ProposalStatus, ContractStatus } from '@prisma/client';
import { notifyProposalEvent, notifyFreelancerOfferAccepted } from './notificationService';

export async function createProposal(freelancerId: string, input: CreateProposalInput) {
  // Use transaction to ensure atomicity - all operations succeed or all fail
  return await prisma.$transaction(async (tx) => {
    // Check if job exists and is OPEN
    const job = await tx.job.findUnique({
      where: { id: input.jobId },
      include: {
        contract: true,
      },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.status !== JobStatus.OPEN) {
      throw new ValidationError('Can only submit proposals for OPEN jobs');
    }

    // Check if job already has a contract
    if (job.contract) {
      throw new ValidationError('This job already has an accepted proposal and contract');
    }

    // Check if freelancer already submitted a proposal
    // Database unique constraint will also enforce this, but we check first for better error message
    const existingProposal = await tx.proposal.findUnique({
      where: {
        jobId_freelancerId: {
          jobId: input.jobId,
          freelancerId,
        },
      },
    });

    if (existingProposal) {
      throw new ConflictError('You have already submitted a proposal for this job');
    }

    // Create proposal atomically
    const proposal = await tx.proposal.create({
      data: {
        jobId: input.jobId,
        freelancerId,
        message: input.message,
        proposedAmount: input.proposedAmount,
        status: ProposalStatus.PENDING,
      },
      include: {
        job: {
          include: {
            client: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        freelancer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Notify client about new proposal (A. Proposal submitted)
    // Only notify if client is not the one submitting (prevent self-notification)
    if (job.clientId !== freelancerId) {
      await notifyProposalEvent(
        'PROPOSAL_RECEIVED',
        job.clientId,
        job.title,
        proposal.id,
        undefined,
        tx
      );
    }

    return proposal;
  });
}

export async function getProposals(filters?: {
  jobId?: string;
  freelancerId?: string;
  status?: ProposalStatus;
}) {
  const where: any = {};

  if (filters?.jobId) {
    where.jobId = filters.jobId;
  }

  if (filters?.freelancerId) {
    where.freelancerId = filters.freelancerId;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  const proposals = await prisma.proposal.findMany({
    where,
    include: {
      job: {
        include: {
          client: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      freelancer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      contract: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return proposals;
}

export async function getProposalById(proposalId: string) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      job: {
        include: {
          client: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      freelancer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      contract: {
        include: {
          freelancer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!proposal) {
    throw new NotFoundError('Proposal not found');
  }

  return proposal;
}

/**
 * Send an offer to a freelancer (Client action)
 * Transitions: PENDING → OFFERED
 * Only CLIENT can send offers for their own jobs
 */
export async function sendOffer(proposalId: string, clientId: string, userRole: UserRole) {
  if (userRole !== UserRole.CLIENT) {
    throw new ForbiddenError('Only clients can send offers');
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      job: {
        include: {
          contract: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!proposal) {
    throw new NotFoundError('Proposal not found');
  }

  // Check if client owns the job
  if (proposal.job.clientId !== clientId) {
    throw new ForbiddenError('You can only send offers for your own jobs');
  }

  // Check if proposal is in PENDING status (can only offer to pending proposals)
  if (proposal.status !== ProposalStatus.PENDING) {
    throw new ValidationError('Can only send offers to PENDING proposals');
  }

  // Check if job already has a contract
  if (proposal.job.contract) {
    throw new ValidationError('This job already has an accepted proposal and contract');
  }

  // Check if job is still OPEN
  if (proposal.job.status !== JobStatus.OPEN) {
    throw new ValidationError('Can only send offers for OPEN jobs');
  }

  // Update proposal status to OFFERED
  const updatedProposal = await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: ProposalStatus.OFFERED },
    include: {
      job: {
        include: {
          client: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      freelancer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Notify freelancer about offer (B. Offer sent)
  // Only notify if freelancer is not the one sending (prevent self-notification)
  if (proposal.freelancerId !== clientId) {
    await notifyProposalEvent(
      'OFFER_SENT',
      proposal.freelancerId,
      proposal.job.title,
      proposalId,
      undefined
    );
  }

  return updatedProposal;
}

/**
 * Accept an offer (Freelancer action)
 * Transitions: OFFERED → ACCEPTED
 * Only FREELANCER can accept offers for their own proposals
 * Creates Contract and updates Job status to CONTRACTED
 */
export async function acceptProposal(proposalId: string, userId: string, userRole: UserRole) {
  if (userRole !== UserRole.FREELANCER) {
    throw new ForbiddenError('Only freelancers can accept offers');
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      job: {
        include: {
          contract: true,
        },
      },
    },
  });

  if (!proposal) {
    throw new NotFoundError('Proposal not found');
  }

  // Check if freelancer owns the proposal
  if (proposal.freelancerId !== userId) {
    throw new ForbiddenError('You can only accept offers for your own proposals');
  }

  // Check if proposal is in OFFERED status (must be offered before accepting)
  if (proposal.status !== ProposalStatus.OFFERED) {
    throw new ValidationError('Can only accept proposals that have been offered. Current status: ' + proposal.status);
  }

  // Check if job already has a contract
  if (proposal.job.contract) {
    throw new ValidationError('This job already has an accepted proposal and contract');
  }

  // Check if job is still OPEN
  if (proposal.job.status !== JobStatus.OPEN) {
    throw new ValidationError('Can only accept offers for OPEN jobs');
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Update proposal status to ACCEPTED
    const updatedProposal = await tx.proposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.ACCEPTED },
    });

    // Reject all other proposals for this job (both PENDING and OFFERED)
    await tx.proposal.updateMany({
      where: {
        jobId: proposal.jobId,
        id: { not: proposalId },
        status: { in: [ProposalStatus.PENDING, ProposalStatus.OFFERED] },
      },
      data: { status: ProposalStatus.REJECTED },
    });

    // Create contract
    const contract = await tx.contract.create({
      data: {
        jobId: proposal.jobId,
        proposalId: proposalId,
        clientId: proposal.job.clientId,
        freelancerId: proposal.freelancerId,
        agreedAmount: proposal.proposedAmount || proposal.job.budget,
        status: ContractStatus.ACTIVE,
      },
    });

    // Update job status to CONTRACTED
    // Contract is created, job is now in contracted state
    // Note: Job can later transition to IN_PROGRESS when escrow is deposited
    await tx.job.update({
      where: { id: proposal.jobId },
      data: { status: JobStatus.CONTRACTED },
    });

    return { proposal: updatedProposal, contract };
  });

  // Create notifications (C. Offer accepted)
  // Notify freelancer about their acceptance (confirmation)
  await notifyFreelancerOfferAccepted(
    proposal.freelancerId,
    proposal.job.title,
    result.contract.id
  );

  // Notify client that their offer was accepted
  // Only notify if client is not the freelancer (prevent self-notification in edge cases)
  if (proposal.job.clientId !== proposal.freelancerId) {
    await notifyProposalEvent(
      'OFFER_ACCEPTED',
      proposal.job.clientId,
      proposal.job.title,
      proposalId,
      undefined
    );
  }

  // Get full contract with relations
  const contract = await prisma.contract.findUnique({
    where: { id: result.contract.id },
    include: {
      job: {
        include: {
          client: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      proposal: {
        include: {
          freelancer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      freelancer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return contract!;
}

/**
 * Reject an offer (Freelancer action)
 * Transitions: OFFERED → REJECTED
 * Only FREELANCER can reject offers for their own proposals
 */
export async function rejectOffer(proposalId: string, freelancerId: string, userRole: UserRole) {
  if (userRole !== UserRole.FREELANCER) {
    throw new ForbiddenError('Only freelancers can reject offers');
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      job: {
        include: {
          client: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!proposal) {
    throw new NotFoundError('Proposal not found');
  }

  // Check if freelancer owns the proposal
  if (proposal.freelancerId !== freelancerId) {
    throw new ForbiddenError('You can only reject offers for your own proposals');
  }

  // Check if proposal is in OFFERED status
  if (proposal.status !== ProposalStatus.OFFERED) {
    throw new ValidationError('Can only reject proposals that have been offered. Current status: ' + proposal.status);
  }

  // Update proposal status to REJECTED
  const updatedProposal = await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: ProposalStatus.REJECTED },
    include: {
      job: {
        include: {
          client: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      freelancer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Notify client about offer rejection (D. Offer rejected)
  // Only notify if client is not the one rejecting (prevent self-notification)
  if (proposal.job.clientId !== freelancerId) {
    await notifyProposalEvent(
      'OFFER_REJECTED',
      proposal.job.clientId,
      proposal.job.title,
      proposalId,
      undefined
    );
  }

  return updatedProposal;
}

export async function withdrawProposal(proposalId: string, freelancerId: string, userRole: UserRole) {
  if (userRole !== UserRole.FREELANCER) {
    throw new ForbiddenError('Only freelancers can withdraw proposals');
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
  });

  if (!proposal) {
    throw new NotFoundError('Proposal not found');
  }

  if (proposal.freelancerId !== freelancerId) {
    throw new ForbiddenError('You can only withdraw your own proposals');
  }

  if (proposal.status !== ProposalStatus.PENDING) {
    throw new ValidationError('Can only withdraw PENDING proposals');
  }

  await prisma.proposal.delete({
    where: { id: proposalId },
  });

  return { message: 'Proposal withdrawn successfully' };
}

