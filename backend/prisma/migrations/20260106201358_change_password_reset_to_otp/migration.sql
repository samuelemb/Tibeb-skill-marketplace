-- AlterTable
ALTER TABLE "users" DROP COLUMN "passwordResetToken",
DROP COLUMN "passwordResetTokenExpiresAt";

-- AlterTable
ALTER TABLE "users" ADD COLUMN "passwordResetCode" TEXT,
ADD COLUMN "passwordResetCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN "passwordResetAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "passwordResetAttemptsExpiresAt" TIMESTAMP(3);

