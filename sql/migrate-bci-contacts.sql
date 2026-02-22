-- Add contact columns to bciProjects (flat storage from CONTACT array)
-- Run this in Supabase SQL Editor

ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "ownerCompany" TEXT;
ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "ownerContact" TEXT;
ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "ownerPhone" TEXT;
ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "ownerEmail" TEXT;
ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "architectCompany" TEXT;
ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "architectContact" TEXT;
ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "architectPhone" TEXT;
ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "architectEmail" TEXT;
ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "contractorCompany" TEXT;
ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "contractorContact" TEXT;
ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "contractorPhone" TEXT;
ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "contractorEmail" TEXT;
ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "pmCompany" TEXT;
ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "pmContact" TEXT;
ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "pmPhone" TEXT;
ALTER TABLE "bciProjects" ADD COLUMN IF NOT EXISTS "pmEmail" TEXT;
