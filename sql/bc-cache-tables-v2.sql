-- BC Cache Tables v2 — เพิ่ม fields สำหรับ analytics และ order detail
-- รันใน Supabase Dashboard → SQL Editor

ALTER TABLE "bcSalesOrders"
  ADD COLUMN IF NOT EXISTS "sellToAddress" text,
  ADD COLUMN IF NOT EXISTS "sellToCity" text,
  ADD COLUMN IF NOT EXISTS "sellToPostCode" text,
  ADD COLUMN IF NOT EXISTS "shipToName" text,
  ADD COLUMN IF NOT EXISTS "shipToAddress" text,
  ADD COLUMN IF NOT EXISTS "shipToCity" text,
  ADD COLUMN IF NOT EXISTS "shipToPostCode" text;

ALTER TABLE "bcSalesOrderLines"
  ADD COLUMN IF NOT EXISTS "lineNo" integer,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS "bwkOutstandingQuantity" numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "locationCode" text;
