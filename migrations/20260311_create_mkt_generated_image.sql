-- Create mktGeneratedImage table for storing AI image generation history
CREATE TABLE IF NOT EXISTS "mktGeneratedImage" (
  "mktGeneratedImageId" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "mktGeneratedImagePrompt" TEXT NOT NULL,
  "mktGeneratedImageOriginalUrl" TEXT NOT NULL,
  "mktGeneratedImageResultUrl" TEXT NOT NULL,
  "mktGeneratedImageSize" VARCHAR(20) DEFAULT '1024x1024',
  "mktGeneratedImageCreatedBy" UUID NOT NULL REFERENCES auth.users(id),
  "mktGeneratedImageCreatedAt" TIMESTAMPTZ DEFAULT now(),
  "isActive" BOOLEAN DEFAULT true
);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_mkt_generated_image_created_by
  ON "mktGeneratedImage" ("mktGeneratedImageCreatedBy");

-- RLS policies
ALTER TABLE "mktGeneratedImage" ENABLE ROW LEVEL SECURITY;

-- Users can read their own generations
CREATE POLICY "Users can view own generated images"
  ON "mktGeneratedImage"
  FOR SELECT
  USING (auth.uid() = "mktGeneratedImageCreatedBy");

-- Users can insert their own generations
CREATE POLICY "Users can create generated images"
  ON "mktGeneratedImage"
  FOR INSERT
  WITH CHECK (auth.uid() = "mktGeneratedImageCreatedBy");

-- Create "marketing" storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing', 'marketing', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload marketing images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'marketing' AND (storage.foldername(name))[1] = 'generated');

-- Storage policy: public read access
CREATE POLICY "Public read access for marketing images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'marketing');
