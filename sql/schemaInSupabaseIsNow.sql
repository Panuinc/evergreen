-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bcCustomer (
  bcCustomerId uuid NOT NULL DEFAULT uuid_generate_v4(),
  bcCustomerExternalId text UNIQUE,
  bcCustomerNumber text,
  bcCustomerDisplayName text,
  bcCustomerPhoneNumber text,
  bcCustomerContact text,
  bcCustomerBalanceDue numeric DEFAULT 0,
  bcCustomerBalance numeric DEFAULT 0,
  bcCustomerSalespersonCode text,
  bcCustomerSyncedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT bcCustomer_pkey PRIMARY KEY (bcCustomerId)
);
CREATE TABLE public.bcItem (
  bcItemId uuid NOT NULL DEFAULT uuid_generate_v4(),
  bcItemExternalId text UNIQUE,
  bcItemNumber text,
  bcItemDisplayName text,
  bcItemType text,
  bcItemInventory numeric DEFAULT 0,
  bcItemUnitPrice numeric DEFAULT 0,
  bcItemUnitCost numeric DEFAULT 0,
  bcItemCategoryCode text,
  bcItemGeneralProductPostingGroupCode text,
  bcItemBlocked boolean DEFAULT false,
  bcItemBaseUnitOfMeasure text,
  bcItemProjectCode text,
  bcItemProjectName text,
  bcItemRfidCode text,
  bcItemSyncedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT bcItem_pkey PRIMARY KEY (bcItemId)
);
CREATE TABLE public.bcItemLedgerEntry (
  bcItemLedgerEntryId uuid NOT NULL DEFAULT uuid_generate_v4(),
  bcItemLedgerEntryExternalNo integer UNIQUE,
  bcItemLedgerEntryEntryNo integer,
  bcItemLedgerEntryPostingDate date,
  bcItemLedgerEntryDocumentDate date,
  bcItemLedgerEntryEntryType text,
  bcItemLedgerEntryDocumentType text,
  bcItemLedgerEntryDocumentNo text,
  bcItemLedgerEntryItemNo text,
  bcItemLedgerEntryItemDescription text,
  bcItemLedgerEntryEmployeeCode text,
  bcItemLedgerEntryEmployeeName text,
  bcItemLedgerEntryDescription2 text,
  bcItemLedgerEntryLocationCode text,
  bcItemLedgerEntryLotNo text,
  bcItemLedgerEntrySerialNo text,
  bcItemLedgerEntryExpirationDate date,
  bcItemLedgerEntryQuantity numeric DEFAULT 0,
  bcItemLedgerEntryUnitOfMeasureCode text,
  bcItemLedgerEntryRemainingQuantity numeric DEFAULT 0,
  bcItemLedgerEntryInvoicedQuantity numeric DEFAULT 0,
  bcItemLedgerEntryCompletelyInvoiced boolean DEFAULT false,
  bcItemLedgerEntryUnitCostExpected numeric DEFAULT 0,
  bcItemLedgerEntryCostAmountExpected numeric DEFAULT 0,
  bcItemLedgerEntryUnitCostActual numeric DEFAULT 0,
  bcItemLedgerEntryCostAmountActual numeric DEFAULT 0,
  bcItemLedgerEntrySalesAmountExpected numeric DEFAULT 0,
  bcItemLedgerEntrySalesAmountActual numeric DEFAULT 0,
  bcItemLedgerEntryOpen boolean DEFAULT true,
  bcItemLedgerEntryGlobalDimension1Code text,
  bcItemLedgerEntryGlobalDimension1Name text,
  bcItemLedgerEntryGlobalDimension2Code text,
  bcItemLedgerEntryGlobalDimension2Name text,
  bcItemLedgerEntryOrderType text,
  bcItemLedgerEntryOrderLineNo integer,
  bcItemLedgerEntryDocumentLineNo integer,
  bcItemLedgerEntryVariantCode text,
  bcItemLedgerEntryBinCode text,
  bcItemLedgerEntryBaseUnitOfMeasure text,
  bcItemLedgerEntryTotalGrossWeight numeric DEFAULT 0,
  bcItemLedgerEntryTotalNetWeight numeric DEFAULT 0,
  bcItemLedgerEntryCreatedBy text,
  bcItemLedgerEntrySyncedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT bcItemLedgerEntry_pkey PRIMARY KEY (bcItemLedgerEntryId)
);
CREATE TABLE public.bcProductionOrder (
  bcProductionOrderId uuid NOT NULL DEFAULT uuid_generate_v4(),
  bcProductionOrderExternalId text UNIQUE,
  bcProductionOrderStatus text,
  bcProductionOrderDescription text,
  bcProductionOrderDescription2 text,
  bcProductionOrderSourceNo text,
  bcProductionOrderRoutingNo text,
  bcProductionOrderQuantity numeric DEFAULT 0,
  bcProductionOrderDimension1Code text,
  bcProductionOrderDimension1Name text,
  bcProductionOrderDimension2Code text,
  bcProductionOrderDimension2Name text,
  bcProductionOrderLocationCode text,
  bcProductionOrderStartingDateTime timestamp with time zone,
  bcProductionOrderEndingDateTime timestamp with time zone,
  bcProductionOrderDueDate date,
  bcProductionOrderRemainingConsumption numeric DEFAULT 0,
  bcProductionOrderAssignedUserId text,
  bcProductionOrderFinishedDate date,
  bcProductionOrderSearchDescription text,
  bcProductionOrderSyncedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT bcProductionOrder_pkey PRIMARY KEY (bcProductionOrderId)
);
CREATE TABLE public.bcSalesOrder (
  bcSalesOrderId uuid NOT NULL DEFAULT uuid_generate_v4(),
  bcSalesOrderExternalId text UNIQUE,
  bcSalesOrderNumber text,
  bcSalesOrderDocumentType text,
  bcSalesOrderCustomerNumber text,
  bcSalesOrderCustomerName text,
  bcSalesOrderSellToAddress text,
  bcSalesOrderSellToCity text,
  bcSalesOrderSellToPostCode text,
  bcSalesOrderShipToName text,
  bcSalesOrderShipToAddress text,
  bcSalesOrderShipToCity text,
  bcSalesOrderShipToPostCode text,
  bcSalesOrderDate date,
  bcSalesOrderDueDate date,
  bcSalesOrderStatus text,
  bcSalesOrderCompletelyShipped boolean DEFAULT false,
  bcSalesOrderSalespersonCode text,
  bcSalesOrderExternalDocumentNumber text,
  bcSalesOrderTotalAmountIncVat numeric DEFAULT 0,
  bcSalesOrderSyncedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT bcSalesOrder_pkey PRIMARY KEY (bcSalesOrderId)
);
CREATE TABLE public.bcSalesOrderLine (
  bcSalesOrderLineId uuid NOT NULL DEFAULT uuid_generate_v4(),
  bcSalesOrderLineExternalId text UNIQUE,
  bcSalesOrderLineDocumentNo text,
  bcSalesOrderLineNo integer,
  bcSalesOrderLineType text,
  bcSalesOrderLineObjectNumber text,
  bcSalesOrderLineDescription text,
  bcSalesOrderLineQuantity numeric DEFAULT 0,
  bcSalesOrderLineUnitPrice numeric DEFAULT 0,
  bcSalesOrderLineAmount numeric DEFAULT 0,
  bcSalesOrderLineQuantityShipped numeric DEFAULT 0,
  bcSalesOrderLineOutstandingQuantity numeric DEFAULT 0,
  bcSalesOrderLineUnitOfMeasureCode text,
  bcSalesOrderLineLocationCode text,
  bcSalesOrderLineProjectCode text,
  bcSalesOrderLineProjectName text,
  bcSalesOrderLineSyncedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT bcSalesOrderLine_pkey PRIMARY KEY (bcSalesOrderLineId)
);
CREATE TABLE public.bciProject (
  bciProjectId uuid NOT NULL DEFAULT uuid_generate_v4(),
  bciProjectExternalId integer UNIQUE,
  bciProjectName text,
  bciProjectType text,
  bciProjectDescription text,
  bciProjectStreetName text,
  bciProjectCityOrTown text,
  bciProjectStateProvince text,
  bciProjectRegion text,
  bciProjectCountry text,
  bciProjectValue numeric,
  bciProjectCurrency text,
  bciProjectStage text,
  bciProjectStageStatus text,
  bciProjectDevelopmentType text,
  bciProjectOwnershipType text,
  bciProjectCategory text,
  bciProjectSubCategory text,
  bciProjectStoreys integer,
  bciProjectFloorArea numeric,
  bciProjectSiteArea numeric,
  bciProjectConstructionStartDate timestamp with time zone,
  bciProjectConstructionEndDate timestamp with time zone,
  bciProjectModifiedDate timestamp with time zone,
  bciProjectPublishedDate timestamp with time zone,
  bciProjectOwnerCompany text,
  bciProjectOwnerContact text,
  bciProjectOwnerPhone text,
  bciProjectOwnerEmail text,
  bciProjectArchitectCompany text,
  bciProjectArchitectContact text,
  bciProjectArchitectPhone text,
  bciProjectArchitectEmail text,
  bciProjectContractorCompany text,
  bciProjectContractorContact text,
  bciProjectContractorPhone text,
  bciProjectContractorEmail text,
  bciProjectPmCompany text,
  bciProjectPmContact text,
  bciProjectPmPhone text,
  bciProjectPmEmail text,
  bciProjectRemarks text,
  bciProjectMainContractorMethod text,
  bciProjectLat numeric,
  bciProjectLon numeric,
  bciProjectResearcher text,
  bciProjectCategoryId text,
  bciProjectSubCategoryId text,
  bciProjectStageId text,
  bciProjectDevelopmentTypeId text,
  bciProjectOwnershipTypeId text,
  bciProjectCountryId text,
  bciProjectRegionId text,
  bciProjectStateProvinceId text,
  bciProjectSyncedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT bciProject_pkey PRIMARY KEY (bciProjectId)
);
CREATE TABLE public.crmAccount (
  crmAccountId uuid NOT NULL DEFAULT uuid_generate_v4(),
  crmAccountName text,
  crmAccountIndustry text,
  crmAccountEmail text,
  crmAccountPhone text,
  crmAccountWebsite text,
  crmAccountAddress text,
  crmAccountCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT crmAccount_pkey PRIMARY KEY (crmAccountId)
);
CREATE TABLE public.crmActivity (
  crmActivityId uuid NOT NULL DEFAULT uuid_generate_v4(),
  crmActivityType text,
  crmActivityStatus text DEFAULT 'pending'::text,
  crmActivitySubject text,
  crmActivityDueDate date,
  crmActivityContactId uuid,
  crmActivityOpportunityId uuid,
  crmActivityAccountId uuid,
  crmActivityCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT crmActivity_pkey PRIMARY KEY (crmActivityId),
  CONSTRAINT crmActivity_crmActivityContactId_fkey FOREIGN KEY (crmActivityContactId) REFERENCES public.crmContact(crmContactId),
  CONSTRAINT crmActivity_crmActivityOpportunityId_fkey FOREIGN KEY (crmActivityOpportunityId) REFERENCES public.crmOpportunity(crmOpportunityId),
  CONSTRAINT crmActivity_crmActivityAccountId_fkey FOREIGN KEY (crmActivityAccountId) REFERENCES public.crmAccount(crmAccountId)
);
CREATE TABLE public.crmContact (
  crmContactId uuid NOT NULL DEFAULT uuid_generate_v4(),
  crmContactFirstName text,
  crmContactLastName text,
  crmContactEmail text,
  crmContactPhone text,
  crmContactPosition text,
  crmContactAccountId uuid,
  crmContactNotes text,
  crmContactCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT crmContact_pkey PRIMARY KEY (crmContactId),
  CONSTRAINT crmContact_crmContactAccountId_fkey FOREIGN KEY (crmContactAccountId) REFERENCES public.crmAccount(crmAccountId)
);
CREATE TABLE public.crmLead (
  crmLeadId uuid NOT NULL DEFAULT uuid_generate_v4(),
  crmLeadNo text,
  crmLeadName text,
  crmLeadEmail text,
  crmLeadPhone text,
  crmLeadCompany text,
  crmLeadPosition text,
  crmLeadSource text,
  crmLeadScore text DEFAULT 'warm'::text,
  crmLeadStatus text DEFAULT 'new'::text,
  crmLeadAssignedTo text,
  crmLeadNotes text,
  crmLeadConvertedContactId uuid,
  crmLeadConvertedOpportunityId uuid,
  crmLeadCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT crmLead_pkey PRIMARY KEY (crmLeadId),
  CONSTRAINT crmLead_crmLeadConvertedContactId_fkey FOREIGN KEY (crmLeadConvertedContactId) REFERENCES public.crmContact(crmContactId),
  CONSTRAINT crmLead_convertedOpp_fkey FOREIGN KEY (crmLeadConvertedOpportunityId) REFERENCES public.crmOpportunity(crmOpportunityId)
);
CREATE TABLE public.crmOpportunity (
  crmOpportunityId uuid NOT NULL DEFAULT uuid_generate_v4(),
  crmOpportunityName text,
  crmOpportunityStage text DEFAULT 'prospecting'::text,
  crmOpportunityAmount numeric DEFAULT 0,
  crmOpportunityProbability integer DEFAULT 0,
  crmOpportunityExpectedCloseDate date,
  crmOpportunityActualCloseDate date,
  crmOpportunityContactId uuid,
  crmOpportunityAccountId uuid,
  crmOpportunityAssignedTo text,
  crmOpportunitySource text,
  crmOpportunityNotes text,
  crmOpportunityCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT crmOpportunity_pkey PRIMARY KEY (crmOpportunityId),
  CONSTRAINT crmOpportunity_crmOpportunityContactId_fkey FOREIGN KEY (crmOpportunityContactId) REFERENCES public.crmContact(crmContactId),
  CONSTRAINT crmOpportunity_crmOpportunityAccountId_fkey FOREIGN KEY (crmOpportunityAccountId) REFERENCES public.crmAccount(crmAccountId)
);
CREATE TABLE public.crmOrder (
  crmOrderId uuid NOT NULL DEFAULT uuid_generate_v4(),
  crmOrderNo text,
  crmOrderQuotationId uuid,
  crmOrderOpportunityId uuid,
  crmOrderContactId uuid,
  crmOrderAccountId uuid,
  crmOrderStatus text DEFAULT 'pending'::text,
  crmOrderSubtotal numeric DEFAULT 0,
  crmOrderDiscount numeric DEFAULT 0,
  crmOrderTax numeric DEFAULT 0,
  crmOrderTotal numeric DEFAULT 0,
  crmOrderShippingAddress text,
  crmOrderTrackingNumber text,
  crmOrderNotes text,
  crmOrderCreatedBy text,
  crmOrderCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT crmOrder_pkey PRIMARY KEY (crmOrderId),
  CONSTRAINT crmOrder_crmOrderQuotationId_fkey FOREIGN KEY (crmOrderQuotationId) REFERENCES public.crmQuotation(crmQuotationId),
  CONSTRAINT crmOrder_crmOrderOpportunityId_fkey FOREIGN KEY (crmOrderOpportunityId) REFERENCES public.crmOpportunity(crmOpportunityId),
  CONSTRAINT crmOrder_crmOrderContactId_fkey FOREIGN KEY (crmOrderContactId) REFERENCES public.crmContact(crmContactId),
  CONSTRAINT crmOrder_crmOrderAccountId_fkey FOREIGN KEY (crmOrderAccountId) REFERENCES public.crmAccount(crmAccountId)
);
CREATE TABLE public.crmPipelineStage (
  crmPipelineStageId uuid NOT NULL DEFAULT uuid_generate_v4(),
  crmPipelineStageName text,
  crmPipelineStageColor text,
  crmPipelineStageOrder integer,
  crmPipelineStageCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT crmPipelineStage_pkey PRIMARY KEY (crmPipelineStageId)
);
CREATE TABLE public.crmQuotation (
  crmQuotationId uuid NOT NULL DEFAULT uuid_generate_v4(),
  crmQuotationNo text,
  crmQuotationStatus text DEFAULT 'draft'::text,
  crmQuotationOpportunityId uuid,
  crmQuotationContactId uuid,
  crmQuotationAccountId uuid,
  crmQuotationSubtotal numeric DEFAULT 0,
  crmQuotationDiscount numeric DEFAULT 0,
  crmQuotationTax numeric DEFAULT 0,
  crmQuotationTotal numeric DEFAULT 0,
  crmQuotationApprovedBy text,
  crmQuotationApprovalNote text,
  crmQuotationNotes text,
  crmQuotationCreatedBy text,
  crmQuotationCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT crmQuotation_pkey PRIMARY KEY (crmQuotationId),
  CONSTRAINT crmQuotation_crmQuotationOpportunityId_fkey FOREIGN KEY (crmQuotationOpportunityId) REFERENCES public.crmOpportunity(crmOpportunityId),
  CONSTRAINT crmQuotation_crmQuotationContactId_fkey FOREIGN KEY (crmQuotationContactId) REFERENCES public.crmContact(crmContactId),
  CONSTRAINT crmQuotation_crmQuotationAccountId_fkey FOREIGN KEY (crmQuotationAccountId) REFERENCES public.crmAccount(crmAccountId)
);
CREATE TABLE public.crmQuotationLine (
  crmQuotationLineId uuid NOT NULL DEFAULT uuid_generate_v4(),
  crmQuotationLineQuotationId uuid,
  crmQuotationLineOrder integer,
  crmQuotationLineProductName text,
  crmQuotationLineDescription text,
  crmQuotationLineQuantity numeric DEFAULT 0,
  crmQuotationLineUnitPrice numeric DEFAULT 0,
  crmQuotationLineDiscount numeric DEFAULT 0,
  crmQuotationLineAmount numeric DEFAULT 0,
  CONSTRAINT crmQuotationLine_pkey PRIMARY KEY (crmQuotationLineId),
  CONSTRAINT crmQuotationLine_crmQuotationLineQuotationId_fkey FOREIGN KEY (crmQuotationLineQuotationId) REFERENCES public.crmQuotation(crmQuotationId)
);
CREATE TABLE public.hrDepartment (
  hrDepartmentId uuid NOT NULL DEFAULT uuid_generate_v4(),
  hrDepartmentName text NOT NULL,
  hrDepartmentDescription text,
  hrDepartmentDivision text,
  hrDepartmentDivisionId uuid,
  hrDepartmentCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT hrDepartment_pkey PRIMARY KEY (hrDepartmentId),
  CONSTRAINT hrDepartment_hrDepartmentDivisionId_fkey FOREIGN KEY (hrDepartmentDivisionId) REFERENCES public.hrDivision(hrDivisionId)
);
CREATE TABLE public.hrDivision (
  hrDivisionId uuid NOT NULL DEFAULT uuid_generate_v4(),
  hrDivisionName text NOT NULL,
  hrDivisionDescription text,
  hrDivisionCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT hrDivision_pkey PRIMARY KEY (hrDivisionId)
);
CREATE TABLE public.hrEmployee (
  hrEmployeeId uuid NOT NULL DEFAULT uuid_generate_v4(),
  hrEmployeeFirstName text,
  hrEmployeeLastName text,
  hrEmployeeEmail text,
  hrEmployeePhone text,
  hrEmployeeDivision text,
  hrEmployeeDepartment text,
  hrEmployeePosition text,
  hrEmployeeStatus text DEFAULT 'active'::text,
  hrEmployeeUserId uuid,
  hrEmployeeCreatedAt timestamp with time zone DEFAULT now(),
  hrEmployeeUpdatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT hrEmployee_pkey PRIMARY KEY (hrEmployeeId)
);
CREATE TABLE public.hrPosition (
  hrPositionId uuid NOT NULL DEFAULT uuid_generate_v4(),
  hrPositionTitle text NOT NULL,
  hrPositionDescription text,
  hrPositionDepartment text,
  hrPositionCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT hrPosition_pkey PRIMARY KEY (hrPositionId)
);
CREATE TABLE public.itAsset (
  itAssetId uuid NOT NULL DEFAULT uuid_generate_v4(),
  itAssetName text,
  itAssetTag text,
  itAssetCategory text DEFAULT 'computer'::text,
  itAssetBrand text,
  itAssetModel text,
  itAssetSerialNumber text,
  itAssetStatus text DEFAULT 'active'::text,
  itAssetAssignedTo text,
  itAssetPurchaseDate date,
  itAssetWarrantyExpiry date,
  itAssetCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT itAsset_pkey PRIMARY KEY (itAssetId)
);
CREATE TABLE public.itDevProgressLog (
  itDevProgressLogId uuid NOT NULL DEFAULT uuid_generate_v4(),
  itDevProgressLogRequestId uuid,
  itDevProgressLogProgress integer DEFAULT 0,
  itDevProgressLogNote text,
  itDevProgressLogDescription text,
  itDevProgressLogCreatedBy text,
  itDevProgressLogCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT itDevProgressLog_pkey PRIMARY KEY (itDevProgressLogId),
  CONSTRAINT itDevProgressLog_itDevProgressLogRequestId_fkey FOREIGN KEY (itDevProgressLogRequestId) REFERENCES public.itDevRequest(itDevRequestId)
);
CREATE TABLE public.itDevRequest (
  itDevRequestId uuid NOT NULL DEFAULT uuid_generate_v4(),
  itDevRequestNo text,
  itDevRequestTitle text,
  itDevRequestDescription text,
  itDevRequestRequestedBy text,
  itDevRequestAssignedTo text,
  itDevRequestStatus text DEFAULT 'pending'::text,
  itDevRequestProgress integer DEFAULT 0,
  itDevRequestDueDate date,
  itDevRequestCompletedAt timestamp with time zone,
  itDevRequestCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT itDevRequest_pkey PRIMARY KEY (itDevRequestId)
);
CREATE TABLE public.itNetworkDevice (
  itNetworkDeviceId uuid NOT NULL DEFAULT uuid_generate_v4(),
  itNetworkDeviceName text,
  itNetworkDeviceIpAddress text,
  itNetworkDeviceLocation text,
  itNetworkDeviceType text,
  itNetworkDeviceStatus text DEFAULT 'online'::text,
  itNetworkDeviceCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT itNetworkDevice_pkey PRIMARY KEY (itNetworkDeviceId)
);
CREATE TABLE public.itSecurityIncident (
  itSecurityIncidentId uuid NOT NULL DEFAULT uuid_generate_v4(),
  itSecurityIncidentTitle text,
  itSecurityIncidentStatus text DEFAULT 'open'::text,
  itSecurityIncidentSeverity text,
  itSecurityIncidentReportedBy text,
  itSecurityIncidentAssignedTo text,
  itSecurityIncidentCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT itSecurityIncident_pkey PRIMARY KEY (itSecurityIncidentId)
);
CREATE TABLE public.itSoftware (
  itSoftwareId uuid NOT NULL DEFAULT uuid_generate_v4(),
  itSoftwareName text,
  itSoftwareVendor text,
  itSoftwareLicenseKey text,
  itSoftwareLicenseType text,
  itSoftwareStatus text DEFAULT 'active'::text,
  itSoftwareExpiryDate date,
  itSoftwareCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT itSoftware_pkey PRIMARY KEY (itSoftwareId)
);
CREATE TABLE public.itSystemAccess (
  itSystemAccessId uuid NOT NULL DEFAULT uuid_generate_v4(),
  itSystemAccessSystem text,
  itSystemAccessRequestedFor text,
  itSystemAccessRequestedBy text,
  itSystemAccessStatus text DEFAULT 'pending'::text,
  itSystemAccessCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT itSystemAccess_pkey PRIMARY KEY (itSystemAccessId)
);
CREATE TABLE public.itTicket (
  itTicketId uuid NOT NULL DEFAULT uuid_generate_v4(),
  itTicketNo text,
  itTicketTitle text,
  itTicketDescription text,
  itTicketCategory text DEFAULT 'other'::text,
  itTicketPriority text DEFAULT 'medium'::text,
  itTicketStatus text DEFAULT 'open'::text,
  itTicketRequestedBy text,
  itTicketAssignedTo text,
  itTicketNotes text,
  itTicketCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT itTicket_pkey PRIMARY KEY (itTicketId)
);
CREATE TABLE public.omAiSetting (
  omAiSettingId uuid NOT NULL DEFAULT uuid_generate_v4(),
  omAiSettingSystemPrompt text,
  omAiSettingModel text DEFAULT 'google/gemini-2.5-flash-lite'::text,
  omAiSettingTemperature numeric DEFAULT 0.3,
  omAiSettingMaxHistoryMessages integer DEFAULT 20,
  omAiSettingBankAccountInfo text,
  omAiSettingUpdatedAt timestamp with time zone DEFAULT now(),
  omAiSettingCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT omAiSetting_pkey PRIMARY KEY (omAiSettingId)
);
CREATE TABLE public.omChannel (
  omChannelId uuid NOT NULL DEFAULT uuid_generate_v4(),
  omChannelType text UNIQUE,
  omChannelName text,
  omChannelAccessToken text,
  omChannelPageId text,
  omChannelSecret text,
  omChannelStatus text DEFAULT 'inactive'::text,
  omChannelCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT omChannel_pkey PRIMARY KEY (omChannelId)
);
CREATE TABLE public.omContact (
  omContactId uuid NOT NULL DEFAULT uuid_generate_v4(),
  omContactChannelType text,
  omContactExternalId text,
  omContactDisplayName text,
  omContactAvatarUrl text,
  omContactNotes text,
  omContactCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT omContact_pkey PRIMARY KEY (omContactId)
);
CREATE TABLE public.omConversation (
  omConversationId uuid NOT NULL DEFAULT uuid_generate_v4(),
  omConversationContactId uuid,
  omConversationChannelType text,
  omConversationStatus text DEFAULT 'open'::text,
  omConversationLastMessageAt timestamp with time zone,
  omConversationLastMessagePreview text,
  omConversationUnreadCount integer DEFAULT 0,
  omConversationAiAutoReply boolean DEFAULT true,
  omConversationAssignedTo text,
  omConversationCreatedAt timestamp with time zone DEFAULT now(),
  omConversationUpdatedAt timestamp with time zone,
  CONSTRAINT omConversation_pkey PRIMARY KEY (omConversationId),
  CONSTRAINT omConversation_omConversationContactId_fkey FOREIGN KEY (omConversationContactId) REFERENCES public.omContact(omContactId)
);
CREATE TABLE public.omMessage (
  omMessageId uuid NOT NULL DEFAULT uuid_generate_v4(),
  omMessageConversationId uuid,
  omMessageSenderType text,
  omMessageSenderId text,
  omMessageContent text,
  omMessageType text DEFAULT 'text'::text,
  omMessageExternalId text,
  omMessageMetadata jsonb,
  omMessageImageUrl text,
  omMessageIsAi boolean DEFAULT false,
  omMessageOcrData jsonb,
  omMessageCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT omMessage_pkey PRIMARY KEY (omMessageId),
  CONSTRAINT omMessage_omMessageConversationId_fkey FOREIGN KEY (omMessageConversationId) REFERENCES public.omConversation(omConversationId)
);
CREATE TABLE public.omPriceItem (
  omPriceItemId uuid NOT NULL DEFAULT uuid_generate_v4(),
  omPriceItemNumber text UNIQUE,
  omPriceItemName text,
  omPriceItemUnitPrice numeric DEFAULT 0,
  omPriceItemUpdatedAt timestamp with time zone DEFAULT now(),
  omPriceItemUpdatedBy uuid,
  CONSTRAINT omPriceItem_pkey PRIMARY KEY (omPriceItemId)
);
CREATE TABLE public.omQuotation (
  omQuotationId uuid NOT NULL DEFAULT uuid_generate_v4(),
  omQuotationConversationId uuid,
  omQuotationContactId uuid,
  omQuotationNumber text,
  omQuotationNo text,
  omQuotationStatus text DEFAULT 'draft'::text,
  omQuotationCustomerName text,
  omQuotationCustomerPhone text,
  omQuotationCustomerAddress text,
  omQuotationPaymentMethod text,
  omQuotationNotes text,
  omQuotationSubmittedBy uuid,
  omQuotationApprovedBy uuid,
  omQuotationApprovalNote text,
  omQuotationUpdatedAt timestamp with time zone,
  omQuotationCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT omQuotation_pkey PRIMARY KEY (omQuotationId),
  CONSTRAINT omQuotation_omQuotationConversationId_fkey FOREIGN KEY (omQuotationConversationId) REFERENCES public.omConversation(omConversationId),
  CONSTRAINT omQuotation_omQuotationContactId_fkey FOREIGN KEY (omQuotationContactId) REFERENCES public.omContact(omContactId)
);
CREATE TABLE public.omQuotationLine (
  omQuotationLineId uuid NOT NULL DEFAULT uuid_generate_v4(),
  omQuotationLineQuotationId uuid,
  omQuotationLineOrder integer,
  omQuotationLineProductName text,
  omQuotationLineVariant text,
  omQuotationLineQuantity numeric DEFAULT 0,
  omQuotationLineUnitPrice numeric DEFAULT 0,
  omQuotationLineAmount numeric DEFAULT 0,
  CONSTRAINT omQuotationLine_pkey PRIMARY KEY (omQuotationLineId),
  CONSTRAINT omQuotationLine_omQuotationLineQuotationId_fkey FOREIGN KEY (omQuotationLineQuotationId) REFERENCES public.omQuotation(omQuotationId)
);
CREATE TABLE public.perf360Competency (
  perf360CompetencyId uuid NOT NULL DEFAULT uuid_generate_v4(),
  perf360CompetencyCycleId uuid,
  perf360CompetencyName text,
  perf360CompetencyDescription text,
  perf360CompetencyQuestions jsonb,
  perf360CompetencyWeight numeric DEFAULT 1,
  perf360CompetencySortOrder integer DEFAULT 0,
  CONSTRAINT perf360Competency_pkey PRIMARY KEY (perf360CompetencyId),
  CONSTRAINT perf360Competency_perf360CompetencyCycleId_fkey FOREIGN KEY (perf360CompetencyCycleId) REFERENCES public.perf360Cycle(perf360CycleId)
);
CREATE TABLE public.perf360Cycle (
  perf360CycleId uuid NOT NULL DEFAULT uuid_generate_v4(),
  perf360CycleName text,
  perf360CycleDescription text,
  perf360CycleYear integer,
  perf360CycleQuarter integer,
  perf360CycleStatus text DEFAULT 'active'::text,
  perf360CycleResponseDeadline date,
  perf360CycleAnonymousToReviewee boolean DEFAULT true,
  perf360CycleCreatedBy uuid,
  perf360CycleCreatedAt timestamp with time zone DEFAULT now(),
  perf360CycleUpdatedAt timestamp with time zone,
  CONSTRAINT perf360Cycle_pkey PRIMARY KEY (perf360CycleId)
);
CREATE TABLE public.perf360Nomination (
  perf360NominationId uuid NOT NULL DEFAULT uuid_generate_v4(),
  perf360NominationCycleId uuid,
  perf360NominationRevieweeEmployeeId text,
  perf360NominationReviewerEmployeeId text,
  perf360NominationRelationshipType text,
  perf360NominationStatus text DEFAULT 'pending'::text,
  perf360NominationCompletedAt timestamp with time zone,
  perf360NominationCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT perf360Nomination_pkey PRIMARY KEY (perf360NominationId),
  CONSTRAINT perf360Nomination_perf360NominationCycleId_fkey FOREIGN KEY (perf360NominationCycleId) REFERENCES public.perf360Cycle(perf360CycleId)
);
CREATE TABLE public.perf360Response (
  perf360ResponseId uuid NOT NULL DEFAULT uuid_generate_v4(),
  perf360ResponseNominationId uuid,
  perf360ResponseCycleId uuid,
  perf360ResponseRevieweeEmployeeId text,
  perf360ResponseReviewerEmployeeId text,
  perf360ResponseRelationshipType text,
  perf360ResponseScores jsonb,
  perf360ResponseCompetencyAverages jsonb,
  perf360ResponseOverallScore numeric,
  perf360ResponseStrengthComment text,
  perf360ResponseImprovementComment text,
  perf360ResponseComment text,
  CONSTRAINT perf360Response_pkey PRIMARY KEY (perf360ResponseId),
  CONSTRAINT perf360Response_perf360ResponseNominationId_fkey FOREIGN KEY (perf360ResponseNominationId) REFERENCES public.perf360Nomination(perf360NominationId),
  CONSTRAINT perf360Response_perf360ResponseCycleId_fkey FOREIGN KEY (perf360ResponseCycleId) REFERENCES public.perf360Cycle(perf360CycleId)
);
CREATE TABLE public.perfEvaluation (
  perfEvaluationId uuid NOT NULL DEFAULT uuid_generate_v4(),
  perfEvaluationEvaluatorId uuid,
  perfEvaluationEvaluateeEmployeeId text,
  perfEvaluationPeriod text,
  perfEvaluationYear integer,
  perfEvaluationQuarter integer,
  perfEvaluationScores jsonb,
  perfEvaluationCategoryAverages jsonb,
  perfEvaluationOverallScore numeric,
  perfEvaluationGrade text,
  perfEvaluationComment text,
  perfEvaluationStatus text DEFAULT 'submitted'::text,
  perfEvaluationCreatedAt timestamp with time zone DEFAULT now(),
  perfEvaluationUpdatedAt timestamp with time zone,
  CONSTRAINT perfEvaluation_pkey PRIMARY KEY (perfEvaluationId)
);
CREATE TABLE public.perfEvaluationFeedback (
  perfEvaluationFeedbackId uuid NOT NULL DEFAULT uuid_generate_v4(),
  perfEvaluationFeedbackEmployeeId text,
  perfEvaluationFeedbackPeriod text,
  perfEvaluationFeedbackCategoryAverages jsonb,
  perfEvaluationFeedbackOverallScore numeric,
  perfEvaluationFeedbackGrade text,
  perfEvaluationFeedbackCompanyAverages jsonb,
  perfEvaluationFeedbackEvaluatorCount integer,
  perfEvaluationFeedbackFeedback text,
  perfEvaluationFeedbackGeneratedBy uuid,
  perfEvaluationFeedbackCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT perfEvaluationFeedback_pkey PRIMARY KEY (perfEvaluationFeedbackId)
);
CREATE TABLE public.perfKpiAssignment (
  perfKpiAssignmentId uuid NOT NULL DEFAULT uuid_generate_v4(),
  perfKpiAssignmentDefinitionId uuid,
  perfKpiAssignmentEmployeeId text,
  perfKpiAssignmentYear integer,
  perfKpiAssignmentTargetValue numeric,
  perfKpiAssignmentWeight numeric DEFAULT 1,
  perfKpiAssignmentCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT perfKpiAssignment_pkey PRIMARY KEY (perfKpiAssignmentId),
  CONSTRAINT perfKpiAssignment_perfKpiAssignmentDefinitionId_fkey FOREIGN KEY (perfKpiAssignmentDefinitionId) REFERENCES public.perfKpiDefinition(perfKpiDefinitionId)
);
CREATE TABLE public.perfKpiDefinition (
  perfKpiDefinitionId uuid NOT NULL DEFAULT uuid_generate_v4(),
  perfKpiDefinitionName text,
  perfKpiDefinitionDescription text,
  perfKpiDefinitionCategory text DEFAULT 'general'::text,
  perfKpiDefinitionUnit text,
  perfKpiDefinitionFrequency text DEFAULT 'monthly'::text,
  perfKpiDefinitionTargetValue numeric,
  perfKpiDefinitionWarningThreshold numeric,
  perfKpiDefinitionCriticalThreshold numeric,
  perfKpiDefinitionHigherIsBetter boolean DEFAULT true,
  perfKpiDefinitionIsActive boolean DEFAULT true,
  perfKpiDefinitionCreatedBy uuid,
  perfKpiDefinitionCreatedAt timestamp with time zone DEFAULT now(),
  perfKpiDefinitionUpdatedAt timestamp with time zone,
  CONSTRAINT perfKpiDefinition_pkey PRIMARY KEY (perfKpiDefinitionId)
);
CREATE TABLE public.perfKpiRecord (
  perfKpiRecordId uuid NOT NULL DEFAULT uuid_generate_v4(),
  perfKpiRecordAssignmentId uuid,
  perfKpiRecordPeriodLabel text,
  perfKpiRecordActualValue numeric,
  perfKpiRecordNote text,
  perfKpiRecordRecordedBy uuid,
  CONSTRAINT perfKpiRecord_pkey PRIMARY KEY (perfKpiRecordId),
  CONSTRAINT perfKpiRecord_perfKpiRecordAssignmentId_fkey FOREIGN KEY (perfKpiRecordAssignmentId) REFERENCES public.perfKpiAssignment(perfKpiAssignmentId)
);
CREATE TABLE public.perfOkrCheckin (
  perfOkrCheckinId uuid NOT NULL DEFAULT uuid_generate_v4(),
  perfOkrCheckinKeyResultId uuid,
  perfOkrCheckinPreviousValue numeric,
  perfOkrCheckinNewValue numeric,
  perfOkrCheckinNote text,
  perfOkrCheckinCreatedBy uuid,
  perfOkrCheckinCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT perfOkrCheckin_pkey PRIMARY KEY (perfOkrCheckinId),
  CONSTRAINT perfOkrCheckin_perfOkrCheckinKeyResultId_fkey FOREIGN KEY (perfOkrCheckinKeyResultId) REFERENCES public.perfOkrKeyResult(perfOkrKeyResultId)
);
CREATE TABLE public.perfOkrKeyResult (
  perfOkrKeyResultId uuid NOT NULL DEFAULT uuid_generate_v4(),
  perfOkrKeyResultObjectiveId uuid,
  perfOkrKeyResultTitle text,
  perfOkrKeyResultMetricType text DEFAULT 'number'::text,
  perfOkrKeyResultStartValue numeric DEFAULT 0,
  perfOkrKeyResultTargetValue numeric DEFAULT 100,
  perfOkrKeyResultCurrentValue numeric DEFAULT 0,
  perfOkrKeyResultUnit text,
  perfOkrKeyResultWeight numeric DEFAULT 1,
  perfOkrKeyResultSortOrder integer DEFAULT 0,
  perfOkrKeyResultStatus text DEFAULT 'not_started'::text,
  perfOkrKeyResultUpdatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT perfOkrKeyResult_pkey PRIMARY KEY (perfOkrKeyResultId),
  CONSTRAINT perfOkrKeyResult_perfOkrKeyResultObjectiveId_fkey FOREIGN KEY (perfOkrKeyResultObjectiveId) REFERENCES public.perfOkrObjective(perfOkrObjectiveId)
);
CREATE TABLE public.perfOkrObjective (
  perfOkrObjectiveId uuid NOT NULL DEFAULT uuid_generate_v4(),
  perfOkrObjectiveEmployeeId text,
  perfOkrObjectiveTitle text,
  perfOkrObjectiveDescription text,
  perfOkrObjectiveYear integer,
  perfOkrObjectiveQuarter integer,
  perfOkrObjectivePeriod text,
  perfOkrObjectiveVisibility text DEFAULT 'team'::text,
  perfOkrObjectiveStatus text DEFAULT 'active'::text,
  perfOkrObjectiveParentObjectiveId uuid,
  perfOkrObjectiveProgress numeric DEFAULT 0,
  perfOkrObjectiveCreatedBy uuid,
  perfOkrObjectiveCreatedAt timestamp with time zone DEFAULT now(),
  perfOkrObjectiveUpdatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT perfOkrObjective_pkey PRIMARY KEY (perfOkrObjectiveId),
  CONSTRAINT perfOkrObjective_perfOkrObjectiveParentObjectiveId_fkey FOREIGN KEY (perfOkrObjectiveParentObjectiveId) REFERENCES public.perfOkrObjective(perfOkrObjectiveId)
);
CREATE TABLE public.rbacAccessLog (
  rbacAccessLogId uuid NOT NULL DEFAULT uuid_generate_v4(),
  rbacAccessLogUserId uuid,
  rbacAccessLogResource text,
  rbacAccessLogAction text,
  rbacAccessLogGranted boolean DEFAULT false,
  rbacAccessLogMetadata jsonb,
  rbacAccessLogCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT rbacAccessLog_pkey PRIMARY KEY (rbacAccessLogId)
);
CREATE TABLE public.rbacAction (
  rbacActionId uuid NOT NULL DEFAULT uuid_generate_v4(),
  rbacActionName text NOT NULL,
  rbacActionDescription text,
  rbacActionCreatedAt timestamp with time zone DEFAULT now(),
  rbacActionUpdatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT rbacAction_pkey PRIMARY KEY (rbacActionId)
);
CREATE TABLE public.rbacPermission (
  rbacPermissionId uuid NOT NULL DEFAULT uuid_generate_v4(),
  rbacPermissionResourceId uuid,
  rbacPermissionActionId uuid,
  rbacPermissionCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT rbacPermission_pkey PRIMARY KEY (rbacPermissionId),
  CONSTRAINT rbacPermission_rbacPermissionResourceId_fkey FOREIGN KEY (rbacPermissionResourceId) REFERENCES public.rbacResource(rbacResourceId),
  CONSTRAINT rbacPermission_rbacPermissionActionId_fkey FOREIGN KEY (rbacPermissionActionId) REFERENCES public.rbacAction(rbacActionId)
);
CREATE TABLE public.rbacResource (
  rbacResourceId uuid NOT NULL DEFAULT uuid_generate_v4(),
  rbacResourceName text NOT NULL,
  rbacResourceDescription text,
  rbacResourceModuleId text,
  rbacResourceCreatedAt timestamp with time zone DEFAULT now(),
  rbacResourceUpdatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT rbacResource_pkey PRIMARY KEY (rbacResourceId)
);
CREATE TABLE public.rbacRole (
  rbacRoleId uuid NOT NULL DEFAULT uuid_generate_v4(),
  rbacRoleName text NOT NULL,
  rbacRoleDescription text,
  rbacRoleIsSuperadmin boolean DEFAULT false,
  rbacRoleCreatedAt timestamp with time zone DEFAULT now(),
  rbacRoleUpdatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT rbacRole_pkey PRIMARY KEY (rbacRoleId)
);
CREATE TABLE public.rbacRolePermission (
  rbacRolePermissionId uuid NOT NULL DEFAULT uuid_generate_v4(),
  rbacRolePermissionRoleId uuid NOT NULL,
  rbacRolePermissionPermissionId uuid NOT NULL,
  rbacRolePermissionCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT rbacRolePermission_pkey PRIMARY KEY (rbacRolePermissionId),
  CONSTRAINT rbacRolePermission_rbacRolePermissionRoleId_fkey FOREIGN KEY (rbacRolePermissionRoleId) REFERENCES public.rbacRole(rbacRoleId),
  CONSTRAINT rbacRolePermission_rbacRolePermissionPermissionId_fkey FOREIGN KEY (rbacRolePermissionPermissionId) REFERENCES public.rbacPermission(rbacPermissionId)
);
CREATE TABLE public.rbacUserProfile (
  rbacUserProfileId uuid NOT NULL DEFAULT uuid_generate_v4(),
  rbacUserProfileEmail text,
  rbacUserProfileDisplayName text,
  rbacUserProfileAvatarUrl text,
  rbacUserProfileCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT rbacUserProfile_pkey PRIMARY KEY (rbacUserProfileId)
);
CREATE TABLE public.rbacUserRole (
  rbacUserRoleId uuid NOT NULL DEFAULT uuid_generate_v4(),
  rbacUserRoleUserId uuid NOT NULL,
  rbacUserRoleRoleId uuid NOT NULL,
  rbacUserRoleCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT rbacUserRole_pkey PRIMARY KEY (rbacUserRoleId),
  CONSTRAINT rbacUserRole_rbacUserRoleRoleId_fkey FOREIGN KEY (rbacUserRoleRoleId) REFERENCES public.rbacRole(rbacRoleId)
);
CREATE TABLE public.tmsDelivery (
  tmsDeliveryId uuid NOT NULL DEFAULT uuid_generate_v4(),
  tmsDeliveryShipmentId uuid,
  tmsDeliveryStatus text DEFAULT 'pending'::text,
  tmsDeliveryCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT tmsDelivery_pkey PRIMARY KEY (tmsDeliveryId),
  CONSTRAINT tmsDelivery_tmsDeliveryShipmentId_fkey FOREIGN KEY (tmsDeliveryShipmentId) REFERENCES public.tmsShipment(tmsShipmentId)
);
CREATE TABLE public.tmsDriver (
  tmsDriverId uuid NOT NULL DEFAULT uuid_generate_v4(),
  tmsDriverFirstName text,
  tmsDriverLastName text,
  tmsDriverPhone text,
  tmsDriverLicenseNumber text,
  tmsDriverLicenseType text,
  tmsDriverLicenseExpiry date,
  tmsDriverRole text,
  tmsDriverStatus text DEFAULT 'active'::text,
  tmsDriverCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT tmsDriver_pkey PRIMARY KEY (tmsDriverId)
);
CREATE TABLE public.tmsFuelLog (
  tmsFuelLogId uuid NOT NULL DEFAULT uuid_generate_v4(),
  tmsFuelLogVehicleId uuid,
  tmsFuelLogDate date,
  tmsFuelLogFuelType text,
  tmsFuelLogLiters numeric,
  tmsFuelLogPricePerLiter numeric,
  tmsFuelLogTotalCost numeric,
  tmsFuelLogMileage numeric,
  tmsFuelLogStation text,
  tmsFuelLogCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT tmsFuelLog_pkey PRIMARY KEY (tmsFuelLogId),
  CONSTRAINT tmsFuelLog_tmsFuelLogVehicleId_fkey FOREIGN KEY (tmsFuelLogVehicleId) REFERENCES public.tmsVehicle(tmsVehicleId)
);
CREATE TABLE public.tmsGpsLog (
  tmsGpsLogId uuid NOT NULL DEFAULT uuid_generate_v4(),
  tmsGpsLogVehicleId uuid,
  tmsGpsLogShipmentId uuid,
  tmsGpsLogLatitude numeric,
  tmsGpsLogLongitude numeric,
  tmsGpsLogSpeed numeric,
  tmsGpsLogRecordedAt timestamp with time zone DEFAULT now(),
  tmsGpsLogCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT tmsGpsLog_pkey PRIMARY KEY (tmsGpsLogId),
  CONSTRAINT tmsGpsLog_tmsGpsLogVehicleId_fkey FOREIGN KEY (tmsGpsLogVehicleId) REFERENCES public.tmsVehicle(tmsVehicleId),
  CONSTRAINT tmsGpsLog_tmsGpsLogShipmentId_fkey FOREIGN KEY (tmsGpsLogShipmentId) REFERENCES public.tmsShipment(tmsShipmentId)
);
CREATE TABLE public.tmsMaintenance (
  tmsMaintenanceId uuid NOT NULL DEFAULT uuid_generate_v4(),
  tmsMaintenanceVehicleId uuid,
  tmsMaintenanceType text,
  tmsMaintenanceDescription text,
  tmsMaintenanceDate date,
  tmsMaintenanceStatus text DEFAULT 'pending'::text,
  tmsMaintenanceCost numeric,
  tmsMaintenanceVendor text,
  tmsMaintenanceNextDueDate date,
  tmsMaintenanceNextDueMileage numeric,
  tmsMaintenanceCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT tmsMaintenance_pkey PRIMARY KEY (tmsMaintenanceId),
  CONSTRAINT tmsMaintenance_tmsMaintenanceVehicleId_fkey FOREIGN KEY (tmsMaintenanceVehicleId) REFERENCES public.tmsVehicle(tmsVehicleId)
);
CREATE TABLE public.tmsRoute (
  tmsRouteId uuid NOT NULL DEFAULT uuid_generate_v4(),
  tmsRouteName text,
  tmsRouteOrigin text,
  tmsRouteDestination text,
  tmsRouteDistance numeric,
  tmsRouteEstimatedTime text,
  tmsRouteCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT tmsRoute_pkey PRIMARY KEY (tmsRouteId)
);
CREATE TABLE public.tmsShipment (
  tmsShipmentId uuid NOT NULL DEFAULT uuid_generate_v4(),
  tmsShipmentNumber text,
  tmsShipmentCustomerName text,
  tmsShipmentCustomerPhone text,
  tmsShipmentCustomerAddress text,
  tmsShipmentDestination text,
  tmsShipmentRouteId uuid,
  tmsShipmentVehicleId uuid,
  tmsShipmentDriverId uuid,
  tmsShipmentAssistantId uuid,
  tmsShipmentSalesOrderRef text,
  tmsShipmentItemsSummary text,
  tmsShipmentWeightKg numeric,
  tmsShipmentNotes text,
  tmsShipmentEstimatedArrival timestamp with time zone,
  tmsShipmentStatus text DEFAULT 'pending'::text,
  tmsShipmentDate date,
  tmsShipmentCreatedBy uuid,
  tmsShipmentCreatedAt timestamp with time zone DEFAULT now(),
  tmsShipmentDispatchedAt timestamp with time zone,
  tmsShipmentDeliveredAt timestamp with time zone,
  CONSTRAINT tmsShipment_pkey PRIMARY KEY (tmsShipmentId),
  CONSTRAINT tmsShipment_tmsShipmentRouteId_fkey FOREIGN KEY (tmsShipmentRouteId) REFERENCES public.tmsRoute(tmsRouteId),
  CONSTRAINT tmsShipment_tmsShipmentVehicleId_fkey FOREIGN KEY (tmsShipmentVehicleId) REFERENCES public.tmsVehicle(tmsVehicleId),
  CONSTRAINT tmsShipment_tmsShipmentDriverId_fkey FOREIGN KEY (tmsShipmentDriverId) REFERENCES public.tmsDriver(tmsDriverId),
  CONSTRAINT tmsShipment_tmsShipmentAssistantId_fkey FOREIGN KEY (tmsShipmentAssistantId) REFERENCES public.tmsDriver(tmsDriverId)
);
CREATE TABLE public.tmsVehicle (
  tmsVehicleId uuid NOT NULL DEFAULT uuid_generate_v4(),
  tmsVehiclePlateNumber text,
  tmsVehicleName text,
  tmsVehicleType text DEFAULT 'truck'::text,
  tmsVehicleBrand text,
  tmsVehicleModel text,
  tmsVehicleYear integer,
  tmsVehicleColor text,
  tmsVehicleVinNumber text,
  tmsVehicleRegistrationExpiry date,
  tmsVehicleInsuranceExpiry date,
  tmsVehicleInsurancePolicy text,
  tmsVehicleActExpiry date,
  tmsVehicleCapacityKg numeric,
  tmsVehicleFuelType text DEFAULT 'diesel'::text,
  tmsVehicleCurrentMileage numeric DEFAULT 0,
  tmsVehicleStatus text DEFAULT 'available'::text,
  tmsVehicleNotes text,
  tmsVehicleCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT tmsVehicle_pkey PRIMARY KEY (tmsVehicleId)
);
CREATE TABLE public.whAppVersion (
  whAppVersionId uuid NOT NULL DEFAULT uuid_generate_v4(),
  whAppVersionCode integer,
  whAppVersionName text,
  whAppVersionDownloadUrl text,
  whAppVersionReleaseNotes text,
  whAppVersionCreatedAt timestamp with time zone DEFAULT now(),
  whAppVersionIsMandatory boolean DEFAULT false,
  CONSTRAINT whAppVersion_pkey PRIMARY KEY (whAppVersionId)
);
CREATE TABLE public.whOrderMatch (
  whOrderMatchId uuid NOT NULL DEFAULT uuid_generate_v4(),
  whOrderMatchUserId uuid,
  whOrderMatchOrderNumber text,
  whOrderMatchOrderType text,
  whOrderMatchExpectedItems jsonb,
  whOrderMatchScannedItems jsonb,
  whOrderMatchSessionId uuid,
  whOrderMatchStatus text DEFAULT 'pending'::text,
  whOrderMatchCreatedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT whOrderMatch_pkey PRIMARY KEY (whOrderMatchId),
  CONSTRAINT whOrderMatch_whOrderMatchSessionId_fkey FOREIGN KEY (whOrderMatchSessionId) REFERENCES public.whScanSession(whScanSessionId)
);
CREATE TABLE public.whScanRecord (
  whScanRecordId uuid NOT NULL DEFAULT uuid_generate_v4(),
  whScanRecordSessionId uuid,
  whScanRecordEpc text,
  whScanRecordRssi numeric,
  whScanRecordItemNumber text,
  whScanRecordItemName text,
  whScanRecordPhotoUrl text,
  whScanRecordReadCount integer DEFAULT 1,
  whScanRecordScannedAt timestamp with time zone DEFAULT now(),
  CONSTRAINT whScanRecord_pkey PRIMARY KEY (whScanRecordId),
  CONSTRAINT whScanRecord_whScanRecordSessionId_fkey FOREIGN KEY (whScanRecordSessionId) REFERENCES public.whScanSession(whScanSessionId)
);
CREATE TABLE public.whScanSession (
  whScanSessionId uuid NOT NULL DEFAULT uuid_generate_v4(),
  whScanSessionUserId uuid,
  whScanSessionName text,
  whScanSessionType text,
  whScanSessionStartedAt timestamp with time zone DEFAULT now(),
  whScanSessionEndedAt timestamp with time zone,
  whScanSessionGpsLat numeric,
  whScanSessionGpsLon numeric,
  whScanSessionTagCount integer DEFAULT 0,
  whScanSessionTotalReads integer DEFAULT 0,
  whScanSessionMetadata jsonb,
  CONSTRAINT whScanSession_pkey PRIMARY KEY (whScanSessionId)
);
CREATE TABLE public.whTransfer (
  whTransferId uuid NOT NULL DEFAULT uuid_generate_v4(),
  whTransferUserId uuid,
  whTransferNo text,
  whTransferFromLocation text,
  whTransferToLocation text,
  whTransferSessionId uuid,
  whTransferNotes text,
  whTransferGpsLat numeric,
  whTransferGpsLon numeric,
  whTransferStatus text DEFAULT 'pending'::text,
  whTransferCreatedAt timestamp with time zone DEFAULT now(),
  whTransferCompletedAt timestamp with time zone,
  CONSTRAINT whTransfer_pkey PRIMARY KEY (whTransferId),
  CONSTRAINT whTransfer_whTransferSessionId_fkey FOREIGN KEY (whTransferSessionId) REFERENCES public.whScanSession(whScanSessionId)
);