-- Add projectCode + projectName to bcItems and bcSalesOrderLines
-- รันใน Supabase Dashboard → SQL Editor

-- bcItems: เพิ่ม project columns
ALTER TABLE "bcItems"
  ADD COLUMN IF NOT EXISTS "projectCode" text,
  ADD COLUMN IF NOT EXISTS "projectName" text;

-- bcSalesOrderLines: เพิ่ม project columns
ALTER TABLE "bcSalesOrderLines"
  ADD COLUMN IF NOT EXISTS "projectCode" text,
  ADD COLUMN IF NOT EXISTS "projectName" text;

-- Index สำหรับ filter ตาม project
CREATE INDEX IF NOT EXISTS idx_bcitems_project ON "bcItems"("projectCode");
CREATE INDEX IF NOT EXISTS idx_bcsalesorderlines_project ON "bcSalesOrderLines"("projectCode");
