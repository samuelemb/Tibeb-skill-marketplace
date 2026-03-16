import { prisma } from '../config/database';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { UserRole } from '@prisma/client';

export async function getContractsForUser(userId: string, role: UserRole) {
  const where =
    role === UserRole.ADMIN
      ? {}
      : {
          OR: [{ clientId: userId }, { freelancerId: userId }],
        };

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      job: {
        select: {
          id: true,
          title: true,
          status: true,
          budget: true,
        },
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return contracts;
}

export async function getContractById(
  contractId: string,
  userId: string,
  role: UserRole
) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      job: {
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      proposal: {
        include: {
          freelancer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!contract) {
    throw new NotFoundError('Contract not found');
  }

  if (role !== UserRole.ADMIN && contract.clientId !== userId && contract.freelancerId !== userId) {
    throw new ForbiddenError('You do not have access to this contract');
  }

  return contract;
}
