import { UserRole, JobStatus, ProposalStatus, ContractStatus } from '@prisma/client';

// Re-export Prisma types for convenience
export type { UserRole, JobStatus, ProposalStatus, ContractStatus };

// Extended types
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

