-- ========================================
-- v2: แยกเป็น 2 ตาราง (แทน bcProduction ตารางเดียว)
-- ========================================

-- ── Drop old combined table ──
DROP POLICY IF EXISTS "auth read" ON "bcProduction";
DROP TABLE IF EXISTS "bcProduction";

-- ========================================
-- 1. bcProductionOrders — ใบสั่งผลิต
-- PK: id = No (เลขที่ใบสั่งผลิต)
-- ========================================
CREATE TABLE "bcProductionOrders" (
  id text PRIMARY KEY,
  status text,
  description text,
  "description2" text,
  "sourceNo" text,
  "routingNo" text,
  quantity numeric DEFAULT 0,
  "dimension1Code" text,
  "dimension1Name" text,
  "dimension2Code" text,
  "dimension2Name" text,
  "locationCode" text,
  "startingDateTime" timestamptz,
  "endingDateTime" timestamptz,
  "dueDate" date,
  "remainingConsumption" numeric DEFAULT 0,
  "assignedUserId" text,
  "finishedDate" date,
  "searchDescription" text,
  "syncedAt" timestamptz DEFAULT now()
);

ALTER TABLE "bcProductionOrders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read" ON "bcProductionOrders" FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_bc_po_status ON "bcProductionOrders" (status);
CREATE INDEX idx_bc_po_due_date ON "bcProductionOrders" ("dueDate");
CREATE INDEX idx_bc_po_dimension1 ON "bcProductionOrders" ("dimension1Code");
CREATE INDEX idx_bc_po_dimension2 ON "bcProductionOrders" ("dimension2Code");
CREATE INDEX idx_bc_po_source_no ON "bcProductionOrders" ("sourceNo");

-- ========================================
-- 2. bcItemLedgerEntries — รายการเคลื่อนไหว
-- PK: id = Entry_No (as text)
-- เชื่อมกับ bcProductionOrders ผ่าน documentNo = id
-- ========================================
CREATE TABLE "bcItemLedgerEntries" (
  id text PRIMARY KEY,
  "entryNo" integer NOT NULL UNIQUE,
  "postingDate" date,
  "documentDate" date,
  "entryType" text,
  "documentType" text,
  "documentNo" text,
  "itemNo" text,
  "itemDescription" text,
  "employeeCode" text,
  "employeeName" text,
  "description2" text,
  "locationCode" text,
  "lotNo" text,
  "serialNo" text,
  "expirationDate" date,
  quantity numeric DEFAULT 0,
  "unitOfMeasureCode" text,
  "remainingQuantity" numeric DEFAULT 0,
  "invoicedQuantity" numeric DEFAULT 0,
  "completelyInvoiced" boolean DEFAULT false,
  "unitCostExpected" numeric DEFAULT 0,
  "costAmountExpected" numeric DEFAULT 0,
  "unitCostActual" numeric DEFAULT 0,
  "costAmountActual" numeric DEFAULT 0,
  "salesAmountExpected" numeric DEFAULT 0,
  "salesAmountActual" numeric DEFAULT 0,
  open boolean DEFAULT false,
  "globalDimension1Code" text,
  "globalDimension1Name" text,
  "globalDimension2Code" text,
  "globalDimension2Name" text,
  "orderType" text,
  "orderLineNo" integer DEFAULT 0,
  "documentLineNo" integer DEFAULT 0,
  "variantCode" text,
  "binCode" text,
  "baseUnitOfMeasure" text,
  "totalGrossWeight" numeric DEFAULT 0,
  "totalNetWeight" numeric DEFAULT 0,
  "createdBy" text,
  "syncedAt" timestamptz DEFAULT now()
);

ALTER TABLE "bcItemLedgerEntries" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read" ON "bcItemLedgerEntries" FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_bc_ile_document_no ON "bcItemLedgerEntries" ("documentNo");
CREATE INDEX idx_bc_ile_entry_type ON "bcItemLedgerEntries" ("entryType");
CREATE INDEX idx_bc_ile_posting_date ON "bcItemLedgerEntries" ("postingDate");
CREATE INDEX idx_bc_ile_item_no ON "bcItemLedgerEntries" ("itemNo");
CREATE INDEX idx_bc_ile_location_code ON "bcItemLedgerEntries" ("locationCode");
