-- ============================================================
-- ERP Schema V2 — Full Redesign
-- Convention: Table = moduleEntity, Column = tableNameFieldName
-- All PKs = UUID
-- Run in Supabase MICRO > SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- RBAC MODULE (8 tables)
-- ==========================================

CREATE TABLE "rbacUserProfile" (
  "rbacUserProfileId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "rbacUserProfileEmail" text,
  "rbacUserProfileDisplayName" text,
  "rbacUserProfileAvatarUrl" text,
  "rbacUserProfileCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "rbacRole" (
  "rbacRoleId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "rbacRoleName" text NOT NULL,
  "rbacRoleDescription" text,
  "rbacRoleIsSuperadmin" boolean DEFAULT false,
  "rbacRoleCreatedAt" timestamptz DEFAULT now(),
  "rbacRoleUpdatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "rbacResource" (
  "rbacResourceId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "rbacResourceName" text NOT NULL,
  "rbacResourceDescription" text,
  "rbacResourceModuleId" text,
  "rbacResourceCreatedAt" timestamptz DEFAULT now(),
  "rbacResourceUpdatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "rbacAction" (
  "rbacActionId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "rbacActionName" text NOT NULL,
  "rbacActionDescription" text,
  "rbacActionCreatedAt" timestamptz DEFAULT now(),
  "rbacActionUpdatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "rbacPermission" (
  "rbacPermissionId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "rbacPermissionResourceId" uuid REFERENCES "rbacResource"("rbacResourceId") ON DELETE CASCADE,
  "rbacPermissionActionId" uuid REFERENCES "rbacAction"("rbacActionId") ON DELETE CASCADE,
  "rbacPermissionCreatedAt" timestamptz DEFAULT now(),
  UNIQUE ("rbacPermissionResourceId", "rbacPermissionActionId")
);

CREATE TABLE "rbacRolePermission" (
  "rbacRolePermissionId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "rbacRolePermissionRoleId" uuid NOT NULL REFERENCES "rbacRole"("rbacRoleId") ON DELETE CASCADE,
  "rbacRolePermissionPermissionId" uuid NOT NULL REFERENCES "rbacPermission"("rbacPermissionId") ON DELETE CASCADE,
  "rbacRolePermissionCreatedAt" timestamptz DEFAULT now(),
  UNIQUE ("rbacRolePermissionRoleId", "rbacRolePermissionPermissionId")
);

CREATE TABLE "rbacUserRole" (
  "rbacUserRoleId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "rbacUserRoleUserId" uuid NOT NULL,
  "rbacUserRoleRoleId" uuid NOT NULL REFERENCES "rbacRole"("rbacRoleId") ON DELETE CASCADE,
  "rbacUserRoleCreatedAt" timestamptz DEFAULT now(),
  UNIQUE ("rbacUserRoleUserId", "rbacUserRoleRoleId")
);

CREATE TABLE "rbacAccessLog" (
  "rbacAccessLogId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "rbacAccessLogUserId" uuid,
  "rbacAccessLogResource" text,
  "rbacAccessLogAction" text,
  "rbacAccessLogGranted" boolean DEFAULT false,
  "rbacAccessLogMetadata" jsonb,
  "rbacAccessLogCreatedAt" timestamptz DEFAULT now()
);

-- ==========================================
-- HR MODULE (4 tables)
-- ==========================================

CREATE TABLE "hrDivision" (
  "hrDivisionId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "hrDivisionName" text NOT NULL,
  "hrDivisionDescription" text,
  "hrDivisionCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "hrDepartment" (
  "hrDepartmentId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "hrDepartmentName" text NOT NULL,
  "hrDepartmentDescription" text,
  "hrDepartmentDivision" text,
  "hrDepartmentDivisionId" uuid REFERENCES "hrDivision"("hrDivisionId") ON DELETE SET NULL,
  "hrDepartmentCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "hrPosition" (
  "hrPositionId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "hrPositionTitle" text NOT NULL,
  "hrPositionDescription" text,
  "hrPositionDepartment" text,
  "hrPositionCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "hrEmployee" (
  "hrEmployeeId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "hrEmployeeFirstName" text,
  "hrEmployeeLastName" text,
  "hrEmployeeEmail" text,
  "hrEmployeePhone" text,
  "hrEmployeeDivision" text,
  "hrEmployeeDepartment" text,
  "hrEmployeePosition" text,
  "hrEmployeeStatus" text DEFAULT 'active',
  "hrEmployeeUserId" uuid,
  "hrEmployeeCreatedAt" timestamptz DEFAULT now(),
  "hrEmployeeUpdatedAt" timestamptz DEFAULT now()
);

-- ==========================================
-- TMS MODULE (8 tables)
-- ==========================================

CREATE TABLE "tmsVehicle" (
  "tmsVehicleId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "tmsVehiclePlateNumber" text,
  "tmsVehicleName" text,
  "tmsVehicleType" text DEFAULT 'truck',
  "tmsVehicleBrand" text,
  "tmsVehicleModel" text,
  "tmsVehicleYear" integer,
  "tmsVehicleColor" text,
  "tmsVehicleVinNumber" text,
  "tmsVehicleRegistrationExpiry" date,
  "tmsVehicleInsuranceExpiry" date,
  "tmsVehicleInsurancePolicy" text,
  "tmsVehicleActExpiry" date,
  "tmsVehicleCapacityKg" numeric,
  "tmsVehicleFuelType" text DEFAULT 'diesel',
  "tmsVehicleCurrentMileage" numeric DEFAULT 0,
  "tmsVehicleStatus" text DEFAULT 'available',
  "tmsVehicleNotes" text,
  "tmsVehicleCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "tmsDriver" (
  "tmsDriverId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "tmsDriverFirstName" text,
  "tmsDriverLastName" text,
  "tmsDriverPhone" text,
  "tmsDriverLicenseNumber" text,
  "tmsDriverLicenseType" text,
  "tmsDriverLicenseExpiry" date,
  "tmsDriverRole" text,
  "tmsDriverStatus" text DEFAULT 'active',
  "tmsDriverCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "tmsRoute" (
  "tmsRouteId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "tmsRouteName" text,
  "tmsRouteOrigin" text,
  "tmsRouteDestination" text,
  "tmsRouteDistance" numeric,
  "tmsRouteEstimatedTime" text,
  "tmsRouteCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "tmsShipment" (
  "tmsShipmentId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "tmsShipmentNumber" text,
  "tmsShipmentCustomerName" text,
  "tmsShipmentCustomerPhone" text,
  "tmsShipmentCustomerAddress" text,
  "tmsShipmentDestination" text,
  "tmsShipmentRouteId" uuid REFERENCES "tmsRoute"("tmsRouteId") ON DELETE SET NULL,
  "tmsShipmentVehicleId" uuid REFERENCES "tmsVehicle"("tmsVehicleId") ON DELETE SET NULL,
  "tmsShipmentDriverId" uuid REFERENCES "tmsDriver"("tmsDriverId") ON DELETE SET NULL,
  "tmsShipmentAssistantId" uuid REFERENCES "tmsDriver"("tmsDriverId") ON DELETE SET NULL,
  "tmsShipmentSalesOrderRef" text,
  "tmsShipmentItemsSummary" text,
  "tmsShipmentWeightKg" numeric,
  "tmsShipmentNotes" text,
  "tmsShipmentEstimatedArrival" timestamptz,
  "tmsShipmentStatus" text DEFAULT 'pending',
  "tmsShipmentDate" date,
  "tmsShipmentCreatedBy" uuid,
  "tmsShipmentCreatedAt" timestamptz DEFAULT now(),
  "tmsShipmentDispatchedAt" timestamptz,
  "tmsShipmentDeliveredAt" timestamptz
);

CREATE TABLE "tmsDelivery" (
  "tmsDeliveryId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "tmsDeliveryShipmentId" uuid REFERENCES "tmsShipment"("tmsShipmentId") ON DELETE CASCADE,
  "tmsDeliveryStatus" text DEFAULT 'pending',
  "tmsDeliveryCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "tmsFuelLog" (
  "tmsFuelLogId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "tmsFuelLogVehicleId" uuid REFERENCES "tmsVehicle"("tmsVehicleId") ON DELETE CASCADE,
  "tmsFuelLogDate" date,
  "tmsFuelLogFuelType" text,
  "tmsFuelLogLiters" numeric,
  "tmsFuelLogPricePerLiter" numeric,
  "tmsFuelLogTotalCost" numeric,
  "tmsFuelLogMileage" numeric,
  "tmsFuelLogStation" text,
  "tmsFuelLogCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "tmsGpsLog" (
  "tmsGpsLogId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "tmsGpsLogVehicleId" uuid REFERENCES "tmsVehicle"("tmsVehicleId") ON DELETE CASCADE,
  "tmsGpsLogShipmentId" uuid REFERENCES "tmsShipment"("tmsShipmentId") ON DELETE SET NULL,
  "tmsGpsLogLatitude" numeric,
  "tmsGpsLogLongitude" numeric,
  "tmsGpsLogSpeed" numeric,
  "tmsGpsLogRecordedAt" timestamptz DEFAULT now(),
  "tmsGpsLogCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "tmsMaintenance" (
  "tmsMaintenanceId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "tmsMaintenanceVehicleId" uuid REFERENCES "tmsVehicle"("tmsVehicleId") ON DELETE CASCADE,
  "tmsMaintenanceType" text,
  "tmsMaintenanceDescription" text,
  "tmsMaintenanceDate" date,
  "tmsMaintenanceStatus" text DEFAULT 'pending',
  "tmsMaintenanceCost" numeric,
  "tmsMaintenanceVendor" text,
  "tmsMaintenanceNextDueDate" date,
  "tmsMaintenanceNextDueMileage" numeric,
  "tmsMaintenanceCreatedAt" timestamptz DEFAULT now()
);

-- ==========================================
-- IT MODULE (8 tables)
-- ==========================================

CREATE TABLE "itAsset" (
  "itAssetId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "itAssetName" text,
  "itAssetTag" text,
  "itAssetCategory" text DEFAULT 'computer',
  "itAssetBrand" text,
  "itAssetModel" text,
  "itAssetSerialNumber" text,
  "itAssetStatus" text DEFAULT 'active',
  "itAssetAssignedTo" text,
  "itAssetPurchaseDate" date,
  "itAssetWarrantyExpiry" date,
  "itAssetCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "itTicket" (
  "itTicketId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "itTicketNo" text,
  "itTicketTitle" text,
  "itTicketDescription" text,
  "itTicketCategory" text DEFAULT 'other',
  "itTicketPriority" text DEFAULT 'medium',
  "itTicketStatus" text DEFAULT 'open',
  "itTicketRequestedBy" text,
  "itTicketAssignedTo" text,
  "itTicketNotes" text,
  "itTicketCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "itSystemAccess" (
  "itSystemAccessId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "itSystemAccessSystem" text,
  "itSystemAccessRequestedFor" text,
  "itSystemAccessRequestedBy" text,
  "itSystemAccessStatus" text DEFAULT 'pending',
  "itSystemAccessCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "itNetworkDevice" (
  "itNetworkDeviceId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "itNetworkDeviceName" text,
  "itNetworkDeviceIpAddress" text,
  "itNetworkDeviceLocation" text,
  "itNetworkDeviceType" text,
  "itNetworkDeviceStatus" text DEFAULT 'online',
  "itNetworkDeviceCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "itSoftware" (
  "itSoftwareId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "itSoftwareName" text,
  "itSoftwareVendor" text,
  "itSoftwareLicenseKey" text,
  "itSoftwareLicenseType" text,
  "itSoftwareStatus" text DEFAULT 'active',
  "itSoftwareExpiryDate" date,
  "itSoftwareCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "itSecurityIncident" (
  "itSecurityIncidentId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "itSecurityIncidentTitle" text,
  "itSecurityIncidentStatus" text DEFAULT 'open',
  "itSecurityIncidentSeverity" text,
  "itSecurityIncidentReportedBy" text,
  "itSecurityIncidentAssignedTo" text,
  "itSecurityIncidentCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "itDevRequest" (
  "itDevRequestId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "itDevRequestNo" text,
  "itDevRequestTitle" text,
  "itDevRequestDescription" text,
  "itDevRequestRequestedBy" text,
  "itDevRequestAssignedTo" text,
  "itDevRequestStatus" text DEFAULT 'pending',
  "itDevRequestProgress" integer DEFAULT 0,
  "itDevRequestDueDate" date,
  "itDevRequestCompletedAt" timestamptz,
  "itDevRequestCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "itDevProgressLog" (
  "itDevProgressLogId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "itDevProgressLogRequestId" uuid REFERENCES "itDevRequest"("itDevRequestId") ON DELETE CASCADE,
  "itDevProgressLogProgress" integer DEFAULT 0,
  "itDevProgressLogNote" text,
  "itDevProgressLogDescription" text,
  "itDevProgressLogCreatedBy" text,
  "itDevProgressLogCreatedAt" timestamptz DEFAULT now()
);

-- ==========================================
-- CRM / SALES MODULE (9 tables)
-- ==========================================

CREATE TABLE "crmAccount" (
  "crmAccountId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "crmAccountName" text,
  "crmAccountIndustry" text,
  "crmAccountEmail" text,
  "crmAccountPhone" text,
  "crmAccountWebsite" text,
  "crmAccountAddress" text,
  "crmAccountCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "crmContact" (
  "crmContactId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "crmContactFirstName" text,
  "crmContactLastName" text,
  "crmContactEmail" text,
  "crmContactPhone" text,
  "crmContactPosition" text,
  "crmContactAccountId" uuid REFERENCES "crmAccount"("crmAccountId") ON DELETE SET NULL,
  "crmContactNotes" text,
  "crmContactCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "crmLead" (
  "crmLeadId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "crmLeadNo" text,
  "crmLeadName" text,
  "crmLeadEmail" text,
  "crmLeadPhone" text,
  "crmLeadCompany" text,
  "crmLeadPosition" text,
  "crmLeadSource" text,
  "crmLeadScore" text DEFAULT 'warm',
  "crmLeadStatus" text DEFAULT 'new',
  "crmLeadAssignedTo" text,
  "crmLeadNotes" text,
  "crmLeadConvertedContactId" uuid REFERENCES "crmContact"("crmContactId") ON DELETE SET NULL,
  "crmLeadConvertedOpportunityId" uuid,
  "crmLeadCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "crmOpportunity" (
  "crmOpportunityId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "crmOpportunityName" text,
  "crmOpportunityStage" text DEFAULT 'prospecting',
  "crmOpportunityAmount" numeric DEFAULT 0,
  "crmOpportunityProbability" integer DEFAULT 0,
  "crmOpportunityExpectedCloseDate" date,
  "crmOpportunityActualCloseDate" date,
  "crmOpportunityContactId" uuid REFERENCES "crmContact"("crmContactId") ON DELETE SET NULL,
  "crmOpportunityAccountId" uuid REFERENCES "crmAccount"("crmAccountId") ON DELETE SET NULL,
  "crmOpportunityAssignedTo" text,
  "crmOpportunitySource" text,
  "crmOpportunityNotes" text,
  "crmOpportunityCreatedAt" timestamptz DEFAULT now()
);

-- Add FK for crmLead → crmOpportunity after crmOpportunity exists
ALTER TABLE "crmLead" ADD CONSTRAINT "crmLead_convertedOpp_fkey"
  FOREIGN KEY ("crmLeadConvertedOpportunityId") REFERENCES "crmOpportunity"("crmOpportunityId") ON DELETE SET NULL;

CREATE TABLE "crmQuotation" (
  "crmQuotationId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "crmQuotationNo" text,
  "crmQuotationStatus" text DEFAULT 'draft',
  "crmQuotationOpportunityId" uuid REFERENCES "crmOpportunity"("crmOpportunityId") ON DELETE SET NULL,
  "crmQuotationContactId" uuid REFERENCES "crmContact"("crmContactId") ON DELETE SET NULL,
  "crmQuotationAccountId" uuid REFERENCES "crmAccount"("crmAccountId") ON DELETE SET NULL,
  "crmQuotationSubtotal" numeric DEFAULT 0,
  "crmQuotationDiscount" numeric DEFAULT 0,
  "crmQuotationTax" numeric DEFAULT 0,
  "crmQuotationTotal" numeric DEFAULT 0,
  "crmQuotationApprovedBy" text,
  "crmQuotationApprovalNote" text,
  "crmQuotationNotes" text,
  "crmQuotationCreatedBy" text,
  "crmQuotationCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "crmQuotationLine" (
  "crmQuotationLineId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "crmQuotationLineQuotationId" uuid REFERENCES "crmQuotation"("crmQuotationId") ON DELETE CASCADE,
  "crmQuotationLineOrder" integer,
  "crmQuotationLineProductName" text,
  "crmQuotationLineDescription" text,
  "crmQuotationLineQuantity" numeric DEFAULT 0,
  "crmQuotationLineUnitPrice" numeric DEFAULT 0,
  "crmQuotationLineDiscount" numeric DEFAULT 0,
  "crmQuotationLineAmount" numeric DEFAULT 0
);

CREATE TABLE "crmOrder" (
  "crmOrderId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "crmOrderNo" text,
  "crmOrderQuotationId" uuid REFERENCES "crmQuotation"("crmQuotationId") ON DELETE SET NULL,
  "crmOrderOpportunityId" uuid REFERENCES "crmOpportunity"("crmOpportunityId") ON DELETE SET NULL,
  "crmOrderContactId" uuid REFERENCES "crmContact"("crmContactId") ON DELETE SET NULL,
  "crmOrderAccountId" uuid REFERENCES "crmAccount"("crmAccountId") ON DELETE SET NULL,
  "crmOrderStatus" text DEFAULT 'pending',
  "crmOrderSubtotal" numeric DEFAULT 0,
  "crmOrderDiscount" numeric DEFAULT 0,
  "crmOrderTax" numeric DEFAULT 0,
  "crmOrderTotal" numeric DEFAULT 0,
  "crmOrderShippingAddress" text,
  "crmOrderTrackingNumber" text,
  "crmOrderNotes" text,
  "crmOrderCreatedBy" text,
  "crmOrderCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "crmActivity" (
  "crmActivityId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "crmActivityType" text,
  "crmActivityStatus" text DEFAULT 'pending',
  "crmActivitySubject" text,
  "crmActivityDueDate" date,
  "crmActivityContactId" uuid REFERENCES "crmContact"("crmContactId") ON DELETE SET NULL,
  "crmActivityOpportunityId" uuid REFERENCES "crmOpportunity"("crmOpportunityId") ON DELETE SET NULL,
  "crmActivityAccountId" uuid REFERENCES "crmAccount"("crmAccountId") ON DELETE SET NULL,
  "crmActivityCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "crmPipelineStage" (
  "crmPipelineStageId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "crmPipelineStageName" text,
  "crmPipelineStageColor" text,
  "crmPipelineStageOrder" integer,
  "crmPipelineStageCreatedAt" timestamptz DEFAULT now()
);

-- ==========================================
-- OMNICHANNEL MODULE (8 tables)
-- ==========================================

CREATE TABLE "omChannel" (
  "omChannelId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "omChannelType" text UNIQUE,
  "omChannelName" text,
  "omChannelAccessToken" text,
  "omChannelPageId" text,
  "omChannelSecret" text,
  "omChannelStatus" text DEFAULT 'inactive',
  "omChannelCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "omContact" (
  "omContactId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "omContactChannelType" text,
  "omContactExternalId" text,
  "omContactDisplayName" text,
  "omContactAvatarUrl" text,
  "omContactNotes" text,
  "omContactCreatedAt" timestamptz DEFAULT now(),
  UNIQUE ("omContactChannelType", "omContactExternalId")
);

CREATE TABLE "omConversation" (
  "omConversationId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "omConversationContactId" uuid REFERENCES "omContact"("omContactId") ON DELETE SET NULL,
  "omConversationChannelType" text,
  "omConversationStatus" text DEFAULT 'open',
  "omConversationLastMessageAt" timestamptz,
  "omConversationLastMessagePreview" text,
  "omConversationUnreadCount" integer DEFAULT 0,
  "omConversationAiAutoReply" boolean DEFAULT true,
  "omConversationAssignedTo" text,
  "omConversationCreatedAt" timestamptz DEFAULT now(),
  "omConversationUpdatedAt" timestamptz
);

CREATE TABLE "omMessage" (
  "omMessageId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "omMessageConversationId" uuid REFERENCES "omConversation"("omConversationId") ON DELETE CASCADE,
  "omMessageSenderType" text,
  "omMessageSenderId" text,
  "omMessageContent" text,
  "omMessageType" text DEFAULT 'text',
  "omMessageExternalId" text,
  "omMessageMetadata" jsonb,
  "omMessageImageUrl" text,
  "omMessageIsAi" boolean DEFAULT false,
  "omMessageOcrData" jsonb,
  "omMessageCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "omQuotation" (
  "omQuotationId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "omQuotationConversationId" uuid REFERENCES "omConversation"("omConversationId") ON DELETE SET NULL,
  "omQuotationContactId" uuid REFERENCES "omContact"("omContactId") ON DELETE SET NULL,
  "omQuotationNumber" text,
  "omQuotationNo" text,
  "omQuotationStatus" text DEFAULT 'draft',
  "omQuotationCustomerName" text,
  "omQuotationCustomerPhone" text,
  "omQuotationCustomerAddress" text,
  "omQuotationPaymentMethod" text,
  "omQuotationNotes" text,
  "omQuotationSubmittedBy" uuid,
  "omQuotationApprovedBy" uuid,
  "omQuotationApprovalNote" text,
  "omQuotationUpdatedAt" timestamptz,
  "omQuotationCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "omQuotationLine" (
  "omQuotationLineId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "omQuotationLineQuotationId" uuid REFERENCES "omQuotation"("omQuotationId") ON DELETE CASCADE,
  "omQuotationLineOrder" integer,
  "omQuotationLineProductName" text,
  "omQuotationLineVariant" text,
  "omQuotationLineQuantity" numeric DEFAULT 0,
  "omQuotationLineUnitPrice" numeric DEFAULT 0,
  "omQuotationLineAmount" numeric DEFAULT 0
);

CREATE TABLE "omPriceItem" (
  "omPriceItemId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "omPriceItemNumber" text UNIQUE,
  "omPriceItemName" text,
  "omPriceItemUnitPrice" numeric DEFAULT 0,
  "omPriceItemUpdatedAt" timestamptz DEFAULT now(),
  "omPriceItemUpdatedBy" uuid
);

CREATE TABLE "omAiSetting" (
  "omAiSettingId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "omAiSettingSystemPrompt" text,
  "omAiSettingModel" text DEFAULT 'google/gemini-2.5-flash-lite',
  "omAiSettingTemperature" numeric DEFAULT 0.3,
  "omAiSettingMaxHistoryMessages" integer DEFAULT 20,
  "omAiSettingBankAccountInfo" text,
  "omAiSettingUpdatedAt" timestamptz DEFAULT now(),
  "omAiSettingCreatedAt" timestamptz DEFAULT now()
);

-- ==========================================
-- PERFORMANCE MODULE (12 tables)
-- ==========================================

CREATE TABLE "perfEvaluation" (
  "perfEvaluationId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "perfEvaluationEvaluatorId" uuid,
  "perfEvaluationEvaluateeEmployeeId" text,
  "perfEvaluationPeriod" text,
  "perfEvaluationYear" integer,
  "perfEvaluationQuarter" integer,
  "perfEvaluationScores" jsonb,
  "perfEvaluationCategoryAverages" jsonb,
  "perfEvaluationOverallScore" numeric,
  "perfEvaluationGrade" text,
  "perfEvaluationComment" text,
  "perfEvaluationStatus" text DEFAULT 'submitted',
  "perfEvaluationCreatedAt" timestamptz DEFAULT now(),
  "perfEvaluationUpdatedAt" timestamptz
);

CREATE TABLE "perfEvaluationFeedback" (
  "perfEvaluationFeedbackId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "perfEvaluationFeedbackEmployeeId" text,
  "perfEvaluationFeedbackPeriod" text,
  "perfEvaluationFeedbackCategoryAverages" jsonb,
  "perfEvaluationFeedbackOverallScore" numeric,
  "perfEvaluationFeedbackGrade" text,
  "perfEvaluationFeedbackCompanyAverages" jsonb,
  "perfEvaluationFeedbackEvaluatorCount" integer,
  "perfEvaluationFeedbackFeedback" text,
  "perfEvaluationFeedbackGeneratedBy" uuid,
  "perfEvaluationFeedbackCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "perfOkrObjective" (
  "perfOkrObjectiveId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "perfOkrObjectiveEmployeeId" text,
  "perfOkrObjectiveTitle" text,
  "perfOkrObjectiveDescription" text,
  "perfOkrObjectiveYear" integer,
  "perfOkrObjectiveQuarter" integer,
  "perfOkrObjectivePeriod" text,
  "perfOkrObjectiveVisibility" text DEFAULT 'team',
  "perfOkrObjectiveStatus" text DEFAULT 'active',
  "perfOkrObjectiveParentObjectiveId" uuid REFERENCES "perfOkrObjective"("perfOkrObjectiveId") ON DELETE SET NULL,
  "perfOkrObjectiveProgress" numeric DEFAULT 0,
  "perfOkrObjectiveCreatedBy" uuid,
  "perfOkrObjectiveCreatedAt" timestamptz DEFAULT now(),
  "perfOkrObjectiveUpdatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "perfOkrKeyResult" (
  "perfOkrKeyResultId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "perfOkrKeyResultObjectiveId" uuid REFERENCES "perfOkrObjective"("perfOkrObjectiveId") ON DELETE CASCADE,
  "perfOkrKeyResultTitle" text,
  "perfOkrKeyResultMetricType" text DEFAULT 'number',
  "perfOkrKeyResultStartValue" numeric DEFAULT 0,
  "perfOkrKeyResultTargetValue" numeric DEFAULT 100,
  "perfOkrKeyResultCurrentValue" numeric DEFAULT 0,
  "perfOkrKeyResultUnit" text,
  "perfOkrKeyResultWeight" numeric DEFAULT 1,
  "perfOkrKeyResultSortOrder" integer DEFAULT 0,
  "perfOkrKeyResultStatus" text DEFAULT 'not_started',
  "perfOkrKeyResultUpdatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "perfOkrCheckin" (
  "perfOkrCheckinId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "perfOkrCheckinKeyResultId" uuid REFERENCES "perfOkrKeyResult"("perfOkrKeyResultId") ON DELETE CASCADE,
  "perfOkrCheckinPreviousValue" numeric,
  "perfOkrCheckinNewValue" numeric,
  "perfOkrCheckinNote" text,
  "perfOkrCheckinCreatedBy" uuid,
  "perfOkrCheckinCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "perfKpiDefinition" (
  "perfKpiDefinitionId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "perfKpiDefinitionName" text,
  "perfKpiDefinitionDescription" text,
  "perfKpiDefinitionCategory" text DEFAULT 'general',
  "perfKpiDefinitionUnit" text,
  "perfKpiDefinitionFrequency" text DEFAULT 'monthly',
  "perfKpiDefinitionTargetValue" numeric,
  "perfKpiDefinitionWarningThreshold" numeric,
  "perfKpiDefinitionCriticalThreshold" numeric,
  "perfKpiDefinitionHigherIsBetter" boolean DEFAULT true,
  "perfKpiDefinitionIsActive" boolean DEFAULT true,
  "perfKpiDefinitionCreatedBy" uuid,
  "perfKpiDefinitionCreatedAt" timestamptz DEFAULT now(),
  "perfKpiDefinitionUpdatedAt" timestamptz
);

CREATE TABLE "perfKpiAssignment" (
  "perfKpiAssignmentId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "perfKpiAssignmentDefinitionId" uuid REFERENCES "perfKpiDefinition"("perfKpiDefinitionId") ON DELETE CASCADE,
  "perfKpiAssignmentEmployeeId" text,
  "perfKpiAssignmentYear" integer,
  "perfKpiAssignmentTargetValue" numeric,
  "perfKpiAssignmentWeight" numeric DEFAULT 1,
  "perfKpiAssignmentCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "perfKpiRecord" (
  "perfKpiRecordId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "perfKpiRecordAssignmentId" uuid REFERENCES "perfKpiAssignment"("perfKpiAssignmentId") ON DELETE CASCADE,
  "perfKpiRecordPeriodLabel" text,
  "perfKpiRecordActualValue" numeric,
  "perfKpiRecordNote" text,
  "perfKpiRecordRecordedBy" uuid
);

CREATE TABLE "perf360Cycle" (
  "perf360CycleId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "perf360CycleName" text,
  "perf360CycleDescription" text,
  "perf360CycleYear" integer,
  "perf360CycleQuarter" integer,
  "perf360CycleStatus" text DEFAULT 'active',
  "perf360CycleResponseDeadline" date,
  "perf360CycleAnonymousToReviewee" boolean DEFAULT true,
  "perf360CycleCreatedBy" uuid,
  "perf360CycleCreatedAt" timestamptz DEFAULT now(),
  "perf360CycleUpdatedAt" timestamptz
);

CREATE TABLE "perf360Competency" (
  "perf360CompetencyId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "perf360CompetencyCycleId" uuid REFERENCES "perf360Cycle"("perf360CycleId") ON DELETE CASCADE,
  "perf360CompetencyName" text,
  "perf360CompetencyDescription" text,
  "perf360CompetencyQuestions" jsonb,
  "perf360CompetencyWeight" numeric DEFAULT 1,
  "perf360CompetencySortOrder" integer DEFAULT 0
);

CREATE TABLE "perf360Nomination" (
  "perf360NominationId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "perf360NominationCycleId" uuid REFERENCES "perf360Cycle"("perf360CycleId") ON DELETE CASCADE,
  "perf360NominationRevieweeEmployeeId" text,
  "perf360NominationReviewerEmployeeId" text,
  "perf360NominationRelationshipType" text,
  "perf360NominationStatus" text DEFAULT 'pending',
  "perf360NominationCompletedAt" timestamptz,
  "perf360NominationCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "perf360Response" (
  "perf360ResponseId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "perf360ResponseNominationId" uuid REFERENCES "perf360Nomination"("perf360NominationId") ON DELETE CASCADE,
  "perf360ResponseCycleId" uuid REFERENCES "perf360Cycle"("perf360CycleId") ON DELETE CASCADE,
  "perf360ResponseRevieweeEmployeeId" text,
  "perf360ResponseReviewerEmployeeId" text,
  "perf360ResponseRelationshipType" text,
  "perf360ResponseScores" jsonb,
  "perf360ResponseCompetencyAverages" jsonb,
  "perf360ResponseOverallScore" numeric,
  "perf360ResponseStrengthComment" text,
  "perf360ResponseImprovementComment" text,
  "perf360ResponseComment" text
);

-- ==========================================
-- WAREHOUSE MODULE (5 tables)
-- ==========================================

CREATE TABLE "whScanSession" (
  "whScanSessionId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "whScanSessionUserId" uuid,
  "whScanSessionName" text,
  "whScanSessionType" text,
  "whScanSessionStartedAt" timestamptz DEFAULT now(),
  "whScanSessionEndedAt" timestamptz,
  "whScanSessionGpsLat" numeric,
  "whScanSessionGpsLon" numeric,
  "whScanSessionTagCount" integer DEFAULT 0,
  "whScanSessionTotalReads" integer DEFAULT 0,
  "whScanSessionMetadata" jsonb
);

CREATE TABLE "whScanRecord" (
  "whScanRecordId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "whScanRecordSessionId" uuid REFERENCES "whScanSession"("whScanSessionId") ON DELETE CASCADE,
  "whScanRecordEpc" text,
  "whScanRecordRssi" numeric,
  "whScanRecordItemNumber" text,
  "whScanRecordItemName" text,
  "whScanRecordPhotoUrl" text,
  "whScanRecordReadCount" integer DEFAULT 1,
  "whScanRecordScannedAt" timestamptz DEFAULT now()
);

CREATE TABLE "whOrderMatch" (
  "whOrderMatchId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "whOrderMatchUserId" uuid,
  "whOrderMatchOrderNumber" text,
  "whOrderMatchOrderType" text,
  "whOrderMatchExpectedItems" jsonb,
  "whOrderMatchScannedItems" jsonb,
  "whOrderMatchSessionId" uuid REFERENCES "whScanSession"("whScanSessionId") ON DELETE SET NULL,
  "whOrderMatchStatus" text DEFAULT 'pending',
  "whOrderMatchCreatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "whTransfer" (
  "whTransferId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "whTransferUserId" uuid,
  "whTransferNo" text,
  "whTransferFromLocation" text,
  "whTransferToLocation" text,
  "whTransferSessionId" uuid REFERENCES "whScanSession"("whScanSessionId") ON DELETE SET NULL,
  "whTransferNotes" text,
  "whTransferGpsLat" numeric,
  "whTransferGpsLon" numeric,
  "whTransferStatus" text DEFAULT 'pending',
  "whTransferCreatedAt" timestamptz DEFAULT now(),
  "whTransferCompletedAt" timestamptz
);

CREATE TABLE "whAppVersion" (
  "whAppVersionId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "whAppVersionCode" integer,
  "whAppVersionName" text,
  "whAppVersionDownloadUrl" text,
  "whAppVersionReleaseNotes" text,
  "whAppVersionCreatedAt" timestamptz DEFAULT now()
);

-- ==========================================
-- BC MODULE (6 tables) — UUID PK + External ID
-- ==========================================

CREATE TABLE "bcCustomer" (
  "bcCustomerId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "bcCustomerExternalId" text UNIQUE,
  "bcCustomerNumber" text,
  "bcCustomerDisplayName" text,
  "bcCustomerPhoneNumber" text,
  "bcCustomerContact" text,
  "bcCustomerBalanceDue" numeric DEFAULT 0,
  "bcCustomerBalance" numeric DEFAULT 0,
  "bcCustomerSalespersonCode" text,
  "bcCustomerSyncedAt" timestamptz DEFAULT now()
);

CREATE TABLE "bcItem" (
  "bcItemId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "bcItemExternalId" text UNIQUE,
  "bcItemNumber" text,
  "bcItemDisplayName" text,
  "bcItemType" text,
  "bcItemInventory" numeric DEFAULT 0,
  "bcItemUnitPrice" numeric DEFAULT 0,
  "bcItemUnitCost" numeric DEFAULT 0,
  "bcItemCategoryCode" text,
  "bcItemGeneralProductPostingGroupCode" text,
  "bcItemBlocked" boolean DEFAULT false,
  "bcItemBaseUnitOfMeasure" text,
  "bcItemProjectCode" text,
  "bcItemProjectName" text,
  "bcItemRfidCode" text,
  "bcItemSyncedAt" timestamptz DEFAULT now()
);

CREATE TABLE "bcSalesOrder" (
  "bcSalesOrderId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "bcSalesOrderExternalId" text UNIQUE,
  "bcSalesOrderNumber" text,
  "bcSalesOrderDocumentType" text,
  "bcSalesOrderCustomerNumber" text,
  "bcSalesOrderCustomerName" text,
  "bcSalesOrderSellToAddress" text,
  "bcSalesOrderSellToCity" text,
  "bcSalesOrderSellToPostCode" text,
  "bcSalesOrderShipToName" text,
  "bcSalesOrderShipToAddress" text,
  "bcSalesOrderShipToCity" text,
  "bcSalesOrderShipToPostCode" text,
  "bcSalesOrderOrderDate" date,
  "bcSalesOrderDueDate" date,
  "bcSalesOrderStatus" text,
  "bcSalesOrderCompletelyShipped" boolean DEFAULT false,
  "bcSalesOrderSalespersonCode" text,
  "bcSalesOrderExternalDocumentNumber" text,
  "bcSalesOrderTotalAmountIncludingTax" numeric DEFAULT 0,
  "bcSalesOrderSyncedAt" timestamptz DEFAULT now()
);

CREATE TABLE "bcSalesOrderLine" (
  "bcSalesOrderLineId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "bcSalesOrderLineExternalId" text UNIQUE,
  "bcSalesOrderLineDocumentNo" text,
  "bcSalesOrderLineLineNo" integer,
  "bcSalesOrderLineType" text,
  "bcSalesOrderLineObjectNumber" text,
  "bcSalesOrderLineDescription" text,
  "bcSalesOrderLineQuantity" numeric DEFAULT 0,
  "bcSalesOrderLineUnitPrice" numeric DEFAULT 0,
  "bcSalesOrderLineAmountIncludingTax" numeric DEFAULT 0,
  "bcSalesOrderLineQuantityShipped" numeric DEFAULT 0,
  "bcSalesOrderLineOutstandingQuantity" numeric DEFAULT 0,
  "bcSalesOrderLineUnitOfMeasureCode" text,
  "bcSalesOrderLineLocationCode" text,
  "bcSalesOrderLineProjectCode" text,
  "bcSalesOrderLineProjectName" text,
  "bcSalesOrderLineSyncedAt" timestamptz DEFAULT now()
);

CREATE TABLE "bcItemLedgerEntry" (
  "bcItemLedgerEntryId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "bcItemLedgerEntryExternalId" text UNIQUE,
  "bcItemLedgerEntryEntryNo" integer,
  "bcItemLedgerEntryPostingDate" date,
  "bcItemLedgerEntryDocumentDate" date,
  "bcItemLedgerEntryEntryType" text,
  "bcItemLedgerEntryDocumentType" text,
  "bcItemLedgerEntryDocumentNo" text,
  "bcItemLedgerEntryItemNo" text,
  "bcItemLedgerEntryItemDescription" text,
  "bcItemLedgerEntryEmployeeCode" text,
  "bcItemLedgerEntryEmployeeName" text,
  "bcItemLedgerEntryDescription2" text,
  "bcItemLedgerEntryLocationCode" text,
  "bcItemLedgerEntryLotNo" text,
  "bcItemLedgerEntrySerialNo" text,
  "bcItemLedgerEntryExpirationDate" date,
  "bcItemLedgerEntryQuantity" numeric DEFAULT 0,
  "bcItemLedgerEntryUnitOfMeasureCode" text,
  "bcItemLedgerEntryRemainingQuantity" numeric DEFAULT 0,
  "bcItemLedgerEntryInvoicedQuantity" numeric DEFAULT 0,
  "bcItemLedgerEntryCompletelyInvoiced" boolean DEFAULT false,
  "bcItemLedgerEntryUnitCostExpected" numeric DEFAULT 0,
  "bcItemLedgerEntryCostAmountExpected" numeric DEFAULT 0,
  "bcItemLedgerEntryUnitCostActual" numeric DEFAULT 0,
  "bcItemLedgerEntryCostAmountActual" numeric DEFAULT 0,
  "bcItemLedgerEntrySalesAmountExpected" numeric DEFAULT 0,
  "bcItemLedgerEntrySalesAmountActual" numeric DEFAULT 0,
  "bcItemLedgerEntryOpen" boolean DEFAULT true,
  "bcItemLedgerEntryGlobalDimension1Code" text,
  "bcItemLedgerEntryGlobalDimension1Name" text,
  "bcItemLedgerEntryGlobalDimension2Code" text,
  "bcItemLedgerEntryGlobalDimension2Name" text,
  "bcItemLedgerEntryOrderType" text,
  "bcItemLedgerEntryOrderLineNo" integer,
  "bcItemLedgerEntryDocumentLineNo" integer,
  "bcItemLedgerEntryVariantCode" text,
  "bcItemLedgerEntryBinCode" text,
  "bcItemLedgerEntryBaseUnitOfMeasure" text,
  "bcItemLedgerEntryTotalGrossWeight" numeric DEFAULT 0,
  "bcItemLedgerEntryTotalNetWeight" numeric DEFAULT 0,
  "bcItemLedgerEntryCreatedBy" text,
  "bcItemLedgerEntrySyncedAt" timestamptz DEFAULT now()
);

CREATE TABLE "bcProductionOrder" (
  "bcProductionOrderId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "bcProductionOrderExternalId" text UNIQUE,
  "bcProductionOrderStatus" text,
  "bcProductionOrderDescription" text,
  "bcProductionOrderDescription2" text,
  "bcProductionOrderSourceNo" text,
  "bcProductionOrderRoutingNo" text,
  "bcProductionOrderQuantity" numeric DEFAULT 0,
  "bcProductionOrderDimension1Code" text,
  "bcProductionOrderDimension1Name" text,
  "bcProductionOrderDimension2Code" text,
  "bcProductionOrderDimension2Name" text,
  "bcProductionOrderLocationCode" text,
  "bcProductionOrderStartingDateTime" timestamptz,
  "bcProductionOrderEndingDateTime" timestamptz,
  "bcProductionOrderDueDate" date,
  "bcProductionOrderRemainingConsumption" numeric DEFAULT 0,
  "bcProductionOrderAssignedUserId" text,
  "bcProductionOrderFinishedDate" date,
  "bcProductionOrderSearchDescription" text,
  "bcProductionOrderSyncedAt" timestamptz DEFAULT now()
);

-- ==========================================
-- BCI MODULE (1 table) — UUID PK + External ID
-- ==========================================

CREATE TABLE "bciProject" (
  "bciProjectId" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "bciProjectExternalId" integer UNIQUE,
  "bciProjectName" text,
  "bciProjectType" text,
  "bciProjectDescription" text,
  "bciProjectStreetName" text,
  "bciProjectCityOrTown" text,
  "bciProjectStateProvince" text,
  "bciProjectRegion" text,
  "bciProjectCountry" text,
  "bciProjectValue" numeric,
  "bciProjectCurrency" text,
  "bciProjectStage" text,
  "bciProjectStageStatus" text,
  "bciProjectDevelopmentType" text,
  "bciProjectOwnershipType" text,
  "bciProjectCategory" text,
  "bciProjectSubCategory" text,
  "bciProjectStoreys" integer,
  "bciProjectFloorArea" numeric,
  "bciProjectSiteArea" numeric,
  "bciProjectConstructionStartDate" timestamptz,
  "bciProjectConstructionEndDate" timestamptz,
  "bciProjectModifiedDate" timestamptz,
  "bciProjectPublishedDate" timestamptz,
  "bciProjectOwnerCompany" text,
  "bciProjectOwnerContact" text,
  "bciProjectOwnerPhone" text,
  "bciProjectOwnerEmail" text,
  "bciProjectArchitectCompany" text,
  "bciProjectArchitectContact" text,
  "bciProjectArchitectPhone" text,
  "bciProjectArchitectEmail" text,
  "bciProjectContractorCompany" text,
  "bciProjectContractorContact" text,
  "bciProjectContractorPhone" text,
  "bciProjectContractorEmail" text,
  "bciProjectPmCompany" text,
  "bciProjectPmContact" text,
  "bciProjectPmPhone" text,
  "bciProjectPmEmail" text,
  "bciProjectRemarks" text,
  "bciProjectMainContractorMethod" text,
  "bciProjectLat" numeric,
  "bciProjectLon" numeric,
  "bciProjectResearcher" text,
  "bciProjectCategoryId" text,
  "bciProjectSubCategoryId" text,
  "bciProjectStageId" text,
  "bciProjectDevelopmentTypeId" text,
  "bciProjectOwnershipTypeId" text,
  "bciProjectCountryId" text,
  "bciProjectRegionId" text,
  "bciProjectStateProvinceId" text,
  "bciProjectSyncedAt" timestamptz DEFAULT now()
);

-- ==========================================
-- RLS POLICIES (all tables)
-- ==========================================

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "Allow authenticated read %s" ON public.%I FOR SELECT TO authenticated USING (true)',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "Allow authenticated write %s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "Allow service_role full %s" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END $$;

-- ==========================================
-- RPC FUNCTION: get_user_permissions
-- ==========================================

CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id uuid)
RETURNS TABLE (
  resource_name text,
  action_name text,
  is_superadmin boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    res."rbacResourceName",
    act."rbacActionName",
    r."rbacRoleIsSuperadmin"
  FROM "rbacUserRole" ur
  JOIN "rbacRole" r ON r."rbacRoleId" = ur."rbacUserRoleRoleId"
  JOIN "rbacRolePermission" rp ON rp."rbacRolePermissionRoleId" = r."rbacRoleId"
  JOIN "rbacPermission" p ON p."rbacPermissionId" = rp."rbacRolePermissionPermissionId"
  JOIN "rbacResource" res ON res."rbacResourceId" = p."rbacPermissionResourceId"
  JOIN "rbacAction" act ON act."rbacActionId" = p."rbacPermissionActionId"
  WHERE ur."rbacUserRoleUserId" = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- RPC FUNCTION: get_table_columns (helper)
-- ==========================================

CREATE OR REPLACE FUNCTION get_table_columns(p_table text)
RETURNS TABLE (column_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT c.column_name::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = p_table;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Reload PostgREST schema cache
-- ==========================================

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- Done! 67 tables created with new naming convention.
-- ============================================================
