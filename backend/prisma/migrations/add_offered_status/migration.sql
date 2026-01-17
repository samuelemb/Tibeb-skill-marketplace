-- AlterEnum: Add OFFERED to ProposalStatus enum
-- This enables the Offer/Hire workflow: PENDING → OFFERED → ACCEPTED
ALTER TYPE "ProposalStatus" ADD VALUE 'OFFERED';

