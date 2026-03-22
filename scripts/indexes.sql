-- Run in Supabase SQL Editor
-- Database indexes for performance optimization

-- bcItemLedgerEntry: commonly filtered/ordered columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bcile_posting_date
  ON "bcItemLedgerEntry" ("bcItemLedgerEntryPostingDate");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bcile_entry_type
  ON "bcItemLedgerEntry" ("bcItemLedgerEntryEntryType");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bcile_order_type_no
  ON "bcItemLedgerEntry" ("bcItemLedgerEntryOrderType", "bcItemLedgerEntryOrderNo");

-- bcCustomerLedgerEntry: WHERE open = 'true' is very common
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bccle_open_value
  ON "bcCustomerLedgerEntry" ("bcCustomerLedgerEntryOpenValue")
  WHERE "bcCustomerLedgerEntryOpenValue" = 'true';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bccle_customer_no
  ON "bcCustomerLedgerEntry" ("bcCustomerLedgerEntryCustomerNo");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bccle_due_date
  ON "bcCustomerLedgerEntry" ("bcCustomerLedgerEntryDueDate");

-- bcVendorLedgerEntry: same pattern as customer
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bcvle_open_value
  ON "bcVendorLedgerEntry" ("bcVendorLedgerEntryOpenValue")
  WHERE "bcVendorLedgerEntryOpenValue" = 'true';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bcvle_vendor_no
  ON "bcVendorLedgerEntry" ("bcVendorLedgerEntryVendorNo");

-- mktConversation: ordered by lastMessageAt constantly
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mktconv_last_message
  ON "mktConversation" ("mktConversationLastMessageAt" DESC NULLS LAST);

-- mktMessage: WHERE + ORDER BY on conversationId + createdAt
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mktmsg_conv_created
  ON "mktMessage" ("mktMessageConversationId", "mktMessageCreatedAt" ASC);

-- salesLead, salesOpportunity: ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saleslead_created
  ON "salesLead" ("salesLeadCreatedAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salesopp_stage
  ON "salesOpportunity" ("salesOpportunityStage");

-- tmsShipment, tmsDelivery: ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tmsshipment_created
  ON "tmsShipment" ("tmsShipmentCreatedAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tmsdelivery_created
  ON "tmsDelivery" ("tmsDeliveryCreatedAt" DESC);
