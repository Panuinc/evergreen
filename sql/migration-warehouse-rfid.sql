-- Migration: Warehouse RFID tables
-- Run this in Supabase SQL editor

-- 1. Scan Sessions
CREATE TABLE IF NOT EXISTS "scanSessions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  type TEXT DEFAULT 'scan',
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  gps_lat DOUBLE PRECISION,
  gps_lon DOUBLE PRECISION,
  tag_count INTEGER DEFAULT 0,
  total_reads INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "scanSessions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions" ON "scanSessions"
  FOR ALL USING (auth.uid() = user_id);

-- 2. Scan Records
CREATE TABLE IF NOT EXISTS "scanRecords" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES "scanSessions"(id) ON DELETE CASCADE,
  epc TEXT NOT NULL,
  rssi TEXT,
  item_number TEXT,
  item_name TEXT,
  photo_url TEXT,
  read_count INTEGER DEFAULT 1,
  scanned_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "scanRecords" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage records via session" ON "scanRecords"
  FOR ALL USING (
    session_id IN (SELECT id FROM "scanSessions" WHERE user_id = auth.uid())
  );

CREATE INDEX idx_scan_records_session ON "scanRecords"(session_id);

-- 3. Warehouse Transfers
CREATE TABLE IF NOT EXISTS "warehouseTransfers" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_no TEXT UNIQUE,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  session_id UUID REFERENCES "scanSessions"(id),
  status TEXT DEFAULT 'pending',
  notes TEXT,
  gps_lat DOUBLE PRECISION,
  gps_lon DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE "warehouseTransfers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own transfers" ON "warehouseTransfers"
  FOR ALL USING (auth.uid() = user_id);

-- 4. Order Matches (PO/SO matching)
CREATE TABLE IF NOT EXISTS "orderMatches" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type TEXT NOT NULL,
  order_number TEXT NOT NULL,
  session_id UUID REFERENCES "scanSessions"(id),
  user_id UUID REFERENCES auth.users(id),
  expected_items JSONB NOT NULL,
  scanned_items JSONB,
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "orderMatches" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own matches" ON "orderMatches"
  FOR ALL USING (auth.uid() = user_id);

-- 5. App Versions (for OTA update)
CREATE TABLE IF NOT EXISTS "appVersions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_name TEXT NOT NULL,
  version_code INTEGER NOT NULL,
  apk_url TEXT,
  release_notes TEXT,
  is_mandatory BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "appVersions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read versions" ON "appVersions"
  FOR SELECT USING (true);
