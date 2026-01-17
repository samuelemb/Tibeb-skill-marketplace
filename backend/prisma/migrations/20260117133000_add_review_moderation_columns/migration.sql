-- Add moderation fields to reviews table (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'reviews'
  ) THEN
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "hiddenReason" TEXT;
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "hiddenAt" TIMESTAMP(3);
  END IF;
END $$;
