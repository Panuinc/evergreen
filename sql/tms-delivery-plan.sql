-- Delivery Plan Tables for TMS Module
-- Run this manually on Supabase SQL Editor

CREATE TABLE public.tmsDeliveryPlan (
  tmsDeliveryPlanId        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmsDeliveryPlanDate      date NOT NULL,
  tmsDeliveryPlanStatus    text DEFAULT 'planned',
  tmsDeliveryPlanNotes     text,
  tmsDeliveryPlanCreatedBy uuid,
  tmsDeliveryPlanCreatedAt timestamptz DEFAULT now(),
  tmsDeliveryPlanUpdatedAt timestamptz DEFAULT now()
);

CREATE TABLE public.tmsDeliveryPlanItem (
  tmsDeliveryPlanItemId             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmsDeliveryPlanItemPlanId         uuid REFERENCES public.tmsDeliveryPlan(tmsDeliveryPlanId) ON DELETE CASCADE,
  tmsDeliveryPlanItemSalesOrderNo   text,
  tmsDeliveryPlanItemCustomerName   text,
  tmsDeliveryPlanItemSalesOrderLineNo integer,
  tmsDeliveryPlanItemItemNo         text,
  tmsDeliveryPlanItemDescription    text,
  tmsDeliveryPlanItemUom            text,
  tmsDeliveryPlanItemOrderedQty     numeric DEFAULT 0,
  tmsDeliveryPlanItemShippedQty     numeric DEFAULT 0,
  tmsDeliveryPlanItemOutstandingQty numeric DEFAULT 0,
  tmsDeliveryPlanItemPlannedQty     numeric NOT NULL,
  tmsDeliveryPlanItemCreatedAt      timestamptz DEFAULT now()
);
