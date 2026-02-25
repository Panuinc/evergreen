-- เพิ่ม dimension name columns
ALTER TABLE "bcProductionOrders" ADD COLUMN IF NOT EXISTS "dimension1Name" text;
ALTER TABLE "bcProductionOrders" ADD COLUMN IF NOT EXISTS "dimension2Name" text;

ALTER TABLE "bcItemLedgerEntries" ADD COLUMN IF NOT EXISTS "globalDimension1Name" text;
ALTER TABLE "bcItemLedgerEntries" ADD COLUMN IF NOT EXISTS "globalDimension2Name" text;
