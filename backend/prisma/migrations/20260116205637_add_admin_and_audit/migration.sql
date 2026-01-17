-- Add ADMIN to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADMIN';

-- User moderation fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspendedReason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);

-- Job moderation fields
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "hiddenReason" TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "hiddenAt" TIMESTAMP(3);

-- Proposal moderation fields
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "hiddenReason" TEXT;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "hiddenAt" TIMESTAMP(3);

-- Review moderation fields (guard if reviews table not created yet)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'reviews'
  ) THEN
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "hiddenReason" TEXT;
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "hiddenAt" TIMESTAMP(3);
  END IF;
END $$;

-- Audit log table
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
