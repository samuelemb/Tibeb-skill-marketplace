-- Add composite indexes for job search
-- Guard against category column not existing yet in migration order.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'category'
  ) THEN
    CREATE INDEX IF NOT EXISTS "jobs_status_category_createdAt_idx"
      ON "jobs"("status", "category", "createdAt");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "jobs_status_budget_idx"
  ON "jobs"("status", "budget");
