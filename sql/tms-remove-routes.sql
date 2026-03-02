-- Remove Routes feature from TMS
-- Run this manually on Supabase SQL Editor

-- Remove the route foreign key column from shipments
ALTER TABLE public."tmsShipment"
  DROP COLUMN IF EXISTS "tmsShipmentRouteId";

-- Drop the route table (CASCADE removes any dependent policies/indexes)
DROP TABLE IF EXISTS public."tmsRoute" CASCADE;
