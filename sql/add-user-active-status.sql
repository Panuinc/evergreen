-- =============================================================
-- User Active Status Migration
-- เพิ่ม isActive ให้ rbacUserProfile เพื่อปิด/เปิดใช้งานบัญชี
-- Run this in Supabase SQL Editor
-- =============================================================

ALTER TABLE "rbacUserProfile" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_rbacUserProfile_active ON "rbacUserProfile"("isActive") WHERE "isActive" = true;
