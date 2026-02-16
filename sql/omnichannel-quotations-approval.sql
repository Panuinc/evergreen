-- Quotation Approval Workflow Migration
-- Run this in Supabase SQL Editor

ALTER TABLE "omQuotations" ADD COLUMN IF NOT EXISTS "quotationSubmittedBy" uuid;
ALTER TABLE "omQuotations" ADD COLUMN IF NOT EXISTS "quotationApprovedBy" uuid;
ALTER TABLE "omQuotations" ADD COLUMN IF NOT EXISTS "quotationApprovalNote" text;
