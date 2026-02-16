-- =====================================================
-- Migration: เพิ่ม employeeUserId ให้ employees เชื่อมกับ auth.users
-- รันคำสั่งนี้ใน Supabase SQL Editor
-- =====================================================

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS "employeeUserId" uuid REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE;
