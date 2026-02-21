-- BCI Central (LeadManager) tables
-- Run this in Supabase SQL Editor

-- Projects
CREATE TABLE IF NOT EXISTS "bciProjects" (
  "projectRefId" BIGINT PRIMARY KEY,
  "projectId" BIGINT,
  "projectName" TEXT,
  "projectType" TEXT,
  "address" TEXT,
  "postcode" TEXT,
  "town" TEXT,
  "state" TEXT,
  "countryName" TEXT,
  "value" BIGINT,
  "statusText" TEXT,
  "projectStatus" TEXT,
  "projectStage" TEXT,
  "devType" TEXT,
  "ownerType" TEXT,
  "category1" TEXT,
  "category2" TEXT,
  "category3" TEXT,
  "conStart" TIMESTAMPTZ,
  "conEnd" TIMESTAMPTZ,
  "storeys" INTEGER,
  "floorArea" BIGINT,
  "siteArea" DOUBLE PRECISION,
  "unitsResidential" INTEGER,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "daNumber" TEXT,
  "remarks" TEXT,
  "keyword" TEXT,
  "council" TEXT,
  "version" INTEGER,
  "timestamp" TIMESTAMPTZ,
  "updateDate" TIMESTAMPTZ,
  "syncedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bciprojects_name ON "bciProjects"("projectName");
CREATE INDEX IF NOT EXISTS idx_bciprojects_status ON "bciProjects"("projectStatus");
CREATE INDEX IF NOT EXISTS idx_bciprojects_stage ON "bciProjects"("projectStage");
CREATE INDEX IF NOT EXISTS idx_bciprojects_state ON "bciProjects"("state");

-- Companies
CREATE TABLE IF NOT EXISTS "bciCompanies" (
  "companyId" BIGINT PRIMARY KEY,
  "companyName" TEXT,
  "unitNumber" TEXT,
  "streetNumber" TEXT,
  "streetName" TEXT,
  "streetType" TEXT,
  "town" TEXT,
  "postcode" TEXT,
  "state" TEXT,
  "countryId" INTEGER,
  "phone" TEXT,
  "fax" TEXT,
  "email" TEXT,
  "website" TEXT,
  "remarks" TEXT,
  "closed" BOOLEAN DEFAULT false,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "timestamp" TIMESTAMPTZ,
  "syncedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bcicompanies_name ON "bciCompanies"("companyName");

-- Contacts
CREATE TABLE IF NOT EXISTS "bciContacts" (
  "contactId" BIGINT PRIMARY KEY,
  "companyId" BIGINT REFERENCES "bciCompanies"("companyId") ON DELETE SET NULL,
  "companyName" TEXT,
  "firstName" TEXT,
  "lastName" TEXT,
  "salutation" TEXT,
  "position" TEXT,
  "phone" TEXT,
  "mobile" TEXT,
  "email" TEXT,
  "resigned" BOOLEAN DEFAULT false,
  "timestamp" TIMESTAMPTZ,
  "syncedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bcicontacts_company ON "bciContacts"("companyId");
CREATE INDEX IF NOT EXISTS idx_bcicontacts_name ON "bciContacts"("lastName", "firstName");

-- Project Roles (links projects ↔ companies ↔ contacts)
CREATE TABLE IF NOT EXISTS "bciProjectRoles" (
  id BIGSERIAL PRIMARY KEY,
  "projectRefId" BIGINT REFERENCES "bciProjects"("projectRefId") ON DELETE CASCADE,
  "companyId" BIGINT,
  "contactId" BIGINT,
  "roleId" INTEGER,
  "roleGroupId" INTEGER,
  "roleName" TEXT,
  "tenderAwarded" INTEGER,
  "tenderWinner" INTEGER,
  "timestamp" TIMESTAMPTZ,
  "syncedAt" TIMESTAMPTZ DEFAULT now(),
  UNIQUE("projectRefId", "companyId", "roleId")
);

CREATE INDEX IF NOT EXISTS idx_bciprojectroles_project ON "bciProjectRoles"("projectRefId");
CREATE INDEX IF NOT EXISTS idx_bciprojectroles_company ON "bciProjectRoles"("companyId");

-- RLS policies
ALTER TABLE "bciProjects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bciCompanies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bciContacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bciProjectRoles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read bciProjects" ON "bciProjects"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage bciProjects" ON "bciProjects"
  FOR ALL TO service_role USING (true);

CREATE POLICY "Authenticated users can read bciCompanies" ON "bciCompanies"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage bciCompanies" ON "bciCompanies"
  FOR ALL TO service_role USING (true);

CREATE POLICY "Authenticated users can read bciContacts" ON "bciContacts"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage bciContacts" ON "bciContacts"
  FOR ALL TO service_role USING (true);

CREATE POLICY "Authenticated users can read bciProjectRoles" ON "bciProjectRoles"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage bciProjectRoles" ON "bciProjectRoles"
  FOR ALL TO service_role USING (true);
