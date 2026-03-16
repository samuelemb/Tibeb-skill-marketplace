-- Create reviews table (if missing) for ratings and feedback
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

CREATE INDEX IF NOT EXISTS "reviews_jobId_idx" ON "reviews"("jobId");
CREATE INDEX IF NOT EXISTS "reviews_reviewerId_idx" ON "reviews"("reviewerId");
CREATE INDEX IF NOT EXISTS "reviews_revieweeId_idx" ON "reviews"("revieweeId");
CREATE INDEX IF NOT EXISTS "reviews_rating_idx" ON "reviews"("rating");
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_jobId_reviewerId_key" ON "reviews"("jobId", "reviewerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_jobId_fkey'
  ) THEN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_jobId_fkey"
      FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_reviewerId_fkey'
  ) THEN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewerId_fkey"
      FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_revieweeId_fkey'
  ) THEN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_revieweeId_fkey"
      FOREIGN KEY ("revieweeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
