-- BC Cache Tables
-- รันใน Supabase Dashboard → SQL Editor
-- Cache ข้อมูลจาก Business Central OData API เพื่อความเร็วในการแสดงผล
-- Sync ทุก 1 ชม. ผ่าน Vercel Cron Job (GET /api/sync/bc)

-- ========================================
-- bcCustomers
-- ========================================
CREATE TABLE "bcCustomers" (
  id text PRIMARY KEY,
  number text NOT NULL,
  "displayName" text,
  "phoneNumber" text,
  contact text,
  "balanceDue" numeric DEFAULT 0,
  balance numeric DEFAULT 0,
  "salespersonCode" text,
  "syncedAt" timestamptz DEFAULT now()
);

ALTER TABLE "bcCustomers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read" ON "bcCustomers" FOR SELECT TO authenticated USING (true);

-- ========================================
-- bcItems
-- ========================================
CREATE TABLE "bcItems" (
  id text PRIMARY KEY,
  number text NOT NULL,
  "displayName" text,
  type text,
  inventory numeric DEFAULT 0,
  "unitPrice" numeric DEFAULT 0,
  "unitCost" numeric DEFAULT 0,
  "itemCategoryCode" text,
  "generalProductPostingGroupCode" text,
  blocked boolean DEFAULT false,
  "baseUnitOfMeasure" text,
  "syncedAt" timestamptz DEFAULT now()
);

ALTER TABLE "bcItems" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read" ON "bcItems" FOR SELECT TO authenticated USING (true);

-- ========================================
-- bcSalesOrders
-- ========================================
CREATE TABLE "bcSalesOrders" (
  id text PRIMARY KEY,
  number text NOT NULL,
  "customerNumber" text,
  "customerName" text,
  "orderDate" date,
  "dueDate" date,
  status text,
  "completelyShipped" boolean DEFAULT false,
  "salespersonCode" text,
  "externalDocumentNumber" text,
  "totalAmountIncludingTax" numeric DEFAULT 0,
  "syncedAt" timestamptz DEFAULT now()
);

ALTER TABLE "bcSalesOrders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read" ON "bcSalesOrders" FOR SELECT TO authenticated USING (true);

-- ========================================
-- bcSalesOrderLines
-- ========================================
CREATE TABLE "bcSalesOrderLines" (
  id text PRIMARY KEY,
  "documentNo" text NOT NULL,
  "lineObjectNumber" text,
  description text,
  quantity numeric DEFAULT 0,
  "unitPrice" numeric DEFAULT 0,
  "amountIncludingTax" numeric DEFAULT 0,
  "quantityShipped" numeric DEFAULT 0,
  "unitOfMeasureCode" text,
  "syncedAt" timestamptz DEFAULT now()
);

ALTER TABLE "bcSalesOrderLines" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read" ON "bcSalesOrderLines" FOR SELECT TO authenticated USING (true);
