-- ==================== AI Agent Migration ====================
-- รัน SQL นี้ใน Supabase SQL Editor

-- 1. เพิ่มคอลัมน์ AI toggle ใน omConversations
ALTER TABLE "omConversations" ADD COLUMN IF NOT EXISTS "conversationAiAutoReply" boolean NOT NULL DEFAULT false;

-- 2. เพิ่ม flag บอกว่าเป็นข้อความจาก AI ใน omMessages
ALTER TABLE "omMessages" ADD COLUMN IF NOT EXISTS "messageIsAi" boolean NOT NULL DEFAULT false;

-- 3. ตาราง AI Settings (singleton - 1 row)
CREATE TABLE IF NOT EXISTS "omAiSettings" (
  "aiSettingsId" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "aiSystemPrompt" text NOT NULL DEFAULT '',
  "aiModel" text NOT NULL DEFAULT 'moonshotai/kimi-k2.5',
  "aiTemperature" numeric NOT NULL DEFAULT 0.3,
  "aiMaxHistoryMessages" integer NOT NULL DEFAULT 20,
  "aiCreatedAt" timestamptz DEFAULT now(),
  "aiUpdatedAt" timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE "omAiSettings" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage AI settings'
  ) THEN
    CREATE POLICY "Authenticated users can manage AI settings" ON "omAiSettings" FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Insert default row (skip if already exists)
INSERT INTO "omAiSettings" ("aiSystemPrompt")
SELECT 'คุณเป็นเจ้าหน้าที่บริการลูกค้าของบริษัท ตอบลูกค้าอย่างสุภาพและเป็นมิตร เป็นภาษาไทย
สามารถช่วยตอบคำถามเกี่ยวกับสินค้า ราคา และสต๊อกสินค้าได้
ถ้าไม่แน่ใจหรือเป็นเรื่องที่ต้องให้เจ้าหน้าที่ตอบ ให้บอกลูกค้าว่าจะให้เจ้าหน้าที่ติดต่อกลับ
ตอบให้กระชับ ไม่ยาวเกินไป'
WHERE NOT EXISTS (SELECT 1 FROM "omAiSettings" LIMIT 1);

-- Enable realtime for omAiSettings (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE "omAiSettings";
