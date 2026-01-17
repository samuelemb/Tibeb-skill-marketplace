-- Migration: Add Full-Text Search Support for Jobs
-- This migration adds GIN indexes for full-text search on job title and description

-- Create a function to generate search vectors (if not exists)
CREATE OR REPLACE FUNCTION jobs_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the search_vector column with concatenated title and description
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add search_vector column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create trigger to automatically update search_vector
DROP TRIGGER IF EXISTS jobs_search_vector_trigger ON jobs;
CREATE TRIGGER jobs_search_vector_trigger
  BEFORE INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION jobs_search_vector_update();

-- Update existing rows
UPDATE jobs SET 
  search_vector = 
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B')
WHERE search_vector IS NULL;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS jobs_search_vector_idx ON jobs USING GIN(search_vector);

-- Create index for status filtering (if not exists)
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status) WHERE status = 'OPEN';

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS jobs_status_created_idx ON jobs(status, "createdAt" DESC);
