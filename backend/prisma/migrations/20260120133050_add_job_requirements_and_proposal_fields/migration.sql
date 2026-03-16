-- Ensure reviews table exists for shadow DB replay
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

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
ALTER TABLE "reviews"
  ADD COLUMN IF NOT EXISTS "hiddenAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "hiddenReason" TEXT,
  ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex (guarded if category exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'category'
  ) THEN
    CREATE INDEX IF NOT EXISTS "jobs_status_category_createdAt_idx"
      ON "jobs"("status", "category", "createdAt");
  END IF;
END $$;
