-- CreateEnum
CREATE TYPE "JobCategory" AS ENUM ('WEB_DEVELOPMENT', 'MOBILE_DEVELOPMENT', 'DESIGN', 'WRITING', 'MARKETING', 'DATA_ANALYTICS', 'CONSULTING', 'OTHER');

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "category" "JobCategory" NOT NULL DEFAULT 'OTHER';

-- CreateIndex
CREATE INDEX "jobs_category_idx" ON "jobs"("category");

