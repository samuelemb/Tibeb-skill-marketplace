-- Create enums for client setup
CREATE TYPE "public"."ClientFocus" AS ENUM ('LONG_TERM_CONTRACTS', 'ONE_TIME_TASKS', 'CONSULTANCY');
CREATE TYPE "public"."ClientIndustry" AS ENUM ('ECOMMERCE', 'HEALTHCARE', 'EDUCATION', 'FINTECH', 'REAL_ESTATE', 'ENTERTAINMENT');

-- Add client setup fields to users
ALTER TABLE "public"."users"
  ADD COLUMN "clientCompanyName" TEXT,
  ADD COLUMN "clientPhone" TEXT,
  ADD COLUMN "clientWebsite" TEXT,
  ADD COLUMN "clientFocus" "public"."ClientFocus",
  ADD COLUMN "clientSetupCompleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "clientSetupCompletedAt" TIMESTAMP(3);

-- Create client industry preferences table
CREATE TABLE "public"."client_industry_preferences" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "industry" "public"."ClientIndustry" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_industry_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_industry_preferences_userId_industry_key"
  ON "public"."client_industry_preferences"("userId", "industry");

CREATE INDEX "client_industry_preferences_userId_idx"
  ON "public"."client_industry_preferences"("userId");

ALTER TABLE "public"."client_industry_preferences"
  ADD CONSTRAINT "client_industry_preferences_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
