-- Add email verification and password reset fields to User model
-- These fields support account verification and password reset features

-- Add emailVerified field (defaults to false)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- Add emailVerificationToken field (nullable, unique)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_emailVerificationToken_key" ON "users"("emailVerificationToken") WHERE "emailVerificationToken" IS NOT NULL;

-- Add emailVerificationTokenExpiresAt field (nullable)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationTokenExpiresAt" TIMESTAMP(3);

-- Add passwordResetToken field (nullable, unique)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_passwordResetToken_key" ON "users"("passwordResetToken") WHERE "passwordResetToken" IS NOT NULL;

-- Add passwordResetTokenExpiresAt field (nullable)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordResetTokenExpiresAt" TIMESTAMP(3);