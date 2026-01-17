-- Create a generated column for full-text search vector
-- This combines title and description for efficient searching
ALTER TABLE "jobs" 
ADD COLUMN IF NOT EXISTS "search_vector" tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("description", '')), 'B')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "jobs_search_vector_idx" 
ON "jobs" 
USING GIN ("search_vector");

-- Create index for budget range searches (if needed)
CREATE INDEX IF NOT EXISTS "jobs_budget_idx" 
ON "jobs" ("budget") 
WHERE "budget" IS NOT NULL;

-- Create composite index for common filter combinations
CREATE INDEX IF NOT EXISTS "jobs_status_created_idx" 
ON "jobs" ("status", "createdAt" DESC);

