-- BCI Projects table v2 — matches internal API field names
-- Run this in Supabase SQL Editor

-- Drop old table (no real data yet) and recreate
DROP TABLE IF EXISTS "bciProjectRoles";
DROP TABLE IF EXISTS "bciContacts";
DROP TABLE IF EXISTS "bciCompanies";
DROP TABLE IF EXISTS "bciProjects";

CREATE TABLE "bciProjects" (
  "projectId" BIGINT PRIMARY KEY,
  "projectName" TEXT,
  "projectType" TEXT,
  "projectDescription" TEXT,
  "streetName" TEXT,
  "cityOrTown" TEXT,
  "stateProvince" TEXT,
  "region" TEXT,
  "country" TEXT,
  "value" BIGINT,
  "currency" TEXT DEFAULT 'THB',
  "projectStage" TEXT,
  "projectStageStatus" TEXT,
  "developmentType" TEXT,
  "ownershipType" TEXT,
  "category" TEXT,
  "subCategory" TEXT,
  "storeys" INTEGER,
  "floorArea" DOUBLE PRECISION,
  "siteArea" DOUBLE PRECISION,
  "lat" DOUBLE PRECISION,
  "lon" DOUBLE PRECISION,
  "constructionStartDate" TIMESTAMPTZ,
  "constructionEndDate" TIMESTAMPTZ,
  "constructionStartString" TEXT,
  "constructionEndString" TEXT,
  "remarks" TEXT,
  "statusText" TEXT,
  "sourceText" TEXT,
  "bciResearcher" TEXT,
  "versionNumber" INTEGER,
  "publishedDate" TIMESTAMPTZ,
  "modifiedDate" TIMESTAMPTZ,
  "stageId" INTEGER,
  "statusId" INTEGER,
  "categoryId" TEXT,
  "developmentTypeId" INTEGER,
  "mainContractorMethod" TEXT,
  "syncedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bciprojects_name ON "bciProjects" USING gin (to_tsvector('simple', coalesce("projectName", '')));
CREATE INDEX idx_bciprojects_stage ON "bciProjects"("projectStage");
CREATE INDEX idx_bciprojects_status ON "bciProjects"("projectStageStatus");
CREATE INDEX idx_bciprojects_state ON "bciProjects"("stateProvince");
CREATE INDEX idx_bciprojects_region ON "bciProjects"("region");
CREATE INDEX idx_bciprojects_modified ON "bciProjects"("modifiedDate" DESC);
CREATE INDEX idx_bciprojects_value ON "bciProjects"("value" DESC);

-- RLS
ALTER TABLE "bciProjects" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read bciProjects" ON "bciProjects"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage bciProjects" ON "bciProjects"
  FOR ALL TO service_role USING (true);
