-- CHH² Core Values Evaluation System
-- Migration: Create evaluations table for 360-degree peer evaluation

CREATE TABLE evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "evaluatorId" UUID NOT NULL REFERENCES auth.users(id),
  "evaluateeEmployeeId" UUID NOT NULL REFERENCES employees("employeeId"),
  period TEXT NOT NULL,
  year INT NOT NULL,
  quarter INT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  scores JSONB NOT NULL,
  "categoryAverages" JSONB,
  "overallScore" NUMERIC(3,2),
  grade TEXT,
  comment TEXT,
  status TEXT DEFAULT 'submitted',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("evaluatorId", "evaluateeEmployeeId", period)
);

CREATE INDEX idx_evaluations_evaluatee ON evaluations("evaluateeEmployeeId");
CREATE INDEX idx_evaluations_period ON evaluations(period);
CREATE INDEX idx_evaluations_evaluator ON evaluations("evaluatorId");

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own evaluations"
  ON evaluations FOR INSERT WITH CHECK (auth.uid() = "evaluatorId");

CREATE POLICY "Users can view their own submitted evaluations"
  ON evaluations FOR SELECT USING (auth.uid() = "evaluatorId");

CREATE POLICY "Service role can do everything"
  ON evaluations FOR ALL USING (auth.role() = 'service_role');
