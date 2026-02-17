-- ==================== Image Storage + OCR Migration ====================
-- รัน SQL นี้ใน Supabase SQL Editor

-- 1. เพิ่มฟิลด์เก็บ URL รูปภาพ
ALTER TABLE "omMessages" ADD COLUMN IF NOT EXISTS "messageImageUrl" text;

-- 2. เพิ่มฟิลด์เก็บข้อมูล OCR สลิป (JSON)
ALTER TABLE "omMessages" ADD COLUMN IF NOT EXISTS "messageOcrData" jsonb;

-- 3. สร้าง storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('omnichannel', 'omnichannel', true)
ON CONFLICT (id) DO NOTHING;

-- 4. อนุญาตให้อ่านไฟล์ได้ (public read)
DROP POLICY IF EXISTS "omnichannel_public_read" ON storage.objects;
CREATE POLICY "omnichannel_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'omnichannel');

-- 5. อนุญาตให้ service role upload ได้
DROP POLICY IF EXISTS "omnichannel_service_upload" ON storage.objects;
CREATE POLICY "omnichannel_service_upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'omnichannel');
