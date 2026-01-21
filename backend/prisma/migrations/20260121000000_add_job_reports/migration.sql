-- Create enum for job report status
DO $$
BEGIN
  CREATE TYPE "JobReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create job_reports table
CREATE TABLE IF NOT EXISTS "job_reports" (
  "id" TEXT PRIMARY KEY,
  "jobId" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "reason" TEXT,
  "status" "JobReportStatus" NOT NULL DEFAULT 'OPEN',
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_reports_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE,
  CONSTRAINT "job_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "job_reports_jobId_idx" ON "job_reports"("jobId");
CREATE INDEX IF NOT EXISTS "job_reports_reporterId_idx" ON "job_reports"("reporterId");
CREATE INDEX IF NOT EXISTS "job_reports_status_idx" ON "job_reports"("status");
