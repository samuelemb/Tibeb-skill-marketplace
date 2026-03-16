ALTER TABLE "public"."escrow_disputes"
ADD COLUMN     "details" TEXT,
ADD COLUMN     "evidenceUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
