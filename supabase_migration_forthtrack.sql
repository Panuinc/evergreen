-- Run this in Supabase SQL Editor
-- 1) Add Forth Track device ID to tmsVehicle for GPS matching
ALTER TABLE "tmsVehicle"
  ADD COLUMN IF NOT EXISTS "tmsVehicleForthtrackId" text;

-- 2) Add Forth Track GPS fields to tmsGpsLog table

ALTER TABLE "tmsGpsLog"
  ADD COLUMN IF NOT EXISTS "tmsGpsLogEngine"         text,
  ADD COLUMN IF NOT EXISTS "tmsGpsLogDriver"         text,
  ADD COLUMN IF NOT EXISTS "tmsGpsLogAddress"        text,
  ADD COLUMN IF NOT EXISTS "tmsGpsLogFuel"           numeric,
  ADD COLUMN IF NOT EXISTS "tmsGpsLogTemperature"    integer,
  ADD COLUMN IF NOT EXISTS "tmsGpsLogCOG"            integer,
  ADD COLUMN IF NOT EXISTS "tmsGpsLogPowerStatus"    text,
  ADD COLUMN IF NOT EXISTS "tmsGpsLogExternalBatt"   text,
  ADD COLUMN IF NOT EXISTS "tmsGpsLogPositionSource" text,
  ADD COLUMN IF NOT EXISTS "tmsGpsLogPoi"            text,
  ADD COLUMN IF NOT EXISTS "tmsGpsLogGpsSignal"      text,
  ADD COLUMN IF NOT EXISTS "tmsGpsLogGprs"           text,
  ADD COLUMN IF NOT EXISTS "tmsGpsLogVehicleType"    text,
  ADD COLUMN IF NOT EXISTS "tmsGpsLogForthtrackId"   text;

-- Unique index for upsert deduplication (one record per device per timestamp)
CREATE UNIQUE INDEX IF NOT EXISTS tmsGpsLog_forthtrack_unique
  ON "tmsGpsLog" ("tmsGpsLogForthtrackId", "tmsGpsLogRecordedAt")
  WHERE "tmsGpsLogForthtrackId" IS NOT NULL;
