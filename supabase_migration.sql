-- =============================================================================
-- BC Sync Migration — Full Reset
-- =============================================================================
-- This migration drops ALL existing BC sync tables and recreates them
-- for syncing data from Business Central custom API to Supabase.
--
-- Naming conventions:
--   Table:  "bc{Entity}"         e.g. "bcCustomer"
--   Column: "bc{Entity}{Field}"  e.g. "bcCustomerNo"
--
-- Every table has:
--   - id: bigint generated always as identity (Supabase PK)
--   - "bcSyncedAt": timestamptz for sync tracking
--   - UNIQUE constraint on BC primary key(s) for upsert onConflict
--
-- Generated: 2026-03-17
-- =============================================================================

BEGIN;

-- =============================================================================
-- DROP ALL EXISTING BC TABLES (CASCADE)
-- =============================================================================

DROP TABLE IF EXISTS "bcCustomer" CASCADE;
DROP TABLE IF EXISTS "bcVendor" CASCADE;
DROP TABLE IF EXISTS "bcItem" CASCADE;
DROP TABLE IF EXISTS "bcGLAccount" CASCADE;
DROP TABLE IF EXISTS "bcBankAccount" CASCADE;
DROP TABLE IF EXISTS "bcFixedAsset" CASCADE;
DROP TABLE IF EXISTS "bcDimensionSetEntry" CASCADE;
DROP TABLE IF EXISTS "bcSalesQuote" CASCADE;
DROP TABLE IF EXISTS "bcSalesOrder" CASCADE;
DROP TABLE IF EXISTS "bcSalesOrderLine" CASCADE;
DROP TABLE IF EXISTS "bcSalesInvoice" CASCADE;
DROP TABLE IF EXISTS "bcSalesInvoiceLine" CASCADE;
DROP TABLE IF EXISTS "bcPostedSalesInvoice" CASCADE;
DROP TABLE IF EXISTS "bcPostedSalesInvoiceLine" CASCADE;
DROP TABLE IF EXISTS "bcPostedSalesShipment" CASCADE;
DROP TABLE IF EXISTS "bcPostedSalesShipmentLine" CASCADE;
DROP TABLE IF EXISTS "bcPostedSalesCreditMemo" CASCADE;
DROP TABLE IF EXISTS "bcPostedSalesCreditMemoLine" CASCADE;
DROP TABLE IF EXISTS "bcPurchaseOrder" CASCADE;
DROP TABLE IF EXISTS "bcPurchaseOrderLine" CASCADE;
DROP TABLE IF EXISTS "bcPostedPurchInvoice" CASCADE;
DROP TABLE IF EXISTS "bcPostedPurchInvoiceLine" CASCADE;
DROP TABLE IF EXISTS "bcProductionOrder" CASCADE;
DROP TABLE IF EXISTS "bcProductionOrderLine" CASCADE;
DROP TABLE IF EXISTS "bcItemLedgerEntry" CASCADE;
DROP TABLE IF EXISTS "bcValueEntry" CASCADE;
DROP TABLE IF EXISTS "bcGLEntry" CASCADE;
DROP TABLE IF EXISTS "bcCustomerLedgerEntry" CASCADE;
DROP TABLE IF EXISTS "bcVendorLedgerEntry" CASCADE;
DROP TABLE IF EXISTS "bcDetailedCustLedgerEntry" CASCADE;
DROP TABLE IF EXISTS "bcDetailedVendorLedgerEntry" CASCADE;
DROP TABLE IF EXISTS "bcBankAccountLedgerEntry" CASCADE;
DROP TABLE IF EXISTS "bcFALedgerEntry" CASCADE;


-- =============================================================================
-- MASTER DATA
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. bcCustomer
-- -----------------------------------------------------------------------------
CREATE TABLE "bcCustomer" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcCustomerNo" text NOT NULL,
  "bcCustomerNameValue" text,
  "bcCustomerAddress" text,
  "bcCustomerAddress2" text,
  "bcCustomerCity" text,
  "bcCustomerPostCode" text,
  "bcCustomerContact" text,
  "bcCustomerPhoneNo" text,
  "bcCustomerEMail" text,
  "bcCustomerMobilePhoneNo" text,
  "bcCustomerSalespersonCode" text,
  "bcCustomerCustomerPostingGroup" text,
  "bcCustomerPaymentTermsCode" text,
  "bcCustomerPaymentMethodCode" text,
  "bcCustomerGlobalDimension1Code" text,
  "bcCustomerGlobalDimension2Code" text,
  "bcCustomerCreditLimitLCY" numeric,
  "bcCustomerBalanceLCY" numeric,
  "bcCustomerBalanceDueLCY" numeric,
  "bcCustomerOutstandingOrders" numeric,
  "bcCustomerShippedNotInvoiced" numeric,
  "bcCustomerOutstandingInvoices" numeric,
  "bcCustomerBlocked" text,
  "bcCustomerVATRegistrationNo" text,
  "bcCustomerGenBusPostingGroup" text,
  "bcCustomerSalesLCY" numeric,
  "bcCustomerProfitLCY" numeric,
  "bcCustomerCountryRegionCode" text,
  "bcCustomerCreatedAt" timestamptz,
  "bcCustomerLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcCustomer_no_unique" UNIQUE ("bcCustomerNo")
);

-- -----------------------------------------------------------------------------
-- 2. bcVendor
-- -----------------------------------------------------------------------------
CREATE TABLE "bcVendor" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcVendorNo" text NOT NULL,
  "bcVendorNameValue" text,
  "bcVendorAddress" text,
  "bcVendorAddress2" text,
  "bcVendorCity" text,
  "bcVendorPostCode" text,
  "bcVendorContact" text,
  "bcVendorPhoneNo" text,
  "bcVendorEMail" text,
  "bcVendorMobilePhoneNo" text,
  "bcVendorVendorPostingGroup" text,
  "bcVendorPaymentTermsCode" text,
  "bcVendorPaymentMethodCode" text,
  "bcVendorPurchaserCode" text,
  "bcVendorGlobalDimension1Code" text,
  "bcVendorGlobalDimension2Code" text,
  "bcVendorBalanceLCY" numeric,
  "bcVendorBalanceDueLCY" numeric,
  "bcVendorVATRegistrationNo" text,
  "bcVendorGenBusPostingGroup" text,
  "bcVendorBlocked" text,
  "bcVendorCountryRegionCode" text,
  "bcVendorOutstandingOrders" numeric,
  "bcVendorOutstandingInvoices" numeric,
  "bcVendorPurchasesLCY" numeric,
  "bcVendorCreatedAt" timestamptz,
  "bcVendorLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcVendor_no_unique" UNIQUE ("bcVendorNo")
);

-- -----------------------------------------------------------------------------
-- 3. bcItem
-- -----------------------------------------------------------------------------
CREATE TABLE "bcItem" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcItemNo" text NOT NULL,
  "bcItemDescription" text,
  "bcItemDescription2" text,
  "bcItemType" text,
  "bcItemBlocked" text,
  "bcItemBaseUnitOfMeasure" text,
  "bcItemUnitPrice" numeric,
  "bcItemUnitCost" numeric,
  "bcItemStandardCost" numeric,
  "bcItemLastDirectCost" numeric,
  "bcItemCostingMethod" text,
  "bcItemGenProdPostingGroup" text,
  "bcItemInventoryPostingGroup" text,
  "bcItemItemCategoryCode" text,
  "bcItemInventory" numeric,
  "bcItemGlobalDimension1Code" text,
  "bcItemGlobalDimension2Code" text,
  "bcItemVendorNo" text,
  "bcItemGrossWeight" numeric,
  "bcItemNetWeight" numeric,
  "bcItemProductionBOMNo" text,
  "bcItemRfidCode" text,
  "bcItemCreatedAt" timestamptz,
  "bcItemLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcItem_no_unique" UNIQUE ("bcItemNo"),
  CONSTRAINT "bcItem_rfid_unique" UNIQUE ("bcItemRfidCode")
);

-- -----------------------------------------------------------------------------
-- 4. bcGLAccount
-- -----------------------------------------------------------------------------
CREATE TABLE "bcGLAccount" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcGLAccountNo" text NOT NULL,
  "bcGLAccountNameValue" text,
  "bcGLAccountAccountType" text,
  "bcGLAccountAccountCategory" text,
  "bcGLAccountIncomeBalance" text,
  "bcGLAccountDebitCredit" text,
  "bcGLAccountBalance" numeric,
  "bcGLAccountNetChange" numeric,
  "bcGLAccountBlocked" text,
  "bcGLAccountDirectPosting" boolean,
  "bcGLAccountIndentation" integer,
  "bcGLAccountTotaling" text,
  "bcGLAccountCreatedAt" timestamptz,
  "bcGLAccountLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcGLAccount_no_unique" UNIQUE ("bcGLAccountNo")
);

-- -----------------------------------------------------------------------------
-- 5. bcBankAccount
-- -----------------------------------------------------------------------------
CREATE TABLE "bcBankAccount" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcBankAccountNo" text NOT NULL,
  "bcBankAccountNameValue" text,
  "bcBankAccountBankAccountNo" text,
  "bcBankAccountBankBranchNo" text,
  "bcBankAccountCurrencyCode" text,
  "bcBankAccountBalance" numeric,
  "bcBankAccountBalanceLCY" numeric,
  "bcBankAccountIBAN" text,
  "bcBankAccountSWIFTCode" text,
  "bcBankAccountGlobalDimension1Code" text,
  "bcBankAccountGlobalDimension2Code" text,
  "bcBankAccountBlocked" text,
  "bcBankAccountCreatedAt" timestamptz,
  "bcBankAccountLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcBankAccount_no_unique" UNIQUE ("bcBankAccountNo")
);

-- -----------------------------------------------------------------------------
-- 6. bcFixedAsset
-- -----------------------------------------------------------------------------
CREATE TABLE "bcFixedAsset" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcFixedAssetNo" text NOT NULL,
  "bcFixedAssetDescription" text,
  "bcFixedAssetDescription2" text,
  "bcFixedAssetFAClassCode" text,
  "bcFixedAssetFASubclassCode" text,
  "bcFixedAssetGlobalDimension1Code" text,
  "bcFixedAssetGlobalDimension2Code" text,
  "bcFixedAssetLocationCode" text,
  "bcFixedAssetFALocationCode" text,
  "bcFixedAssetVendorNo" text,
  "bcFixedAssetResponsibleEmployee" text,
  "bcFixedAssetSerialNo" text,
  "bcFixedAssetWarrantyDate" date,
  "bcFixedAssetAcquired" boolean,
  "bcFixedAssetInactive" boolean,
  "bcFixedAssetBlocked" text,
  "bcFixedAssetFAPostingGroup" text,
  "bcFixedAssetLastDateModified" date,
  "bcFixedAssetCreatedAt" timestamptz,
  "bcFixedAssetLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcFixedAsset_no_unique" UNIQUE ("bcFixedAssetNo")
);

-- -----------------------------------------------------------------------------
-- 7. bcDimensionSetEntry
-- -----------------------------------------------------------------------------
CREATE TABLE "bcDimensionSetEntry" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcDimensionSetEntryDimensionSetID" integer NOT NULL,
  "bcDimensionSetEntryDimensionCode" text NOT NULL,
  "bcDimensionSetEntryDimensionValueCode" text,
  "bcDimensionSetEntryDimensionValueID" integer,
  "bcDimensionSetEntryDimensionName" text,
  "bcDimensionSetEntryDimensionValueName" text,
  "bcDimensionSetEntryGlobalDimensionNo" integer,
  "bcDimensionSetEntryCreatedAt" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcDimensionSetEntry_pk_unique" UNIQUE ("bcDimensionSetEntryDimensionSetID", "bcDimensionSetEntryDimensionCode")
);


-- =============================================================================
-- SALES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 8. bcSalesQuote
-- -----------------------------------------------------------------------------
CREATE TABLE "bcSalesQuote" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcSalesQuoteNoValue" text NOT NULL,
  "bcSalesQuoteSellToCustomerNo" text,
  "bcSalesQuoteSellToCustomerName" text,
  "bcSalesQuoteOrderDate" date,
  "bcSalesQuoteDueDate" date,
  "bcSalesQuoteDocumentDate" date,
  "bcSalesQuoteAmountValue" numeric,
  "bcSalesQuoteAmountIncludingVAT" numeric,
  "bcSalesQuoteSalespersonCode" text,
  "bcSalesQuoteShortcutDimension1Code" text,
  "bcSalesQuoteShortcutDimension2Code" text,
  "bcSalesQuoteLocationCode" text,
  "bcSalesQuoteCurrencyCode" text,
  "bcSalesQuoteExternalDocumentNo" text,
  "bcSalesQuoteStatus" text,
  "bcSalesQuoteQuoteValidUntilDate" date,
  "bcSalesQuoteQuoteAccepted" boolean,
  "bcSalesQuoteQuoteAcceptedDate" date,
  "bcSalesQuoteOpportunityNo" text,
  "bcSalesQuoteAssignedUserID" text,
  "bcSalesQuoteCreatedAt" timestamptz,
  "bcSalesQuoteLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcSalesQuote_no_unique" UNIQUE ("bcSalesQuoteNoValue")
);

-- -----------------------------------------------------------------------------
-- 9. bcSalesOrder
-- -----------------------------------------------------------------------------
CREATE TABLE "bcSalesOrder" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcSalesOrderNoValue" text NOT NULL,
  "bcSalesOrderSellToCustomerNo" text,
  "bcSalesOrderSellToCustomerName" text,
  "bcSalesOrderSellToAddress" text,
  "bcSalesOrderSellToAddress2" text,
  "bcSalesOrderSellToCity" text,
  "bcSalesOrderSellToPostCode" text,
  "bcSalesOrderShipToName" text,
  "bcSalesOrderShipToAddress" text,
  "bcSalesOrderShipToAddress2" text,
  "bcSalesOrderShipToCity" text,
  "bcSalesOrderShipToPostCode" text,
  "bcSalesOrderOrderDate" date,
  "bcSalesOrderDueDate" date,
  "bcSalesOrderPostingDate" date,
  "bcSalesOrderDocumentDate" date,
  "bcSalesOrderStatus" text,
  "bcSalesOrderCompletelyShipped" boolean,
  "bcSalesOrderSalespersonCode" text,
  "bcSalesOrderExternalDocumentNo" text,
  "bcSalesOrderLocationCode" text,
  "bcSalesOrderShortcutDimension1Code" text,
  "bcSalesOrderShortcutDimension2Code" text,
  "bcSalesOrderAmountValue" numeric,
  "bcSalesOrderAmountIncludingVAT" numeric,
  "bcSalesOrderAssignedUserID" text,
  "bcSalesOrderRequestedDeliveryDate" date,
  "bcSalesOrderPaymentTermsCode" text,
  "bcSalesOrderPaymentMethodCode" text,
  "bcSalesOrderCurrencyCode" text,
  "bcSalesOrderQuoteNo" text,
  "bcSalesOrderInvoiceDiscountAmount" numeric,
  "bcSalesOrderShipmentMethodCode" text,
  "bcSalesOrderShippingAgentCode" text,
  "bcSalesOrderLastShipmentDate" date,
  "bcSalesOrderPromisedDeliveryDate" date,
  "bcSalesOrderSellToPhoneNo" text,
  "bcSalesOrderSellToEMail" text,
  "bcSalesOrderNoSeries" text,
  "bcSalesOrderCurrencyFactor" numeric,
  "bcSalesOrderCreatedAt" timestamptz,
  "bcSalesOrderLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcSalesOrder_no_unique" UNIQUE ("bcSalesOrderNoValue")
);

-- -----------------------------------------------------------------------------
-- 10. bcSalesOrderLine
-- -----------------------------------------------------------------------------
CREATE TABLE "bcSalesOrderLine" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcSalesOrderLineDocumentNo" text NOT NULL,
  "bcSalesOrderLineLineNo" integer NOT NULL,
  "bcSalesOrderLineTypeValue" text,
  "bcSalesOrderLineNoValue" text,
  "bcSalesOrderLineDescriptionValue" text,
  "bcSalesOrderLineDescription2" text,
  "bcSalesOrderLineQuantityValue" numeric,
  "bcSalesOrderLineOutstandingQuantity" numeric,
  "bcSalesOrderLineQuantityShipped" numeric,
  "bcSalesOrderLineQuantityInvoiced" numeric,
  "bcSalesOrderLineUnitPrice" numeric,
  "bcSalesOrderLineUnitCost" numeric,
  "bcSalesOrderLineLineDiscount" numeric,
  "bcSalesOrderLineLineDiscountAmount" numeric,
  "bcSalesOrderLineAmountValue" numeric,
  "bcSalesOrderLineAmountIncludingVAT" numeric,
  "bcSalesOrderLineUnitOfMeasureCode" text,
  "bcSalesOrderLineLocationCode" text,
  "bcSalesOrderLineShortcutDimension1Code" text,
  "bcSalesOrderLineShortcutDimension2Code" text,
  "bcSalesOrderLineProfit" numeric,
  "bcSalesOrderLineVariantCode" text,
  "bcSalesOrderLineItemCategoryCode" text,
  "bcSalesOrderLineGenProdPostingGroup" text,
  "bcSalesOrderLineShipmentDate" date,
  "bcSalesOrderLineOutstandingAmount" numeric,
  "bcSalesOrderLineInvDiscountAmount" numeric,
  "bcSalesOrderLinePlannedDeliveryDate" date,
  "bcSalesOrderLinePlannedShipmentDate" date,
  "bcSalesOrderLineVAT" numeric,
  "bcSalesOrderLineLineAmount" numeric,
  "bcSalesOrderLineQtyToShip" numeric,
  "bcSalesOrderLineQtyToInvoice" numeric,
  "bcSalesOrderLineDropShipment" boolean,
  "bcSalesOrderLineBinCode" text,
  "bcSalesOrderLineCompletelyShipped" boolean,
  "bcSalesOrderLineCreatedAt" timestamptz,
  "bcSalesOrderLineLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcSalesOrderLine_pk_unique" UNIQUE ("bcSalesOrderLineDocumentNo", "bcSalesOrderLineLineNo")
);

-- -----------------------------------------------------------------------------
-- 11. bcSalesInvoice
-- -----------------------------------------------------------------------------
CREATE TABLE "bcSalesInvoice" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcSalesInvoiceNoValue" text NOT NULL,
  "bcSalesInvoiceSellToCustomerNo" text,
  "bcSalesInvoiceSellToCustomerName" text,
  "bcSalesInvoiceSellToAddress" text,
  "bcSalesInvoiceSellToAddress2" text,
  "bcSalesInvoiceSellToCity" text,
  "bcSalesInvoiceSellToPostCode" text,
  "bcSalesInvoiceOrderDate" date,
  "bcSalesInvoicePostingDate" date,
  "bcSalesInvoiceDocumentDate" date,
  "bcSalesInvoiceDueDate" date,
  "bcSalesInvoiceAmountValue" numeric,
  "bcSalesInvoiceAmountIncludingVAT" numeric,
  "bcSalesInvoiceSalespersonCode" text,
  "bcSalesInvoiceShortcutDimension1Code" text,
  "bcSalesInvoiceShortcutDimension2Code" text,
  "bcSalesInvoiceLocationCode" text,
  "bcSalesInvoiceCurrencyCode" text,
  "bcSalesInvoicePaymentTermsCode" text,
  "bcSalesInvoicePaymentMethodCode" text,
  "bcSalesInvoiceExternalDocumentNo" text,
  "bcSalesInvoiceStatus" text,
  "bcSalesInvoiceInvoiceDiscountAmount" numeric,
  "bcSalesInvoiceCreatedAt" timestamptz,
  "bcSalesInvoiceLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcSalesInvoice_no_unique" UNIQUE ("bcSalesInvoiceNoValue")
);

-- -----------------------------------------------------------------------------
-- 12. bcSalesInvoiceLine
-- -----------------------------------------------------------------------------
CREATE TABLE "bcSalesInvoiceLine" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcSalesInvoiceLineDocumentNo" text NOT NULL,
  "bcSalesInvoiceLineLineNo" integer NOT NULL,
  "bcSalesInvoiceLineTypeValue" text,
  "bcSalesInvoiceLineNoValue" text,
  "bcSalesInvoiceLineDescriptionValue" text,
  "bcSalesInvoiceLineDescription2" text,
  "bcSalesInvoiceLineQuantityValue" numeric,
  "bcSalesInvoiceLineUnitPrice" numeric,
  "bcSalesInvoiceLineUnitCost" numeric,
  "bcSalesInvoiceLineAmountValue" numeric,
  "bcSalesInvoiceLineAmountIncludingVAT" numeric,
  "bcSalesInvoiceLineLineDiscount" numeric,
  "bcSalesInvoiceLineLineDiscountAmount" numeric,
  "bcSalesInvoiceLineUnitOfMeasureCode" text,
  "bcSalesInvoiceLineLocationCode" text,
  "bcSalesInvoiceLineShortcutDimension1Code" text,
  "bcSalesInvoiceLineShortcutDimension2Code" text,
  "bcSalesInvoiceLineGenProdPostingGroup" text,
  "bcSalesInvoiceLineCreatedAt" timestamptz,
  "bcSalesInvoiceLineLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcSalesInvoiceLine_pk_unique" UNIQUE ("bcSalesInvoiceLineDocumentNo", "bcSalesInvoiceLineLineNo")
);

-- -----------------------------------------------------------------------------
-- 13. bcPostedSalesInvoice
-- -----------------------------------------------------------------------------
CREATE TABLE "bcPostedSalesInvoice" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcPostedSalesInvoiceNoValue" text NOT NULL,
  "bcPostedSalesInvoiceSellToCustomerNo" text,
  "bcPostedSalesInvoiceSellToCustomerName" text,
  "bcPostedSalesInvoiceSellToAddress" text,
  "bcPostedSalesInvoiceSellToAddress2" text,
  "bcPostedSalesInvoiceSellToCity" text,
  "bcPostedSalesInvoiceSellToPostCode" text,
  "bcPostedSalesInvoiceOrderNo" text,
  "bcPostedSalesInvoiceOrderDate" date,
  "bcPostedSalesInvoicePostingDate" date,
  "bcPostedSalesInvoiceDocumentDate" date,
  "bcPostedSalesInvoiceDueDate" date,
  "bcPostedSalesInvoiceAmountValue" numeric,
  "bcPostedSalesInvoiceAmountIncludingVAT" numeric,
  "bcPostedSalesInvoiceSalespersonCode" text,
  "bcPostedSalesInvoiceShortcutDimension1Code" text,
  "bcPostedSalesInvoiceShortcutDimension2Code" text,
  "bcPostedSalesInvoiceLocationCode" text,
  "bcPostedSalesInvoiceCurrencyCode" text,
  "bcPostedSalesInvoiceCurrencyFactor" numeric,
  "bcPostedSalesInvoicePaymentTermsCode" text,
  "bcPostedSalesInvoicePaymentMethodCode" text,
  "bcPostedSalesInvoiceExternalDocumentNo" text,
  "bcPostedSalesInvoiceGenBusPostingGroup" text,
  "bcPostedSalesInvoiceCustomerPostingGroup" text,
  "bcPostedSalesInvoiceRemainingAmount" numeric,
  "bcPostedSalesInvoiceClosedValue" text,
  "bcPostedSalesInvoiceInvoiceDiscountAmount" numeric,
  "bcPostedSalesInvoiceCreatedAt" timestamptz,
  "bcPostedSalesInvoiceLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcPostedSalesInvoice_no_unique" UNIQUE ("bcPostedSalesInvoiceNoValue")
);

-- -----------------------------------------------------------------------------
-- 14. bcPostedSalesInvoiceLine
-- -----------------------------------------------------------------------------
CREATE TABLE "bcPostedSalesInvoiceLine" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcPostedSalesInvoiceLineDocumentNo" text NOT NULL,
  "bcPostedSalesInvoiceLineLineNo" integer NOT NULL,
  "bcPostedSalesInvoiceLineTypeValue" text,
  "bcPostedSalesInvoiceLineNoValue" text,
  "bcPostedSalesInvoiceLineDescriptionValue" text,
  "bcPostedSalesInvoiceLineDescription2" text,
  "bcPostedSalesInvoiceLineQuantityValue" numeric,
  "bcPostedSalesInvoiceLineUnitPrice" numeric,
  "bcPostedSalesInvoiceLineUnitCost" numeric,
  "bcPostedSalesInvoiceLineAmountValue" numeric,
  "bcPostedSalesInvoiceLineAmountIncludingVAT" numeric,
  "bcPostedSalesInvoiceLineLineDiscount" numeric,
  "bcPostedSalesInvoiceLineLineDiscountAmount" numeric,
  "bcPostedSalesInvoiceLineUnitOfMeasureCode" text,
  "bcPostedSalesInvoiceLineLocationCode" text,
  "bcPostedSalesInvoiceLineShortcutDimension1Code" text,
  "bcPostedSalesInvoiceLineShortcutDimension2Code" text,
  "bcPostedSalesInvoiceLineGenProdPostingGroup" text,
  "bcPostedSalesInvoiceLineItemCategoryCode" text,
  "bcPostedSalesInvoiceLineVariantCode" text,
  "bcPostedSalesInvoiceLineCreatedAt" timestamptz,
  "bcPostedSalesInvoiceLineLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcPostedSalesInvoiceLine_pk_unique" UNIQUE ("bcPostedSalesInvoiceLineDocumentNo", "bcPostedSalesInvoiceLineLineNo")
);

-- -----------------------------------------------------------------------------
-- 15. bcPostedSalesShipment
-- -----------------------------------------------------------------------------
CREATE TABLE "bcPostedSalesShipment" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcPostedSalesShipmentNo" text NOT NULL,
  "bcPostedSalesShipmentSellToCustomerNo" text,
  "bcPostedSalesShipmentSellToCustomerName" text,
  "bcPostedSalesShipmentOrderNo" text,
  "bcPostedSalesShipmentOrderDate" date,
  "bcPostedSalesShipmentPostingDate" date,
  "bcPostedSalesShipmentShipmentDate" date,
  "bcPostedSalesShipmentDocumentDate" date,
  "bcPostedSalesShipmentSalespersonCode" text,
  "bcPostedSalesShipmentShortcutDimension1Code" text,
  "bcPostedSalesShipmentShortcutDimension2Code" text,
  "bcPostedSalesShipmentLocationCode" text,
  "bcPostedSalesShipmentCurrencyCode" text,
  "bcPostedSalesShipmentExternalDocumentNo" text,
  "bcPostedSalesShipmentShipmentMethodCode" text,
  "bcPostedSalesShipmentShippingAgentCode" text,
  "bcPostedSalesShipmentPackageTrackingNo" text,
  "bcPostedSalesShipmentRequestedDeliveryDate" date,
  "bcPostedSalesShipmentCreatedAt" timestamptz,
  "bcPostedSalesShipmentLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcPostedSalesShipment_no_unique" UNIQUE ("bcPostedSalesShipmentNo")
);

-- -----------------------------------------------------------------------------
-- 16. bcPostedSalesShipmentLine
-- -----------------------------------------------------------------------------
CREATE TABLE "bcPostedSalesShipmentLine" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcPostedSalesShipmentLineDocumentNo" text NOT NULL,
  "bcPostedSalesShipmentLineLineNo" integer NOT NULL,
  "bcPostedSalesShipmentLineTypeValue" text,
  "bcPostedSalesShipmentLineNoValue" text,
  "bcPostedSalesShipmentLineDescriptionValue" text,
  "bcPostedSalesShipmentLineDescription2" text,
  "bcPostedSalesShipmentLineQuantityValue" numeric,
  "bcPostedSalesShipmentLineUnitOfMeasureCode" text,
  "bcPostedSalesShipmentLineLocationCode" text,
  "bcPostedSalesShipmentLineShortcutDimension1Code" text,
  "bcPostedSalesShipmentLineShortcutDimension2Code" text,
  "bcPostedSalesShipmentLineGenProdPostingGroup" text,
  "bcPostedSalesShipmentLineItemCategoryCode" text,
  "bcPostedSalesShipmentLineVariantCode" text,
  "bcPostedSalesShipmentLineCreatedAt" timestamptz,
  "bcPostedSalesShipmentLineLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcPostedSalesShipmentLine_pk_unique" UNIQUE ("bcPostedSalesShipmentLineDocumentNo", "bcPostedSalesShipmentLineLineNo")
);

-- -----------------------------------------------------------------------------
-- 17. bcPostedSalesCreditMemo
-- -----------------------------------------------------------------------------
CREATE TABLE "bcPostedSalesCreditMemo" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcPostedSalesCreditMemoNo" text NOT NULL,
  "bcPostedSalesCreditMemoSellToCustomerNo" text,
  "bcPostedSalesCreditMemoSellToCustomerName" text,
  "bcPostedSalesCreditMemoPostingDate" date,
  "bcPostedSalesCreditMemoDocumentDate" date,
  "bcPostedSalesCreditMemoDueDate" date,
  "bcPostedSalesCreditMemoAmount" numeric,
  "bcPostedSalesCreditMemoAmountIncludingVAT" numeric,
  "bcPostedSalesCreditMemoSalespersonCode" text,
  "bcPostedSalesCreditMemoShortcutDimension1Code" text,
  "bcPostedSalesCreditMemoShortcutDimension2Code" text,
  "bcPostedSalesCreditMemoLocationCode" text,
  "bcPostedSalesCreditMemoCurrencyCode" text,
  "bcPostedSalesCreditMemoCurrencyFactor" numeric,
  "bcPostedSalesCreditMemoExternalDocumentNo" text,
  "bcPostedSalesCreditMemoGenBusPostingGroup" text,
  "bcPostedSalesCreditMemoRemainingAmount" numeric,
  "bcPostedSalesCreditMemoPaid" text,
  "bcPostedSalesCreditMemoCancelled" text,
  "bcPostedSalesCreditMemoCorrective" text,
  "bcPostedSalesCreditMemoCreatedAt" timestamptz,
  "bcPostedSalesCreditMemoLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcPostedSalesCreditMemo_no_unique" UNIQUE ("bcPostedSalesCreditMemoNo")
);

-- -----------------------------------------------------------------------------
-- 18. bcPostedSalesCreditMemoLine
-- -----------------------------------------------------------------------------
CREATE TABLE "bcPostedSalesCreditMemoLine" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcPostedSalesCreditMemoLineDocumentNo" text NOT NULL,
  "bcPostedSalesCreditMemoLineLineNo" integer NOT NULL,
  "bcPostedSalesCreditMemoLineTypeValue" text,
  "bcPostedSalesCreditMemoLineNoValue" text,
  "bcPostedSalesCreditMemoLineDescriptionValue" text,
  "bcPostedSalesCreditMemoLineDescription2" text,
  "bcPostedSalesCreditMemoLineQuantityValue" numeric,
  "bcPostedSalesCreditMemoLineUnitPrice" numeric,
  "bcPostedSalesCreditMemoLineUnitCost" numeric,
  "bcPostedSalesCreditMemoLineAmountValue" numeric,
  "bcPostedSalesCreditMemoLineAmountIncludingVAT" numeric,
  "bcPostedSalesCreditMemoLineLineDiscount" numeric,
  "bcPostedSalesCreditMemoLineUnitOfMeasureCode" text,
  "bcPostedSalesCreditMemoLineLocationCode" text,
  "bcPostedSalesCreditMemoLineShortcutDimension1Code" text,
  "bcPostedSalesCreditMemoLineShortcutDimension2Code" text,
  "bcPostedSalesCreditMemoLineCreatedAt" timestamptz,
  "bcPostedSalesCreditMemoLineLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcPostedSalesCreditMemoLine_pk_unique" UNIQUE ("bcPostedSalesCreditMemoLineDocumentNo", "bcPostedSalesCreditMemoLineLineNo")
);


-- =============================================================================
-- PURCHASE
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 19. bcPurchaseOrder
-- -----------------------------------------------------------------------------
CREATE TABLE "bcPurchaseOrder" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcPurchaseOrderNoValue" text NOT NULL,
  "bcPurchaseOrderBuyFromVendorNo" text,
  "bcPurchaseOrderBuyFromVendorName" text,
  "bcPurchaseOrderBuyFromAddress" text,
  "bcPurchaseOrderBuyFromAddress2" text,
  "bcPurchaseOrderBuyFromCity" text,
  "bcPurchaseOrderBuyFromPostCode" text,
  "bcPurchaseOrderOrderDate" date,
  "bcPurchaseOrderPostingDate" date,
  "bcPurchaseOrderExpectedReceiptDate" date,
  "bcPurchaseOrderDueDate" date,
  "bcPurchaseOrderDocumentDate" date,
  "bcPurchaseOrderAmountValue" numeric,
  "bcPurchaseOrderAmountIncludingVAT" numeric,
  "bcPurchaseOrderPurchaserCode" text,
  "bcPurchaseOrderShortcutDimension1Code" text,
  "bcPurchaseOrderShortcutDimension2Code" text,
  "bcPurchaseOrderLocationCode" text,
  "bcPurchaseOrderCurrencyCode" text,
  "bcPurchaseOrderCurrencyFactor" numeric,
  "bcPurchaseOrderPaymentTermsCode" text,
  "bcPurchaseOrderPaymentMethodCode" text,
  "bcPurchaseOrderVendorInvoiceNo" text,
  "bcPurchaseOrderVendorOrderNo" text,
  "bcPurchaseOrderStatus" text,
  "bcPurchaseOrderCompletelyReceived" boolean,
  "bcPurchaseOrderInvoiceDiscountAmount" numeric,
  "bcPurchaseOrderAssignedUserID" text,
  "bcPurchaseOrderGenBusPostingGroup" text,
  "bcPurchaseOrderCreatedAt" timestamptz,
  "bcPurchaseOrderLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcPurchaseOrder_no_unique" UNIQUE ("bcPurchaseOrderNoValue")
);

-- -----------------------------------------------------------------------------
-- 20. bcPurchaseOrderLine
-- -----------------------------------------------------------------------------
CREATE TABLE "bcPurchaseOrderLine" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcPurchaseOrderLineDocumentNo" text NOT NULL,
  "bcPurchaseOrderLineLineNo" integer NOT NULL,
  "bcPurchaseOrderLineTypeValue" text,
  "bcPurchaseOrderLineNoValue" text,
  "bcPurchaseOrderLineDescriptionValue" text,
  "bcPurchaseOrderLineDescription2" text,
  "bcPurchaseOrderLineQuantityValue" numeric,
  "bcPurchaseOrderLineOutstandingQuantity" numeric,
  "bcPurchaseOrderLineQuantityReceived" numeric,
  "bcPurchaseOrderLineQuantityInvoiced" numeric,
  "bcPurchaseOrderLineDirectUnitCost" numeric,
  "bcPurchaseOrderLineAmountValue" numeric,
  "bcPurchaseOrderLineAmountIncludingVAT" numeric,
  "bcPurchaseOrderLineLineDiscount" numeric,
  "bcPurchaseOrderLineUnitOfMeasureCode" text,
  "bcPurchaseOrderLineLocationCode" text,
  "bcPurchaseOrderLineShortcutDimension1Code" text,
  "bcPurchaseOrderLineShortcutDimension2Code" text,
  "bcPurchaseOrderLineGenProdPostingGroup" text,
  "bcPurchaseOrderLineItemCategoryCode" text,
  "bcPurchaseOrderLineCreatedAt" timestamptz,
  "bcPurchaseOrderLineLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcPurchaseOrderLine_pk_unique" UNIQUE ("bcPurchaseOrderLineDocumentNo", "bcPurchaseOrderLineLineNo")
);

-- -----------------------------------------------------------------------------
-- 21. bcPostedPurchInvoice
-- -----------------------------------------------------------------------------
CREATE TABLE "bcPostedPurchInvoice" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcPostedPurchInvoiceNoValue" text NOT NULL,
  "bcPostedPurchInvoiceBuyFromVendorNo" text,
  "bcPostedPurchInvoiceBuyFromVendorName" text,
  "bcPostedPurchInvoiceOrderNo" text,
  "bcPostedPurchInvoiceOrderDate" date,
  "bcPostedPurchInvoicePostingDate" date,
  "bcPostedPurchInvoiceDocumentDate" date,
  "bcPostedPurchInvoiceDueDate" date,
  "bcPostedPurchInvoiceAmountValue" numeric,
  "bcPostedPurchInvoiceAmountIncludingVAT" numeric,
  "bcPostedPurchInvoicePurchaserCode" text,
  "bcPostedPurchInvoiceShortcutDimension1Code" text,
  "bcPostedPurchInvoiceShortcutDimension2Code" text,
  "bcPostedPurchInvoiceLocationCode" text,
  "bcPostedPurchInvoiceCurrencyCode" text,
  "bcPostedPurchInvoiceCurrencyFactor" numeric,
  "bcPostedPurchInvoicePaymentTermsCode" text,
  "bcPostedPurchInvoicePaymentMethodCode" text,
  "bcPostedPurchInvoiceVendorInvoiceNo" text,
  "bcPostedPurchInvoiceVendorOrderNo" text,
  "bcPostedPurchInvoiceGenBusPostingGroup" text,
  "bcPostedPurchInvoiceRemainingAmount" numeric,
  "bcPostedPurchInvoiceClosedValue" text,
  "bcPostedPurchInvoiceInvoiceDiscountAmount" numeric,
  "bcPostedPurchInvoiceCreatedAt" timestamptz,
  "bcPostedPurchInvoiceLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcPostedPurchInvoice_no_unique" UNIQUE ("bcPostedPurchInvoiceNoValue")
);

-- -----------------------------------------------------------------------------
-- 22. bcPostedPurchInvoiceLine
-- -----------------------------------------------------------------------------
CREATE TABLE "bcPostedPurchInvoiceLine" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcPostedPurchInvoiceLineDocumentNo" text NOT NULL,
  "bcPostedPurchInvoiceLineLineNo" integer NOT NULL,
  "bcPostedPurchInvoiceLineTypeValue" text,
  "bcPostedPurchInvoiceLineNoValue" text,
  "bcPostedPurchInvoiceLineDescriptionValue" text,
  "bcPostedPurchInvoiceLineDescription2" text,
  "bcPostedPurchInvoiceLineQuantityValue" numeric,
  "bcPostedPurchInvoiceLineDirectUnitCost" numeric,
  "bcPostedPurchInvoiceLineAmountValue" numeric,
  "bcPostedPurchInvoiceLineAmountIncludingVAT" numeric,
  "bcPostedPurchInvoiceLineLineDiscount" numeric,
  "bcPostedPurchInvoiceLineUnitOfMeasureCode" text,
  "bcPostedPurchInvoiceLineLocationCode" text,
  "bcPostedPurchInvoiceLineShortcutDimension1Code" text,
  "bcPostedPurchInvoiceLineShortcutDimension2Code" text,
  "bcPostedPurchInvoiceLineGenProdPostingGroup" text,
  "bcPostedPurchInvoiceLineItemCategoryCode" text,
  "bcPostedPurchInvoiceLineVariantCode" text,
  "bcPostedPurchInvoiceLineCreatedAt" timestamptz,
  "bcPostedPurchInvoiceLineLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcPostedPurchInvoiceLine_pk_unique" UNIQUE ("bcPostedPurchInvoiceLineDocumentNo", "bcPostedPurchInvoiceLineLineNo")
);


-- =============================================================================
-- PRODUCTION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 23. bcProductionOrder
-- -----------------------------------------------------------------------------
CREATE TABLE "bcProductionOrder" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcProductionOrderNo" text NOT NULL,
  "bcProductionOrderStatus" text,
  "bcProductionOrderDescription" text,
  "bcProductionOrderDescription2" text,
  "bcProductionOrderSourceNo" text,
  "bcProductionOrderSourceType" text,
  "bcProductionOrderRoutingNo" text,
  "bcProductionOrderQuantity" numeric,
  "bcProductionOrderShortcutDimension1Code" text,
  "bcProductionOrderShortcutDimension2Code" text,
  "bcProductionOrderLocationCode" text,
  "bcProductionOrderDueDate" date,
  "bcProductionOrderFinishedDate" date,
  "bcProductionOrderStartingDateTime" timestamptz,
  "bcProductionOrderEndingDateTime" timestamptz,
  "bcProductionOrderAssignedUserID" text,
  "bcProductionOrderSearchDescription" text,
  "bcProductionOrderCostAmount" numeric,
  "bcProductionOrderUnitCost" numeric,
  "bcProductionOrderBinCode" text,
  "bcProductionOrderCreationDate" date,
  "bcProductionOrderExpectedOperationCostAmt" numeric,
  "bcProductionOrderExpectedComponentCostAmt" numeric,
  "bcProductionOrderActualTimeUsed" numeric,
  "bcProductionOrderCompletelyPicked" boolean,
  "bcProductionOrderDocumentPutAwayStatus" text,
  "bcProductionOrderPlannedOrderNo" text,
  "bcProductionOrderCreatedAt" timestamptz,
  "bcProductionOrderLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcProductionOrder_no_unique" UNIQUE ("bcProductionOrderNo")
);

-- -----------------------------------------------------------------------------
-- 24. bcProductionOrderLine
-- -----------------------------------------------------------------------------
CREATE TABLE "bcProductionOrderLine" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcProductionOrderLineProdOrderNo" text NOT NULL,
  "bcProductionOrderLineLineNo" integer NOT NULL,
  "bcProductionOrderLineStatus" text,
  "bcProductionOrderLineItemNo" text,
  "bcProductionOrderLineDescription" text,
  "bcProductionOrderLineDescription2" text,
  "bcProductionOrderLineQuantity" numeric,
  "bcProductionOrderLineFinishedQuantity" numeric,
  "bcProductionOrderLineRemainingQuantity" numeric,
  "bcProductionOrderLineUnitOfMeasureCode" text,
  "bcProductionOrderLineLocationCode" text,
  "bcProductionOrderLineShortcutDimension1Code" text,
  "bcProductionOrderLineShortcutDimension2Code" text,
  "bcProductionOrderLineDueDate" date,
  "bcProductionOrderLineUnitCost" numeric,
  "bcProductionOrderLineCostAmount" numeric,
  "bcProductionOrderLineScrap" numeric,
  "bcProductionOrderLineRoutingNo" text,
  "bcProductionOrderLineProductionBOMNo" text,
  "bcProductionOrderLineVariantCode" text,
  "bcProductionOrderLineBinCode" text,
  "bcProductionOrderLineStartingDateTime" timestamptz,
  "bcProductionOrderLineEndingDateTime" timestamptz,
  "bcProductionOrderLinePutAwayStatus" text,
  "bcProductionOrderLineCreatedAt" timestamptz,
  "bcProductionOrderLineLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcProductionOrderLine_pk_unique" UNIQUE ("bcProductionOrderLineProdOrderNo", "bcProductionOrderLineLineNo")
);

-- -----------------------------------------------------------------------------
-- 25. bcItemLedgerEntry
-- -----------------------------------------------------------------------------
CREATE TABLE "bcItemLedgerEntry" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcItemLedgerEntryEntryNo" integer NOT NULL,
  "bcItemLedgerEntryItemNo" text,
  "bcItemLedgerEntryPostingDate" date,
  "bcItemLedgerEntryEntryType" text,
  "bcItemLedgerEntryDocumentNo" text,
  "bcItemLedgerEntryDocumentType" text,
  "bcItemLedgerEntryDocumentDate" date,
  "bcItemLedgerEntryDescriptionValue" text,
  "bcItemLedgerEntryLocationCode" text,
  "bcItemLedgerEntryQuantityValue" numeric,
  "bcItemLedgerEntryRemainingQuantity" numeric,
  "bcItemLedgerEntryInvoicedQuantity" numeric,
  "bcItemLedgerEntryUnitOfMeasureCode" text,
  "bcItemLedgerEntryGlobalDimension1Code" text,
  "bcItemLedgerEntryGlobalDimension2Code" text,
  "bcItemLedgerEntryOpenValue" text,
  "bcItemLedgerEntryOrderType" text,
  "bcItemLedgerEntryOrderNo" text,
  "bcItemLedgerEntryOrderLineNo" integer,
  "bcItemLedgerEntryItemDescription" text,
  "bcItemLedgerEntryCompletelyInvoiced" boolean,
  "bcItemLedgerEntryVariantCode" text,
  "bcItemLedgerEntrySerialNo" text,
  "bcItemLedgerEntryLotNo" text,
  "bcItemLedgerEntryExpirationDate" date,
  "bcItemLedgerEntryItemCategoryCode" text,
  "bcItemLedgerEntrySourceNo" text,
  "bcItemLedgerEntryDocumentLineNo" integer,
  "bcItemLedgerEntryCreatedAt" timestamptz,
  "bcItemLedgerEntryLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcItemLedgerEntry_entryNo_unique" UNIQUE ("bcItemLedgerEntryEntryNo")
);

-- -----------------------------------------------------------------------------
-- 26. bcValueEntry
-- -----------------------------------------------------------------------------
CREATE TABLE "bcValueEntry" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcValueEntryEntryNo" integer NOT NULL,
  "bcValueEntryItemNo" text,
  "bcValueEntryPostingDate" date,
  "bcValueEntryDocumentNo" text,
  "bcValueEntryDocumentType" text,
  "bcValueEntryDescriptionValue" text,
  "bcValueEntryLocationCode" text,
  "bcValueEntryValuedQuantity" numeric,
  "bcValueEntryInvoicedQuantity" numeric,
  "bcValueEntryCostPerUnit" numeric,
  "bcValueEntryItemLedgerEntryNo" integer,
  "bcValueEntryItemLedgerEntryType" text,
  "bcValueEntryEntryType" text,
  "bcValueEntrySalespersPurchCode" text,
  "bcValueEntryDiscountAmount" numeric,
  "bcValueEntryGlobalDimension1Code" text,
  "bcValueEntryGlobalDimension2Code" text,
  "bcValueEntrySourceType" text,
  "bcValueEntrySourceNo" text,
  "bcValueEntryGenProdPostingGroup" text,
  "bcValueEntryOrderType" text,
  "bcValueEntryOrderNo" text,
  "bcValueEntryExpectedCost" boolean,
  "bcValueEntryCreatedAt" timestamptz,
  "bcValueEntryLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcValueEntry_entryNo_unique" UNIQUE ("bcValueEntryEntryNo")
);


-- =============================================================================
-- FINANCE
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 27. bcGLEntry
-- -----------------------------------------------------------------------------
CREATE TABLE "bcGLEntry" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcGLEntryEntryNo" integer NOT NULL,
  "bcGLEntryGLAccountNo" text,
  "bcGLEntryGLAccountName" text,
  "bcGLEntryPostingDate" date,
  "bcGLEntryDocumentType" text,
  "bcGLEntryDocumentNo" text,
  "bcGLEntryDocumentDate" date,
  "bcGLEntryDescriptionValue" text,
  "bcGLEntryAmountValue" numeric,
  "bcGLEntryDebitAmount" numeric,
  "bcGLEntryCreditAmount" numeric,
  "bcGLEntryGlobalDimension1Code" text,
  "bcGLEntryGlobalDimension2Code" text,
  "bcGLEntrySourceType" text,
  "bcGLEntrySourceNo" text,
  "bcGLEntryGenPostingType" text,
  "bcGLEntryGenBusPostingGroup" text,
  "bcGLEntryGenProdPostingGroup" text,
  "bcGLEntryExternalDocumentNo" text,
  "bcGLEntryVATAmount" numeric,
  "bcGLEntryCreatedAt" timestamptz,
  "bcGLEntryLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcGLEntry_entryNo_unique" UNIQUE ("bcGLEntryEntryNo")
);

-- -----------------------------------------------------------------------------
-- 28. bcCustomerLedgerEntry
-- -----------------------------------------------------------------------------
CREATE TABLE "bcCustomerLedgerEntry" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcCustomerLedgerEntryEntryNo" integer NOT NULL,
  "bcCustomerLedgerEntryCustomerNo" text,
  "bcCustomerLedgerEntryCustomerName" text,
  "bcCustomerLedgerEntryPostingDate" date,
  "bcCustomerLedgerEntryDocumentType" text,
  "bcCustomerLedgerEntryDocumentNo" text,
  "bcCustomerLedgerEntryDocumentDate" date,
  "bcCustomerLedgerEntryDescription" text,
  "bcCustomerLedgerEntryAmount" numeric,
  "bcCustomerLedgerEntryAmountLCY" numeric,
  "bcCustomerLedgerEntryRemainingAmount" numeric,
  "bcCustomerLedgerEntryRemainingAmtLCY" numeric,
  "bcCustomerLedgerEntryDueDate" date,
  "bcCustomerLedgerEntryOpenValue" text,
  "bcCustomerLedgerEntrySalesLCY" numeric,
  "bcCustomerLedgerEntryProfitLCY" numeric,
  "bcCustomerLedgerEntrySalespersonCode" text,
  "bcCustomerLedgerEntryGlobalDimension1Code" text,
  "bcCustomerLedgerEntryGlobalDimension2Code" text,
  "bcCustomerLedgerEntryCustomerPostingGroup" text,
  "bcCustomerLedgerEntrySellToCustomerNo" text,
  "bcCustomerLedgerEntryCurrencyCode" text,
  "bcCustomerLedgerEntryExternalDocumentNo" text,
  "bcCustomerLedgerEntryCreatedAt" timestamptz,
  "bcCustomerLedgerEntryLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcCustomerLedgerEntry_entryNo_unique" UNIQUE ("bcCustomerLedgerEntryEntryNo")
);

-- -----------------------------------------------------------------------------
-- 29. bcVendorLedgerEntry
-- -----------------------------------------------------------------------------
CREATE TABLE "bcVendorLedgerEntry" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcVendorLedgerEntryEntryNo" integer NOT NULL,
  "bcVendorLedgerEntryVendorNo" text,
  "bcVendorLedgerEntryVendorName" text,
  "bcVendorLedgerEntryPostingDate" date,
  "bcVendorLedgerEntryDocumentType" text,
  "bcVendorLedgerEntryDocumentNo" text,
  "bcVendorLedgerEntryDocumentDate" date,
  "bcVendorLedgerEntryDescription" text,
  "bcVendorLedgerEntryAmount" numeric,
  "bcVendorLedgerEntryAmountLCY" numeric,
  "bcVendorLedgerEntryRemainingAmount" numeric,
  "bcVendorLedgerEntryRemainingAmtLCY" numeric,
  "bcVendorLedgerEntryDueDate" date,
  "bcVendorLedgerEntryOpenValue" text,
  "bcVendorLedgerEntryPurchaseLCY" numeric,
  "bcVendorLedgerEntryPurchaserCode" text,
  "bcVendorLedgerEntryGlobalDimension1Code" text,
  "bcVendorLedgerEntryGlobalDimension2Code" text,
  "bcVendorLedgerEntryVendorPostingGroup" text,
  "bcVendorLedgerEntryBuyFromVendorNo" text,
  "bcVendorLedgerEntryCurrencyCode" text,
  "bcVendorLedgerEntryExternalDocumentNo" text,
  "bcVendorLedgerEntryCreatedAt" timestamptz,
  "bcVendorLedgerEntryLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcVendorLedgerEntry_entryNo_unique" UNIQUE ("bcVendorLedgerEntryEntryNo")
);

-- -----------------------------------------------------------------------------
-- 30. bcDetailedCustLedgerEntry
-- -----------------------------------------------------------------------------
CREATE TABLE "bcDetailedCustLedgerEntry" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcDetailedCustLedgerEntryEntryNo" integer NOT NULL,
  "bcDetailedCustLedgerEntryCustLedgerEntryNo" integer,
  "bcDetailedCustLedgerEntryEntryType" text,
  "bcDetailedCustLedgerEntryPostingDate" date,
  "bcDetailedCustLedgerEntryDocumentType" text,
  "bcDetailedCustLedgerEntryDocumentNo" text,
  "bcDetailedCustLedgerEntryAmount" numeric,
  "bcDetailedCustLedgerEntryAmountLCY" numeric,
  "bcDetailedCustLedgerEntryCustomerNo" text,
  "bcDetailedCustLedgerEntryCurrencyCode" text,
  "bcDetailedCustLedgerEntryDebitAmount" numeric,
  "bcDetailedCustLedgerEntryCreditAmount" numeric,
  "bcDetailedCustLedgerEntryInitialEntryDueDate" date,
  "bcDetailedCustLedgerEntryInitialEntryGlobalDim1" text,
  "bcDetailedCustLedgerEntryInitialEntryGlobalDim2" text,
  "bcDetailedCustLedgerEntryInitialDocumentType" text,
  "bcDetailedCustLedgerEntryAppliedCustLedgerEntryNo" integer,
  "bcDetailedCustLedgerEntryUnapplied" boolean,
  "bcDetailedCustLedgerEntryCreatedAt" timestamptz,
  "bcDetailedCustLedgerEntryLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcDetailedCustLedgerEntry_entryNo_unique" UNIQUE ("bcDetailedCustLedgerEntryEntryNo")
);

-- -----------------------------------------------------------------------------
-- 31. bcDetailedVendorLedgerEntry
-- -----------------------------------------------------------------------------
CREATE TABLE "bcDetailedVendorLedgerEntry" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcDetailedVendorLedgerEntryEntryNo" integer NOT NULL,
  "bcDetailedVendorLedgerEntryVendorLedgerEntryNo" integer,
  "bcDetailedVendorLedgerEntryEntryType" text,
  "bcDetailedVendorLedgerEntryPostingDate" date,
  "bcDetailedVendorLedgerEntryDocumentType" text,
  "bcDetailedVendorLedgerEntryDocumentNo" text,
  "bcDetailedVendorLedgerEntryAmount" numeric,
  "bcDetailedVendorLedgerEntryAmountLCY" numeric,
  "bcDetailedVendorLedgerEntryVendorNo" text,
  "bcDetailedVendorLedgerEntryCurrencyCode" text,
  "bcDetailedVendorLedgerEntryDebitAmount" numeric,
  "bcDetailedVendorLedgerEntryCreditAmount" numeric,
  "bcDetailedVendorLedgerEntryInitialEntryDueDate" date,
  "bcDetailedVendorLedgerEntryInitialEntryGlobalDim1" text,
  "bcDetailedVendorLedgerEntryInitialEntryGlobalDim2" text,
  "bcDetailedVendorLedgerEntryInitialDocumentType" text,
  "bcDetailedVendorLedgerEntryAppliedVendLedgerEntryNo" integer,
  "bcDetailedVendorLedgerEntryUnapplied" boolean,
  "bcDetailedVendorLedgerEntryCreatedAt" timestamptz,
  "bcDetailedVendorLedgerEntryLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcDetailedVendorLedgerEntry_entryNo_unique" UNIQUE ("bcDetailedVendorLedgerEntryEntryNo")
);

-- -----------------------------------------------------------------------------
-- 32. bcBankAccountLedgerEntry
-- -----------------------------------------------------------------------------
CREATE TABLE "bcBankAccountLedgerEntry" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcBankAccountLedgerEntryEntryNo" integer NOT NULL,
  "bcBankAccountLedgerEntryBankAccountNo" text,
  "bcBankAccountLedgerEntryPostingDate" date,
  "bcBankAccountLedgerEntryDocumentType" text,
  "bcBankAccountLedgerEntryDocumentNo" text,
  "bcBankAccountLedgerEntryDocumentDate" date,
  "bcBankAccountLedgerEntryDescription" text,
  "bcBankAccountLedgerEntryAmount" numeric,
  "bcBankAccountLedgerEntryRemainingAmount" numeric,
  "bcBankAccountLedgerEntryAmountLCY" numeric,
  "bcBankAccountLedgerEntryDebitAmount" numeric,
  "bcBankAccountLedgerEntryCreditAmount" numeric,
  "bcBankAccountLedgerEntryGlobalDimension1Code" text,
  "bcBankAccountLedgerEntryGlobalDimension2Code" text,
  "bcBankAccountLedgerEntryOpenValue" text,
  "bcBankAccountLedgerEntryCurrencyCode" text,
  "bcBankAccountLedgerEntryExternalDocumentNo" text,
  "bcBankAccountLedgerEntryStatementStatus" text,
  "bcBankAccountLedgerEntryCreatedAt" timestamptz,
  "bcBankAccountLedgerEntryLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcBankAccountLedgerEntry_entryNo_unique" UNIQUE ("bcBankAccountLedgerEntryEntryNo")
);

-- -----------------------------------------------------------------------------
-- 33. bcFALedgerEntry
-- -----------------------------------------------------------------------------
CREATE TABLE "bcFALedgerEntry" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "bcFALedgerEntryEntryNo" integer NOT NULL,
  "bcFALedgerEntryFANo" text,
  "bcFALedgerEntryFAPostingDate" date,
  "bcFALedgerEntryPostingDate" date,
  "bcFALedgerEntryDocumentType" text,
  "bcFALedgerEntryDocumentNo" text,
  "bcFALedgerEntryDescription" text,
  "bcFALedgerEntryFAPostingType" text,
  "bcFALedgerEntryAmount" numeric,
  "bcFALedgerEntryDebitAmount" numeric,
  "bcFALedgerEntryCreditAmount" numeric,
  "bcFALedgerEntryDepreciationBookCode" text,
  "bcFALedgerEntryGlobalDimension1Code" text,
  "bcFALedgerEntryGlobalDimension2Code" text,
  "bcFALedgerEntryNoOfDepreciationDays" integer,
  "bcFALedgerEntryFAClassCode" text,
  "bcFALedgerEntryCreatedAt" timestamptz,
  "bcFALedgerEntryLastModifiedDateTime" timestamptz,
  "bcSyncedAt" timestamptz DEFAULT now(),
  CONSTRAINT "bcFALedgerEntry_entryNo_unique" UNIQUE ("bcFALedgerEntryEntryNo")
);


-- =============================================================================
-- INDEXES — commonly queried columns
-- =============================================================================

-- Master Data
CREATE INDEX "idx_bcCustomer_salespersonCode" ON "bcCustomer" ("bcCustomerSalespersonCode");
CREATE INDEX "idx_bcCustomer_globalDim1" ON "bcCustomer" ("bcCustomerGlobalDimension1Code");
CREATE INDEX "idx_bcCustomer_globalDim2" ON "bcCustomer" ("bcCustomerGlobalDimension2Code");
CREATE INDEX "idx_bcCustomer_customerPostingGroup" ON "bcCustomer" ("bcCustomerCustomerPostingGroup");

CREATE INDEX "idx_bcVendor_globalDim1" ON "bcVendor" ("bcVendorGlobalDimension1Code");
CREATE INDEX "idx_bcVendor_globalDim2" ON "bcVendor" ("bcVendorGlobalDimension2Code");
CREATE INDEX "idx_bcVendor_vendorPostingGroup" ON "bcVendor" ("bcVendorVendorPostingGroup");

CREATE INDEX "idx_bcItem_itemCategoryCode" ON "bcItem" ("bcItemItemCategoryCode");
CREATE INDEX "idx_bcItem_genProdPostingGroup" ON "bcItem" ("bcItemGenProdPostingGroup");
CREATE INDEX "idx_bcItem_vendorNo" ON "bcItem" ("bcItemVendorNo");

CREATE INDEX "idx_bcDimensionSetEntry_dimSetID" ON "bcDimensionSetEntry" ("bcDimensionSetEntryDimensionSetID");
CREATE INDEX "idx_bcDimensionSetEntry_dimCode" ON "bcDimensionSetEntry" ("bcDimensionSetEntryDimensionCode");

-- Sales Orders
CREATE INDEX "idx_bcSalesOrder_sellToCustomerNo" ON "bcSalesOrder" ("bcSalesOrderSellToCustomerNo");
CREATE INDEX "idx_bcSalesOrder_orderDate" ON "bcSalesOrder" ("bcSalesOrderOrderDate");
CREATE INDEX "idx_bcSalesOrder_postingDate" ON "bcSalesOrder" ("bcSalesOrderPostingDate");
CREATE INDEX "idx_bcSalesOrder_status" ON "bcSalesOrder" ("bcSalesOrderStatus");
CREATE INDEX "idx_bcSalesOrder_dim1" ON "bcSalesOrder" ("bcSalesOrderShortcutDimension1Code");
CREATE INDEX "idx_bcSalesOrder_dim2" ON "bcSalesOrder" ("bcSalesOrderShortcutDimension2Code");
CREATE INDEX "idx_bcSalesOrder_salespersonCode" ON "bcSalesOrder" ("bcSalesOrderSalespersonCode");

CREATE INDEX "idx_bcSalesOrderLine_documentNo" ON "bcSalesOrderLine" ("bcSalesOrderLineDocumentNo");
CREATE INDEX "idx_bcSalesOrderLine_noValue" ON "bcSalesOrderLine" ("bcSalesOrderLineNoValue");

-- Sales Invoices (unposted)
CREATE INDEX "idx_bcSalesInvoice_sellToCustomerNo" ON "bcSalesInvoice" ("bcSalesInvoiceSellToCustomerNo");
CREATE INDEX "idx_bcSalesInvoice_postingDate" ON "bcSalesInvoice" ("bcSalesInvoicePostingDate");

CREATE INDEX "idx_bcSalesInvoiceLine_documentNo" ON "bcSalesInvoiceLine" ("bcSalesInvoiceLineDocumentNo");

-- Posted Sales Invoices
CREATE INDEX "idx_bcPostedSalesInvoice_sellToCustomerNo" ON "bcPostedSalesInvoice" ("bcPostedSalesInvoiceSellToCustomerNo");
CREATE INDEX "idx_bcPostedSalesInvoice_postingDate" ON "bcPostedSalesInvoice" ("bcPostedSalesInvoicePostingDate");
CREATE INDEX "idx_bcPostedSalesInvoice_orderNo" ON "bcPostedSalesInvoice" ("bcPostedSalesInvoiceOrderNo");
CREATE INDEX "idx_bcPostedSalesInvoice_dim1" ON "bcPostedSalesInvoice" ("bcPostedSalesInvoiceShortcutDimension1Code");
CREATE INDEX "idx_bcPostedSalesInvoice_dim2" ON "bcPostedSalesInvoice" ("bcPostedSalesInvoiceShortcutDimension2Code");
CREATE INDEX "idx_bcPostedSalesInvoice_salespersonCode" ON "bcPostedSalesInvoice" ("bcPostedSalesInvoiceSalespersonCode");

CREATE INDEX "idx_bcPostedSalesInvoiceLine_documentNo" ON "bcPostedSalesInvoiceLine" ("bcPostedSalesInvoiceLineDocumentNo");
CREATE INDEX "idx_bcPostedSalesInvoiceLine_noValue" ON "bcPostedSalesInvoiceLine" ("bcPostedSalesInvoiceLineNoValue");

-- Posted Sales Shipments
CREATE INDEX "idx_bcPostedSalesShipment_sellToCustomerNo" ON "bcPostedSalesShipment" ("bcPostedSalesShipmentSellToCustomerNo");
CREATE INDEX "idx_bcPostedSalesShipment_postingDate" ON "bcPostedSalesShipment" ("bcPostedSalesShipmentPostingDate");
CREATE INDEX "idx_bcPostedSalesShipment_orderNo" ON "bcPostedSalesShipment" ("bcPostedSalesShipmentOrderNo");

CREATE INDEX "idx_bcPostedSalesShipmentLine_documentNo" ON "bcPostedSalesShipmentLine" ("bcPostedSalesShipmentLineDocumentNo");

-- Posted Sales Credit Memos
CREATE INDEX "idx_bcPostedSalesCreditMemo_sellToCustomerNo" ON "bcPostedSalesCreditMemo" ("bcPostedSalesCreditMemoSellToCustomerNo");
CREATE INDEX "idx_bcPostedSalesCreditMemo_postingDate" ON "bcPostedSalesCreditMemo" ("bcPostedSalesCreditMemoPostingDate");

CREATE INDEX "idx_bcPostedSalesCreditMemoLine_documentNo" ON "bcPostedSalesCreditMemoLine" ("bcPostedSalesCreditMemoLineDocumentNo");

-- Sales Quotes
CREATE INDEX "idx_bcSalesQuote_sellToCustomerNo" ON "bcSalesQuote" ("bcSalesQuoteSellToCustomerNo");

-- Purchase Orders
CREATE INDEX "idx_bcPurchaseOrder_buyFromVendorNo" ON "bcPurchaseOrder" ("bcPurchaseOrderBuyFromVendorNo");
CREATE INDEX "idx_bcPurchaseOrder_orderDate" ON "bcPurchaseOrder" ("bcPurchaseOrderOrderDate");
CREATE INDEX "idx_bcPurchaseOrder_postingDate" ON "bcPurchaseOrder" ("bcPurchaseOrderPostingDate");
CREATE INDEX "idx_bcPurchaseOrder_status" ON "bcPurchaseOrder" ("bcPurchaseOrderStatus");
CREATE INDEX "idx_bcPurchaseOrder_dim1" ON "bcPurchaseOrder" ("bcPurchaseOrderShortcutDimension1Code");
CREATE INDEX "idx_bcPurchaseOrder_dim2" ON "bcPurchaseOrder" ("bcPurchaseOrderShortcutDimension2Code");

CREATE INDEX "idx_bcPurchaseOrderLine_documentNo" ON "bcPurchaseOrderLine" ("bcPurchaseOrderLineDocumentNo");

-- Posted Purchase Invoices
CREATE INDEX "idx_bcPostedPurchInvoice_buyFromVendorNo" ON "bcPostedPurchInvoice" ("bcPostedPurchInvoiceBuyFromVendorNo");
CREATE INDEX "idx_bcPostedPurchInvoice_postingDate" ON "bcPostedPurchInvoice" ("bcPostedPurchInvoicePostingDate");
CREATE INDEX "idx_bcPostedPurchInvoice_orderNo" ON "bcPostedPurchInvoice" ("bcPostedPurchInvoiceOrderNo");

CREATE INDEX "idx_bcPostedPurchInvoiceLine_documentNo" ON "bcPostedPurchInvoiceLine" ("bcPostedPurchInvoiceLineDocumentNo");

-- Production Orders
CREATE INDEX "idx_bcProductionOrder_status" ON "bcProductionOrder" ("bcProductionOrderStatus");
CREATE INDEX "idx_bcProductionOrder_sourceNo" ON "bcProductionOrder" ("bcProductionOrderSourceNo");
CREATE INDEX "idx_bcProductionOrder_dueDate" ON "bcProductionOrder" ("bcProductionOrderDueDate");
CREATE INDEX "idx_bcProductionOrder_dim1" ON "bcProductionOrder" ("bcProductionOrderShortcutDimension1Code");
CREATE INDEX "idx_bcProductionOrder_dim2" ON "bcProductionOrder" ("bcProductionOrderShortcutDimension2Code");

CREATE INDEX "idx_bcProductionOrderLine_prodOrderNo" ON "bcProductionOrderLine" ("bcProductionOrderLineProdOrderNo");
CREATE INDEX "idx_bcProductionOrderLine_itemNo" ON "bcProductionOrderLine" ("bcProductionOrderLineItemNo");

-- Item Ledger Entries
CREATE INDEX "idx_bcItemLedgerEntry_itemNo" ON "bcItemLedgerEntry" ("bcItemLedgerEntryItemNo");
CREATE INDEX "idx_bcItemLedgerEntry_postingDate" ON "bcItemLedgerEntry" ("bcItemLedgerEntryPostingDate");
CREATE INDEX "idx_bcItemLedgerEntry_documentNo" ON "bcItemLedgerEntry" ("bcItemLedgerEntryDocumentNo");
CREATE INDEX "idx_bcItemLedgerEntry_entryType" ON "bcItemLedgerEntry" ("bcItemLedgerEntryEntryType");
CREATE INDEX "idx_bcItemLedgerEntry_locationCode" ON "bcItemLedgerEntry" ("bcItemLedgerEntryLocationCode");
CREATE INDEX "idx_bcItemLedgerEntry_dim1" ON "bcItemLedgerEntry" ("bcItemLedgerEntryGlobalDimension1Code");
CREATE INDEX "idx_bcItemLedgerEntry_dim2" ON "bcItemLedgerEntry" ("bcItemLedgerEntryGlobalDimension2Code");
CREATE INDEX "idx_bcItemLedgerEntry_orderNo" ON "bcItemLedgerEntry" ("bcItemLedgerEntryOrderNo");

-- Value Entries
CREATE INDEX "idx_bcValueEntry_itemNo" ON "bcValueEntry" ("bcValueEntryItemNo");
CREATE INDEX "idx_bcValueEntry_postingDate" ON "bcValueEntry" ("bcValueEntryPostingDate");
CREATE INDEX "idx_bcValueEntry_documentNo" ON "bcValueEntry" ("bcValueEntryDocumentNo");
CREATE INDEX "idx_bcValueEntry_itemLedgerEntryNo" ON "bcValueEntry" ("bcValueEntryItemLedgerEntryNo");
CREATE INDEX "idx_bcValueEntry_orderNo" ON "bcValueEntry" ("bcValueEntryOrderNo");
CREATE INDEX "idx_bcValueEntry_dim1" ON "bcValueEntry" ("bcValueEntryGlobalDimension1Code");
CREATE INDEX "idx_bcValueEntry_dim2" ON "bcValueEntry" ("bcValueEntryGlobalDimension2Code");

-- GL Entries
CREATE INDEX "idx_bcGLEntry_gLAccountNo" ON "bcGLEntry" ("bcGLEntryGLAccountNo");
CREATE INDEX "idx_bcGLEntry_postingDate" ON "bcGLEntry" ("bcGLEntryPostingDate");
CREATE INDEX "idx_bcGLEntry_documentNo" ON "bcGLEntry" ("bcGLEntryDocumentNo");
CREATE INDEX "idx_bcGLEntry_dim1" ON "bcGLEntry" ("bcGLEntryGlobalDimension1Code");
CREATE INDEX "idx_bcGLEntry_dim2" ON "bcGLEntry" ("bcGLEntryGlobalDimension2Code");
CREATE INDEX "idx_bcGLEntry_sourceNo" ON "bcGLEntry" ("bcGLEntrySourceNo");

-- Customer Ledger Entries
CREATE INDEX "idx_bcCustomerLedgerEntry_customerNo" ON "bcCustomerLedgerEntry" ("bcCustomerLedgerEntryCustomerNo");
CREATE INDEX "idx_bcCustomerLedgerEntry_postingDate" ON "bcCustomerLedgerEntry" ("bcCustomerLedgerEntryPostingDate");
CREATE INDEX "idx_bcCustomerLedgerEntry_documentNo" ON "bcCustomerLedgerEntry" ("bcCustomerLedgerEntryDocumentNo");
CREATE INDEX "idx_bcCustomerLedgerEntry_dueDate" ON "bcCustomerLedgerEntry" ("bcCustomerLedgerEntryDueDate");
CREATE INDEX "idx_bcCustomerLedgerEntry_openValue" ON "bcCustomerLedgerEntry" ("bcCustomerLedgerEntryOpenValue");
CREATE INDEX "idx_bcCustomerLedgerEntry_dim1" ON "bcCustomerLedgerEntry" ("bcCustomerLedgerEntryGlobalDimension1Code");
CREATE INDEX "idx_bcCustomerLedgerEntry_dim2" ON "bcCustomerLedgerEntry" ("bcCustomerLedgerEntryGlobalDimension2Code");

-- Vendor Ledger Entries
CREATE INDEX "idx_bcVendorLedgerEntry_vendorNo" ON "bcVendorLedgerEntry" ("bcVendorLedgerEntryVendorNo");
CREATE INDEX "idx_bcVendorLedgerEntry_postingDate" ON "bcVendorLedgerEntry" ("bcVendorLedgerEntryPostingDate");
CREATE INDEX "idx_bcVendorLedgerEntry_documentNo" ON "bcVendorLedgerEntry" ("bcVendorLedgerEntryDocumentNo");
CREATE INDEX "idx_bcVendorLedgerEntry_dueDate" ON "bcVendorLedgerEntry" ("bcVendorLedgerEntryDueDate");
CREATE INDEX "idx_bcVendorLedgerEntry_openValue" ON "bcVendorLedgerEntry" ("bcVendorLedgerEntryOpenValue");
CREATE INDEX "idx_bcVendorLedgerEntry_dim1" ON "bcVendorLedgerEntry" ("bcVendorLedgerEntryGlobalDimension1Code");
CREATE INDEX "idx_bcVendorLedgerEntry_dim2" ON "bcVendorLedgerEntry" ("bcVendorLedgerEntryGlobalDimension2Code");

-- Detailed Customer Ledger Entries
CREATE INDEX "idx_bcDetailedCustLedgerEntry_custLedgerEntryNo" ON "bcDetailedCustLedgerEntry" ("bcDetailedCustLedgerEntryCustLedgerEntryNo");
CREATE INDEX "idx_bcDetailedCustLedgerEntry_customerNo" ON "bcDetailedCustLedgerEntry" ("bcDetailedCustLedgerEntryCustomerNo");
CREATE INDEX "idx_bcDetailedCustLedgerEntry_postingDate" ON "bcDetailedCustLedgerEntry" ("bcDetailedCustLedgerEntryPostingDate");
CREATE INDEX "idx_bcDetailedCustLedgerEntry_documentNo" ON "bcDetailedCustLedgerEntry" ("bcDetailedCustLedgerEntryDocumentNo");

-- Detailed Vendor Ledger Entries
CREATE INDEX "idx_bcDetailedVendorLedgerEntry_vendorLedgerEntryNo" ON "bcDetailedVendorLedgerEntry" ("bcDetailedVendorLedgerEntryVendorLedgerEntryNo");
CREATE INDEX "idx_bcDetailedVendorLedgerEntry_vendorNo" ON "bcDetailedVendorLedgerEntry" ("bcDetailedVendorLedgerEntryVendorNo");
CREATE INDEX "idx_bcDetailedVendorLedgerEntry_postingDate" ON "bcDetailedVendorLedgerEntry" ("bcDetailedVendorLedgerEntryPostingDate");
CREATE INDEX "idx_bcDetailedVendorLedgerEntry_documentNo" ON "bcDetailedVendorLedgerEntry" ("bcDetailedVendorLedgerEntryDocumentNo");

-- Bank Account Ledger Entries
CREATE INDEX "idx_bcBankAccountLedgerEntry_bankAccountNo" ON "bcBankAccountLedgerEntry" ("bcBankAccountLedgerEntryBankAccountNo");
CREATE INDEX "idx_bcBankAccountLedgerEntry_postingDate" ON "bcBankAccountLedgerEntry" ("bcBankAccountLedgerEntryPostingDate");
CREATE INDEX "idx_bcBankAccountLedgerEntry_documentNo" ON "bcBankAccountLedgerEntry" ("bcBankAccountLedgerEntryDocumentNo");

-- FA Ledger Entries
CREATE INDEX "idx_bcFALedgerEntry_fANo" ON "bcFALedgerEntry" ("bcFALedgerEntryFANo");
CREATE INDEX "idx_bcFALedgerEntry_postingDate" ON "bcFALedgerEntry" ("bcFALedgerEntryPostingDate");
CREATE INDEX "idx_bcFALedgerEntry_documentNo" ON "bcFALedgerEntry" ("bcFALedgerEntryDocumentNo");
CREATE INDEX "idx_bcFALedgerEntry_fAPostingType" ON "bcFALedgerEntry" ("bcFALedgerEntryFAPostingType");

-- =============================================================================
-- SYNC STATE (for incremental sync tracking)
-- =============================================================================

DROP TABLE IF EXISTS "bcSyncState" CASCADE;
CREATE TABLE "bcSyncState" (
  "key" text PRIMARY KEY,
  "value" text,
  "updatedAt" timestamptz DEFAULT now()
);

COMMIT;
