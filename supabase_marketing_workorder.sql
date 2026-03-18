-- ─── Marketing Work Order Tables ─────────────────────────────────────────────

-- Main work order table
CREATE TABLE IF NOT EXISTS "mktWorkOrder" (
  "id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "mktWorkOrderNo" text NOT NULL UNIQUE,
  "mktWorkOrderTitle" text NOT NULL,
  "mktWorkOrderDescription" text,
  "mktWorkOrderType" text,
  "mktWorkOrderRequestedBy" text,
  "mktWorkOrderRequestedDepartment" text,
  "mktWorkOrderAssignedTo" text,
  "mktWorkOrderPriority" text DEFAULT 'medium',
  "mktWorkOrderStatus" text DEFAULT 'pending',
  "mktWorkOrderProgress" integer DEFAULT 0,
  "mktWorkOrderStartDate" date,
  "mktWorkOrderDueDate" date,
  "mktWorkOrderCompletedAt" timestamptz,
  "mktWorkOrderNotes" text,
  "mktWorkOrderCreatedAt" timestamptz DEFAULT now(),
  "isActive" boolean DEFAULT true
);

-- Progress log table
CREATE TABLE IF NOT EXISTS "mktWorkOrderProgressLog" (
  "id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "mktWorkOrderProgressLogWorkOrderId" bigint REFERENCES "mktWorkOrder"("id"),
  "mktWorkOrderProgressLogDescription" text NOT NULL,
  "mktWorkOrderProgressLogProgress" integer NOT NULL,
  "mktWorkOrderProgressLogCreatedBy" text,
  "mktWorkOrderProgressLogCreatedAt" timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_mktWorkOrder_status" ON "mktWorkOrder" ("mktWorkOrderStatus");
CREATE INDEX IF NOT EXISTS "idx_mktWorkOrder_isActive" ON "mktWorkOrder" ("isActive");
CREATE INDEX IF NOT EXISTS "idx_mktWorkOrder_createdAt" ON "mktWorkOrder" ("mktWorkOrderCreatedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_mktWorkOrderProgressLog_workOrderId" ON "mktWorkOrderProgressLog" ("mktWorkOrderProgressLogWorkOrderId");

-- RLS policies
ALTER TABLE "mktWorkOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mktWorkOrderProgressLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON "mktWorkOrder"
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON "mktWorkOrderProgressLog"
  FOR ALL USING (auth.role() = 'authenticated');

-- Auto-generate work order number function
CREATE OR REPLACE FUNCTION generate_mkt_work_order_no()
RETURNS TRIGGER AS $$
DECLARE
  year_month text;
  seq_num integer;
  new_no text;
BEGIN
  year_month := to_char(now(), 'YYYYMM');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING("mktWorkOrderNo" FROM '\d+$') AS integer)
  ), 0) + 1
  INTO seq_num
  FROM "mktWorkOrder"
  WHERE "mktWorkOrderNo" LIKE 'MKT-WO-' || year_month || '-%';

  new_no := 'MKT-WO-' || year_month || '-' || LPAD(seq_num::text, 3, '0');
  NEW."mktWorkOrderNo" := new_no;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_mkt_work_order_no
  BEFORE INSERT ON "mktWorkOrder"
  FOR EACH ROW
  WHEN (NEW."mktWorkOrderNo" IS NULL OR NEW."mktWorkOrderNo" = '')
  EXECUTE FUNCTION generate_mkt_work_order_no();
