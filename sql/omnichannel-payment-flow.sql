-- ==================== Payment Flow Migration ====================
-- รัน SQL นี้ใน Supabase SQL Editor

-- 1. เพิ่มฟิลด์ข้อมูลบัญชีธนาคารใน omAiSettings
ALTER TABLE "omAiSettings" ADD COLUMN IF NOT EXISTS "aiBankAccountInfo" text DEFAULT '';
