-- Migration: Add missing columns (ALREADY EXECUTED 2026-03-11)
-- This file is a record of what was added.

-- omContact
ALTER TABLE "omContact" ADD COLUMN IF NOT EXISTS "omContactTags" jsonb DEFAULT '[]';

-- salesAccount
ALTER TABLE "salesAccount" ADD COLUMN IF NOT EXISTS "crmAccountAnnualRevenue" numeric DEFAULT 0;
ALTER TABLE "salesAccount" ADD COLUMN IF NOT EXISTS "crmAccountEmployees" integer;
ALTER TABLE "salesAccount" ADD COLUMN IF NOT EXISTS "crmAccountNo" text;
ALTER TABLE "salesAccount" ADD COLUMN IF NOT EXISTS "crmAccountNotes" text;

-- salesActivity
ALTER TABLE "salesActivity" ADD COLUMN IF NOT EXISTS "crmActivityAssignedTo" text;
ALTER TABLE "salesActivity" ADD COLUMN IF NOT EXISTS "crmActivityCompletedAt" timestamptz;
ALTER TABLE "salesActivity" ADD COLUMN IF NOT EXISTS "crmActivityDescription" text;
ALTER TABLE "salesActivity" ADD COLUMN IF NOT EXISTS "crmActivityPriority" text DEFAULT 'medium';

-- salesContact
ALTER TABLE "salesContact" ADD COLUMN IF NOT EXISTS "crmContactAddress" text;
ALTER TABLE "salesContact" ADD COLUMN IF NOT EXISTS "crmContactName" text;
ALTER TABLE "salesContact" ADD COLUMN IF NOT EXISTS "crmContactNo" text;
ALTER TABLE "salesContact" ADD COLUMN IF NOT EXISTS "crmContactTags" jsonb DEFAULT '[]';

-- salesOpportunity
ALTER TABLE "salesOpportunity" ADD COLUMN IF NOT EXISTS "crmOpportunityLostReason" text;
ALTER TABLE "salesOpportunity" ADD COLUMN IF NOT EXISTS "crmOpportunityNo" text;

-- salesOrder
ALTER TABLE "salesOrder" ADD COLUMN IF NOT EXISTS "crmOrderDeliveryDate" date;

-- salesQuotation
ALTER TABLE "salesQuotation" ADD COLUMN IF NOT EXISTS "crmQuotationTerms" text;
ALTER TABLE "salesQuotation" ADD COLUMN IF NOT EXISTS "crmQuotationValidUntil" date;

-- tmsDeliveryPlanItem
ALTER TABLE "tmsDeliveryPlanItem" ADD COLUMN IF NOT EXISTS "tmsDeliveryPlanItemCustomerPhone" text;

-- itAsset
ALTER TABLE "itAsset" ADD COLUMN IF NOT EXISTS "itAssetLocation" text;
ALTER TABLE "itAsset" ADD COLUMN IF NOT EXISTS "itAssetNotes" text;

-- itDevRequest
ALTER TABLE "itDevRequest" ADD COLUMN IF NOT EXISTS "itDevRequestPriority" text DEFAULT 'medium';
ALTER TABLE "itDevRequest" ADD COLUMN IF NOT EXISTS "itDevRequestStartDate" date;
ALTER TABLE "itDevRequest" ADD COLUMN IF NOT EXISTS "itDevRequestNotes" text;

-- itNetworkDevice
ALTER TABLE "itNetworkDevice" ADD COLUMN IF NOT EXISTS "itNetworkDeviceMacAddress" text;
ALTER TABLE "itNetworkDevice" ADD COLUMN IF NOT EXISTS "itNetworkDeviceManufacturer" text;
ALTER TABLE "itNetworkDevice" ADD COLUMN IF NOT EXISTS "itNetworkDeviceModel" text;
ALTER TABLE "itNetworkDevice" ADD COLUMN IF NOT EXISTS "itNetworkDeviceNotes" text;

-- itSecurityIncident
ALTER TABLE "itSecurityIncident" ADD COLUMN IF NOT EXISTS "itSecurityIncidentType" text;
ALTER TABLE "itSecurityIncident" ADD COLUMN IF NOT EXISTS "itSecurityIncidentDescription" text;
ALTER TABLE "itSecurityIncident" ADD COLUMN IF NOT EXISTS "itSecurityIncidentResolution" text;

-- itSoftware
ALTER TABLE "itSoftware" ADD COLUMN IF NOT EXISTS "itSoftwareVersion" text;
ALTER TABLE "itSoftware" ADD COLUMN IF NOT EXISTS "itSoftwareLicenseCount" integer DEFAULT 0;
ALTER TABLE "itSoftware" ADD COLUMN IF NOT EXISTS "itSoftwareUsedCount" integer DEFAULT 0;
ALTER TABLE "itSoftware" ADD COLUMN IF NOT EXISTS "itSoftwareNotes" text;

-- itSystemAccess
ALTER TABLE "itSystemAccess" ADD COLUMN IF NOT EXISTS "itSystemAccessType" text;
ALTER TABLE "itSystemAccess" ADD COLUMN IF NOT EXISTS "itSystemAccessApprovedBy" text;
ALTER TABLE "itSystemAccess" ADD COLUMN IF NOT EXISTS "itSystemAccessNotes" text;
