-- Rename CRM tables to Sales tables
-- Run this in Supabase SQL Editor

BEGIN;

ALTER TABLE "crmAccount" RENAME TO "salesAccount";
ALTER TABLE "crmContact" RENAME TO "salesContact";
ALTER TABLE "crmLead" RENAME TO "salesLead";
ALTER TABLE "crmOpportunity" RENAME TO "salesOpportunity";
ALTER TABLE "crmActivity" RENAME TO "salesActivity";
ALTER TABLE "crmQuotation" RENAME TO "salesQuotation";
ALTER TABLE "crmQuotationLine" RENAME TO "salesQuotationLine";
ALTER TABLE "crmOrder" RENAME TO "salesOrder";
ALTER TABLE "crmPipelineStage" RENAME TO "salesPipelineStage";

COMMIT;
