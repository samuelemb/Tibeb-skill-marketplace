-- CreateEnum
CREATE TYPE "EscrowDisputeType" AS ENUM ('REFUND_REQUEST', 'DISPUTE');

-- CreateEnum
CREATE TYPE "EscrowDisputeStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');

-- DropIndex
DROP INDEX IF EXISTS "jobs_search_vector_idx";

-- DropIndex
DROP INDEX IF EXISTS "jobs_status_created_idx";

-- AlterTable
ALTER TABLE "escrow_payments" ADD COLUMN     "refundedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "escrow_disputes" (
    "id" TEXT NOT NULL,
    "escrowPaymentId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "raisedById" TEXT NOT NULL,
    "type" "EscrowDisputeType" NOT NULL,
    "status" "EscrowDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "escrow_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "escrow_disputes_escrowPaymentId_idx" ON "escrow_disputes"("escrowPaymentId");

-- CreateIndex
CREATE INDEX "escrow_disputes_jobId_idx" ON "escrow_disputes"("jobId");

-- CreateIndex
CREATE INDEX "escrow_disputes_contractId_idx" ON "escrow_disputes"("contractId");

-- CreateIndex
CREATE INDEX "escrow_disputes_raisedById_idx" ON "escrow_disputes"("raisedById");

-- AddForeignKey
ALTER TABLE "escrow_disputes" ADD CONSTRAINT "escrow_disputes_escrowPaymentId_fkey" FOREIGN KEY ("escrowPaymentId") REFERENCES "escrow_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_disputes" ADD CONSTRAINT "escrow_disputes_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_disputes" ADD CONSTRAINT "escrow_disputes_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_disputes" ADD CONSTRAINT "escrow_disputes_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
