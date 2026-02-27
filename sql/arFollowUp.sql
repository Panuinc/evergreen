-- ระบบติดตามลูกหนี้ (AR Collections Tracking)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "arFollowUp" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "customerNumber" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "invoiceNumber" TEXT,
  "contactDate" DATE NOT NULL DEFAULT CURRENT_DATE,
  "contactMethod" TEXT NOT NULL DEFAULT 'phone',
  "reason" TEXT NOT NULL,
  "reasonDetail" TEXT,
  "note" TEXT,
  "promiseDate" DATE,
  "promiseAmount" NUMERIC(15,2),
  "status" TEXT NOT NULL DEFAULT 'pending',
  "nextFollowUpDate" DATE,
  "assignedTo" TEXT,
  "createdBy" UUID NOT NULL,
  "createdByName" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ar_follow_up_customer ON "arFollowUp" ("customerNumber");
CREATE INDEX IF NOT EXISTS idx_ar_follow_up_status ON "arFollowUp" ("status");
CREATE INDEX IF NOT EXISTS idx_ar_follow_up_contact_date ON "arFollowUp" ("contactDate" DESC);
CREATE INDEX IF NOT EXISTS idx_ar_follow_up_next ON "arFollowUp" ("nextFollowUpDate");
