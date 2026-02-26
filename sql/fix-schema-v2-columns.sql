-- ============================================================
-- Fix Schema V2 — Rename inconsistent columns
-- Run AFTER create-schema-v2.sql
-- ============================================================

-- bcSalesOrder: "bcSalesOrderOrderDate" → "bcSalesOrderDate"
ALTER TABLE "bcSalesOrder" RENAME COLUMN "bcSalesOrderOrderDate" TO "bcSalesOrderDate";

-- bcSalesOrder: "bcSalesOrderTotalAmountIncludingTax" → "bcSalesOrderTotalAmountIncVat"
ALTER TABLE "bcSalesOrder" RENAME COLUMN "bcSalesOrderTotalAmountIncludingTax" TO "bcSalesOrderTotalAmountIncVat";

-- bcSalesOrderLine: "bcSalesOrderLineLineNo" → "bcSalesOrderLineNo"
ALTER TABLE "bcSalesOrderLine" RENAME COLUMN "bcSalesOrderLineLineNo" TO "bcSalesOrderLineNo";

-- bcSalesOrderLine: "bcSalesOrderLineAmountIncludingTax" → "bcSalesOrderLineAmount"
ALTER TABLE "bcSalesOrderLine" RENAME COLUMN "bcSalesOrderLineAmountIncludingTax" TO "bcSalesOrderLineAmount";

-- bcItemLedgerEntry: "bcItemLedgerEntryExternalId" → "bcItemLedgerEntryExternalNo" (was integer PK entryNo)
ALTER TABLE "bcItemLedgerEntry" RENAME COLUMN "bcItemLedgerEntryExternalId" TO "bcItemLedgerEntryExternalNo";
ALTER TABLE "bcItemLedgerEntry" ALTER COLUMN "bcItemLedgerEntryExternalNo" TYPE integer USING "bcItemLedgerEntryExternalNo"::integer;

-- bcItemLedgerEntry: "bcItemLedgerEntryEntryType" → "bcItemLedgerEntryType" is correct in schema, keep as-is

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- Done! 5 columns renamed.
-- ============================================================
