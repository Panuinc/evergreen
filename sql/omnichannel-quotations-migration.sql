-- Omnichannel Quotations Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "omQuotations" (
  "quotationId" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "quotationConversationId" uuid NOT NULL REFERENCES "omConversations"("conversationId") ON DELETE CASCADE,
  "quotationContactId" uuid NOT NULL REFERENCES "omContacts"("contactId") ON DELETE CASCADE,
  "quotationNumber" text NOT NULL,
  "quotationStatus" text NOT NULL DEFAULT 'draft',
  "quotationCustomerName" text,
  "quotationCustomerPhone" text,
  "quotationCustomerAddress" text,
  "quotationPaymentMethod" text,
  "quotationNotes" text,
  "quotationCreatedAt" timestamptz DEFAULT now(),
  "quotationUpdatedAt" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "omQuotationLines" (
  "lineId" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "lineQuotationId" uuid NOT NULL REFERENCES "omQuotations"("quotationId") ON DELETE CASCADE,
  "lineOrder" integer NOT NULL DEFAULT 1,
  "lineProductName" text NOT NULL,
  "lineVariant" text,
  "lineQuantity" integer NOT NULL DEFAULT 1,
  "lineUnitPrice" numeric DEFAULT 0,
  "lineAmount" numeric DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS "omQuotations_conversation_idx" ON "omQuotations" ("quotationConversationId");
CREATE INDEX IF NOT EXISTS "omQuotationLines_quotation_idx" ON "omQuotationLines" ("lineQuotationId");

-- RLS
ALTER TABLE "omQuotations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "omQuotationLines" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated manage quotations" ON "omQuotations" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated manage lines" ON "omQuotationLines" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public view quotations" ON "omQuotations" FOR SELECT USING (true);
CREATE POLICY "Public view lines" ON "omQuotationLines" FOR SELECT USING (true);
