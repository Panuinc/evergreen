-- =============================================================
-- Soft Delete Migration — isActive boolean
-- เพิ่ม isActive ให้ทุกตารางที่มี DELETE operation
-- Run this in Supabase SQL Editor
-- =============================================================

-- ==================== Sales / CRM ====================
ALTER TABLE "crmLead" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "crmContact" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "crmAccount" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "crmOpportunity" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "crmQuotation" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "crmQuotationLine" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "crmOrder" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "crmActivity" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;

-- ==================== HR ====================
ALTER TABLE "hrDepartment" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "hrDivision" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "hrPosition" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "hrEmployee" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;

-- ==================== IT ====================
ALTER TABLE "itAsset" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "itTicket" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "itSoftware" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "itSystemAccess" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "itNetworkDevice" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "itSecurityIncident" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "itDevRequest" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;

-- ==================== TMS ====================
ALTER TABLE "tmsVehicle" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "tmsDriver" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "tmsShipment" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "tmsFuelLog" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "tmsMaintenance" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "tmsRoute" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "tmsDelivery" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;

-- ==================== Performance ====================
ALTER TABLE "perfOkrObjective" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "perfOkrKeyResult" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "perf360Cycle" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "perf360Nomination" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "perfKpiDefinition" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "perfKpiAssignment" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;

-- ==================== RBAC ====================
ALTER TABLE "rbacRole" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "rbacPermission" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "rbacAction" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "rbacResource" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "rbacRolePermission" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "rbacUserRole" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;

-- ==================== Marketing ====================
ALTER TABLE "omConversation" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "omMessage" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;

-- ==================== Partial Indexes ====================
CREATE INDEX IF NOT EXISTS idx_crmLead_active ON "crmLead"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_crmContact_active ON "crmContact"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_crmAccount_active ON "crmAccount"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_crmOpportunity_active ON "crmOpportunity"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_crmQuotation_active ON "crmQuotation"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_crmOrder_active ON "crmOrder"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_crmActivity_active ON "crmActivity"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_hrDepartment_active ON "hrDepartment"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_hrDivision_active ON "hrDivision"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_hrPosition_active ON "hrPosition"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_hrEmployee_active ON "hrEmployee"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_itAsset_active ON "itAsset"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_itTicket_active ON "itTicket"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_itSoftware_active ON "itSoftware"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_itSystemAccess_active ON "itSystemAccess"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_itNetworkDevice_active ON "itNetworkDevice"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_itSecurityIncident_active ON "itSecurityIncident"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_itDevRequest_active ON "itDevRequest"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_tmsVehicle_active ON "tmsVehicle"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_tmsDriver_active ON "tmsDriver"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_tmsShipment_active ON "tmsShipment"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_tmsFuelLog_active ON "tmsFuelLog"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_tmsMaintenance_active ON "tmsMaintenance"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_tmsRoute_active ON "tmsRoute"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_tmsDelivery_active ON "tmsDelivery"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_perfOkrObjective_active ON "perfOkrObjective"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_perfOkrKeyResult_active ON "perfOkrKeyResult"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_perf360Cycle_active ON "perf360Cycle"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_perfKpiDefinition_active ON "perfKpiDefinition"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_perfKpiAssignment_active ON "perfKpiAssignment"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_rbacRole_active ON "rbacRole"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_rbacResource_active ON "rbacResource"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_rbacAction_active ON "rbacAction"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_rbacPermission_active ON "rbacPermission"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_omConversation_active ON "omConversation"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_omMessage_active ON "omMessage"("isActive") WHERE "isActive" = true;
