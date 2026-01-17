-- Change email verification from token to OTP code
-- This migration replaces emailVerificationToken with emailVerificationCode

-- Drop old unique constraint and column if they exist
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_emailVerificationToken_key";
ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerificationToken";
ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerificationTokenExpiresAt";

-- Add new OTP code columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationCode" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationCodeExpiresAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationAttemptsExpiresAt" TIMESTAMP(3);

