-- Migration: AI Evaluation Feedback cache table
-- Run this in Supabase SQL Editor

CREATE TABLE evaluation_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "employeeId" UUID NOT NULL,
  period TEXT NOT NULL,
  "categoryAverages" JSONB NOT NULL,
  "overallScore" NUMERIC(3,2) NOT NULL,
  grade TEXT NOT NULL,
  "companyAverages" JSONB,
  "evaluatorCount" INTEGER,
  feedback JSONB NOT NULL,
  "generatedBy" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  UNIQUE("employeeId", period)
);

ALTER TABLE evaluation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON evaluation_feedback
  FOR ALL USING (auth.role() = 'service_role');
