-- DropIndex
DROP INDEX IF EXISTS "jobs_search_vector_idx";

-- DropIndex
DROP INDEX IF EXISTS "jobs_status_created_idx";

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "requiredSkills" TEXT,
ADD COLUMN     "timeline" TEXT;

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "deliveryTime" TEXT,
ADD COLUMN     "relevantExperience" TEXT;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "hiddenReason" TEXT,
ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "jobs_status_category_createdAt_idx" ON "jobs"("status", "category", "createdAt");
