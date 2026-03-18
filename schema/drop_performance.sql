-- Drop all Performance module tables
-- Run this in Supabase SQL Editor
-- Order: children first, then parents (to respect foreign key constraints)

DROP TABLE IF EXISTS public."perfOkrCheckin" CASCADE;
DROP TABLE IF EXISTS public."perfOkrKeyResult" CASCADE;
DROP TABLE IF EXISTS public."perfOkrObjective" CASCADE;
DROP TABLE IF EXISTS public."perfKpiRecord" CASCADE;
DROP TABLE IF EXISTS public."perfKpiAssignment" CASCADE;
DROP TABLE IF EXISTS public."perfKpiDefinition" CASCADE;
DROP TABLE IF EXISTS public."perf360Response" CASCADE;
DROP TABLE IF EXISTS public."perf360Nomination" CASCADE;
DROP TABLE IF EXISTS public."perf360Competency" CASCADE;
DROP TABLE IF EXISTS public."perf360Cycle" CASCADE;
DROP TABLE IF EXISTS public."perfEvaluationFeedback" CASCADE;
DROP TABLE IF EXISTS public."perfEvaluation" CASCADE;
