-- ========================================
-- bcItemLedgerEntries
-- Cache ข้อมูล Item Ledger Entries จาก BC OData API
-- ========================================
CREATE TABLE "bcItemLedgerEntries" (
  id text PRIMARY KEY,                          -- Entry_No as text
  "entryNo" integer NOT NULL,
  "postingDate" date,
  "documentDate" date,
  "entryType" text,
  "documentType" text,
  "documentNo" text,
  "itemNo" text,
  description text,
  "locationCode" text,
  "lotNo" text,
  "serialNo" text,
  "expirationDate" date,
  quantity numeric DEFAULT 0,
  "unitOfMeasureCode" text,
  "remainingQuantity" numeric DEFAULT 0,
  "invoicedQuantity" numeric DEFAULT 0,
  "completelyInvoiced" boolean DEFAULT false,
  "costAmountExpected" numeric DEFAULT 0,
  "costAmountActual" numeric DEFAULT 0,
  "salesAmountExpected" numeric DEFAULT 0,
  "salesAmountActual" numeric DEFAULT 0,
  open boolean DEFAULT false,
  "globalDimension1Code" text,
  "globalDimension2Code" text,
  "orderType" text,
  "orderNo" text,
  "orderLineNo" integer DEFAULT 0,
  "itemDescription" text,
  "variantCode" text,
  "returnReasonCode" text,
  "binCode" text,
  "baseUnitOfMeasure" text,
  "sourceType" text,
  "sourceNo" text,
  "sourceDescription" text,
  "createdBy" text,
  "syncedAt" timestamptz DEFAULT now()
);

ALTER TABLE "bcItemLedgerEntries" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read" ON "bcItemLedgerEntries" FOR SELECT TO authenticated USING (true);

-- Indexes for common queries
CREATE INDEX idx_bc_ile_item_no ON "bcItemLedgerEntries" ("itemNo");
CREATE INDEX idx_bc_ile_posting_date ON "bcItemLedgerEntries" ("postingDate");
CREATE INDEX idx_bc_ile_document_no ON "bcItemLedgerEntries" ("documentNo");
CREATE INDEX idx_bc_ile_entry_type ON "bcItemLedgerEntries" ("entryType");
CREATE INDEX idx_bc_ile_location_code ON "bcItemLedgerEntries" ("locationCode");
CREATE INDEX idx_bc_ile_order_no ON "bcItemLedgerEntries" ("orderNo");
