-- RFID Safety: unique constraint + partial index on bcItemRfidCode
-- Run in Supabase SQL Editor BEFORE deploying code changes

BEGIN;

-- Add UNIQUE constraint (only non-null values, allows multiple nulls)
CREATE UNIQUE INDEX IF NOT EXISTS "bcItem_rfidCode_unique"
  ON "bcItem" ("bcItemRfidCode")
  WHERE "bcItemRfidCode" IS NOT NULL;

COMMIT;
