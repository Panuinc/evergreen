-- ========================================
-- bcProduction
-- รวม productionOrder + ItemLedgerEntries จาก BC Production OData
-- เชื่อมโดย productionOrder.No = ItemLedgerEntries.Document_No
-- Grain: 1 row = 1 ItemLedgerEntry enriched ด้วย Production Order header
-- ========================================
CREATE TABLE "bcProduction" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Production Order Header (denormalized) ──
  "orderStatus" text,
  "orderNo" text,
  "orderDescription" text,
  "orderDescription2" text,
  "sourceNo" text,
  "routingNo" text,
  "orderQuantity" numeric DEFAULT 0,
  "dimension1Code" text,
  "dimension2Code" text,
  "orderLocationCode" text,
  "startingDateTime" timestamptz,
  "endingDateTime" timestamptz,
  "dueDate" date,
  "remainingConsumption" numeric DEFAULT 0,
  "assignedUserId" text,
  "finishedDate" date,
  "searchDescription" text,

  -- ── Item Ledger Entry Detail ──
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
  "globalDimension2Code" text,
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

ALTER TABLE "bcProduction" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read" ON "bcProduction" FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_bc_prod_order_no ON "bcProduction" ("orderNo");
CREATE INDEX idx_bc_prod_document_no ON "bcProduction" ("documentNo");
CREATE INDEX idx_bc_prod_entry_type ON "bcProduction" ("entryType");
CREATE INDEX idx_bc_prod_posting_date ON "bcProduction" ("postingDate");
CREATE INDEX idx_bc_prod_item_no ON "bcProduction" ("itemNo");
CREATE INDEX idx_bc_prod_location_code ON "bcProduction" ("locationCode");
CREATE INDEX idx_bc_prod_order_status ON "bcProduction" ("orderStatus");
CREATE INDEX idx_bc_prod_due_date ON "bcProduction" ("dueDate");
