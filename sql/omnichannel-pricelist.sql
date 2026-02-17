-- Omnichannel Price List Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "omPriceList" (
  "priceId" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "priceItemNumber" text NOT NULL UNIQUE,
  "priceItemName" text,
  "priceUnitPrice" numeric DEFAULT 0,
  "priceUpdatedAt" timestamptz DEFAULT now(),
  "priceUpdatedBy" uuid
);

-- RLS
ALTER TABLE "omPriceList" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage prices" ON "omPriceList" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Service role manage prices" ON "omPriceList" FOR ALL USING (auth.role() = 'service_role');
