-- Create enums for freelancer setup
CREATE TYPE "public"."ExperienceLevel" AS ENUM ('ENTRY', 'INTERMEDIATE', 'EXPERT');
CREATE TYPE "public"."Availability" AS ENUM ('FULL_TIME', 'PART_TIME', 'AS_NEEDED');

-- Add setup fields to users
ALTER TABLE "public"."users"
  ADD COLUMN "experienceLevel" "public"."ExperienceLevel",
  ADD COLUMN "availability" "public"."Availability",
  ADD COLUMN "profileSetupCompleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "profileSetupCompletedAt" TIMESTAMP(3);

-- Create external links table
CREATE TABLE "public"."freelancer_external_links" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "freelancer_external_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "freelancer_external_links_userId_idx"
  ON "public"."freelancer_external_links"("userId");

ALTER TABLE "public"."freelancer_external_links"
  ADD CONSTRAINT "freelancer_external_links_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
