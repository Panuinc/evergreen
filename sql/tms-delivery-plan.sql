-- Delivery Plan Tables for TMS Module
-- Run this manually on Supabase SQL Editor
-- NOTE: Double quotes required to preserve camelCase column/table names

-- Drop existing lowercase tables if any
DROP TABLE IF EXISTS public.tmsdeliveryplanitem;
DROP TABLE IF EXISTS public.tmsdeliveryplan;

CREATE TABLE public."tmsDeliveryPlan" (
  "tmsDeliveryPlanId"        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tmsDeliveryPlanDate"      date NOT NULL,
  "tmsDeliveryPlanStatus"    text DEFAULT 'planned',
  "tmsDeliveryPlanNotes"     text,
  "tmsDeliveryPlanCreatedBy" uuid,
  "tmsDeliveryPlanCreatedAt" timestamptz DEFAULT now(),
  "tmsDeliveryPlanUpdatedAt" timestamptz DEFAULT now()
);

CREATE TABLE public."tmsDeliveryPlanItem" (
  "tmsDeliveryPlanItemId"               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tmsDeliveryPlanItemPlanId"           uuid REFERENCES public."tmsDeliveryPlan"("tmsDeliveryPlanId") ON DELETE CASCADE,
  "tmsDeliveryPlanItemSalesOrderNo"     text,
  "tmsDeliveryPlanItemCustomerName"     text,
  "tmsDeliveryPlanItemSalesOrderLineNo" integer,
  "tmsDeliveryPlanItemItemNo"           text,
  "tmsDeliveryPlanItemDescription"      text,
  "tmsDeliveryPlanItemUom"              text,
  "tmsDeliveryPlanItemOrderedQty"       numeric DEFAULT 0,
  "tmsDeliveryPlanItemShippedQty"       numeric DEFAULT 0,
  "tmsDeliveryPlanItemOutstandingQty"   numeric DEFAULT 0,
  "tmsDeliveryPlanItemPlannedQty"       numeric NOT NULL,
  "tmsDeliveryPlanItemCreatedAt"        timestamptz DEFAULT now()
);

-- RLS Policies: allow all authenticated users full access
ALTER TABLE public."tmsDeliveryPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."tmsDeliveryPlanItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON public."tmsDeliveryPlan"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public."tmsDeliveryPlanItem"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
