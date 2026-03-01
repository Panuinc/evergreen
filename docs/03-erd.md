# Entity Relationship Diagrams

แผนภาพความสัมพันธ์ระหว่างตาราง (ERD) ของระบบ Evergreen ERP แบ่งตามโมดูลหลัก

---

## 1. RBAC & Auth -- ระบบจัดการสิทธิ์และการเข้าถึง

ระบบ Role-Based Access Control สำหรับจัดการสิทธิ์ผู้ใช้งาน ประกอบด้วย Role, Resource, Action และ Permission โดยแต่ละ Role จะถูกกำหนด Permission ที่เป็นคู่ของ Resource + Action ผู้ใช้งานสามารถมีหลาย Role และระบบจะบันทึก Access Log ทุกครั้งที่มีการเข้าถึงทรัพยากร

```mermaid
erDiagram
    rbacRole {
        uuid rbacRoleId PK
        text rbacRoleName
        boolean rbacRoleIsSuperadmin
        text rbacRoleDescription
    }

    rbacResource {
        uuid rbacResourceId PK
        text rbacResourceName
        text rbacResourceModuleId
    }

    rbacAction {
        uuid rbacActionId PK
        text rbacActionName
    }

    rbacPermission {
        uuid rbacPermissionId PK
        uuid rbacPermissionResourceId FK
        uuid rbacPermissionActionId FK
    }

    rbacRolePermission {
        uuid rbacRolePermissionId PK
        uuid rbacRolePermissionRoleId FK
        uuid rbacRolePermissionPermissionId FK
    }

    rbacUserProfile {
        uuid rbacUserProfileId PK
        text rbacUserProfileEmail
        text rbacUserProfileDisplayName
    }

    rbacUserRole {
        uuid rbacUserRoleId PK
        uuid rbacUserRoleUserId FK
        uuid rbacUserRoleRoleId FK
    }

    rbacAccessLog {
        uuid rbacAccessLogId PK
        uuid rbacAccessLogUserId
        text rbacAccessLogResource
        text rbacAccessLogAction
        boolean rbacAccessLogGranted
    }

    rbacResource ||--o{ rbacPermission : "rbacPermissionResourceId"
    rbacAction ||--o{ rbacPermission : "rbacPermissionActionId"
    rbacRole ||--o{ rbacRolePermission : "rbacRolePermissionRoleId"
    rbacPermission ||--o{ rbacRolePermission : "rbacRolePermissionPermissionId"
    rbacUserProfile ||--o{ rbacUserRole : "rbacUserRoleUserId"
    rbacRole ||--o{ rbacUserRole : "rbacUserRoleRoleId"
```

---

## 2. HR -- ระบบบริหารทรัพยากรบุคคล

โครงสร้างองค์กรแบ่งเป็น Division > Department > Position โดยพนักงาน (Employee) จะสังกัดหน่วยงานและตำแหน่ง และสามารถเชื่อมโยงกับบัญชีผู้ใช้งาน (rbacUserProfile) ในระบบได้

```mermaid
erDiagram
    hrDivision {
        uuid hrDivisionId PK
        text hrDivisionName
    }

    hrDepartment {
        uuid hrDepartmentId PK
        text hrDepartmentName
        uuid hrDepartmentDivisionId FK
    }

    hrPosition {
        uuid hrPositionId PK
        text hrPositionTitle
        text hrPositionDepartment
    }

    hrEmployee {
        uuid hrEmployeeId PK
        text hrEmployeeFirstName
        text hrEmployeeLastName
        text hrEmployeeEmail
        text hrEmployeeDivision
        text hrEmployeeDepartment
        text hrEmployeePosition
        text hrEmployeeStatus
        uuid hrEmployeeUserId FK
    }

    rbacUserProfile {
        uuid rbacUserProfileId PK
    }

    hrDivision ||--o{ hrDepartment : "hrDepartmentDivisionId"
    rbacUserProfile ||--o| hrEmployee : "hrEmployeeUserId"
```

---

## 3. Sales / CRM -- ระบบบริหารลูกค้าสัมพันธ์และการขาย

ระบบ CRM ครอบคลุมตั้งแต่การจัดการบัญชีลูกค้า (Account), ผู้ติดต่อ (Contact), Lead, โอกาสทางการขาย (Opportunity), ใบเสนอราคา (Quotation) จนถึงใบสั่งขาย (Order) โดย Lead สามารถแปลงเป็น Contact และ Opportunity ได้ กิจกรรม (Activity) ใช้บันทึกการติดต่อลูกค้าทุกรูปแบบ

```mermaid
erDiagram
    crmAccount {
        uuid crmAccountId PK
        text crmAccountName
        text crmAccountIndustry
        text crmAccountPhone
    }

    crmContact {
        uuid crmContactId PK
        text crmContactFirstName
        text crmContactLastName
        text crmContactEmail
        uuid crmContactAccountId FK
    }

    crmLead {
        uuid crmLeadId PK
        text crmLeadName
        text crmLeadStatus
        integer crmLeadScore
        uuid crmLeadConvertedContactId FK
        uuid crmLeadConvertedOpportunityId FK
    }

    crmOpportunity {
        uuid crmOpportunityId PK
        text crmOpportunityName
        text crmOpportunityStage
        numeric crmOpportunityAmount
        uuid crmOpportunityContactId FK
        uuid crmOpportunityAccountId FK
    }

    crmActivity {
        uuid crmActivityId PK
        text crmActivityType
        text crmActivityStatus
        uuid crmActivityContactId FK
        uuid crmActivityOpportunityId FK
        uuid crmActivityAccountId FK
    }

    crmQuotation {
        uuid crmQuotationId PK
        text crmQuotationNo
        text crmQuotationStatus
        numeric crmQuotationTotal
        uuid crmQuotationOpportunityId FK
        uuid crmQuotationContactId FK
        uuid crmQuotationAccountId FK
    }

    crmQuotationLine {
        uuid crmQuotationLineId PK
        uuid crmQuotationLineQuotationId FK
        text crmQuotationLineProductName
        numeric crmQuotationLineQuantity
        numeric crmQuotationLineAmount
    }

    crmOrder {
        uuid crmOrderId PK
        text crmOrderNo
        text crmOrderStatus
        numeric crmOrderTotal
        uuid crmOrderQuotationId FK
        uuid crmOrderOpportunityId FK
        uuid crmOrderContactId FK
        uuid crmOrderAccountId FK
    }

    crmPipelineStage {
        uuid crmPipelineStageId PK
        text crmPipelineStageName
        integer crmPipelineStageOrder
    }

    crmAccount ||--o{ crmContact : "crmContactAccountId"
    crmAccount ||--o{ crmOpportunity : "crmOpportunityAccountId"
    crmAccount ||--o{ crmActivity : "crmActivityAccountId"
    crmAccount ||--o{ crmQuotation : "crmQuotationAccountId"
    crmAccount ||--o{ crmOrder : "crmOrderAccountId"
    crmContact ||--o{ crmOpportunity : "crmOpportunityContactId"
    crmContact ||--o{ crmActivity : "crmActivityContactId"
    crmContact ||--o{ crmQuotation : "crmQuotationContactId"
    crmContact ||--o{ crmOrder : "crmOrderContactId"
    crmContact ||--o{ crmLead : "crmLeadConvertedContactId"
    crmOpportunity ||--o{ crmLead : "crmLeadConvertedOpportunityId"
    crmOpportunity ||--o{ crmActivity : "crmActivityOpportunityId"
    crmOpportunity ||--o{ crmQuotation : "crmQuotationOpportunityId"
    crmOpportunity ||--o{ crmOrder : "crmOrderOpportunityId"
    crmQuotation ||--o{ crmQuotationLine : "crmQuotationLineQuotationId"
    crmQuotation ||--o{ crmOrder : "crmOrderQuotationId"
```

---

## 4. BC Data -- ข้อมูลจาก Business Central

ข้อมูลที่ซิงค์จากระบบ Microsoft Dynamics 365 Business Central ผ่าน OData ประกอบด้วยลูกค้า (Customer), สินค้า (Item), ใบสั่งขาย (Sales Order), ใบสั่งผลิต (Production Order), รายการเคลื่อนไหวสินค้า (Item Ledger Entry) และโปรเจกต์ โดยแต่ละ record มี externalId สำหรับอ้างอิงกลับไปยัง BC

```mermaid
erDiagram
    bcCustomer {
        uuid bcCustomerId PK
        text bcCustomerExternalId UK
        text bcCustomerNumber
        text bcCustomerDisplayName
        numeric bcCustomerBalance
    }

    bcItem {
        uuid bcItemId PK
        text bcItemExternalId UK
        text bcItemNumber
        text bcItemDisplayName
        numeric bcItemInventory
        numeric bcItemUnitPrice
        boolean bcItemBlocked
        text bcItemRfidCode
        text bcItemProjectCode
    }

    bcSalesOrder {
        uuid bcSalesOrderId PK
        text bcSalesOrderExternalId UK
        text bcSalesOrderNumber
        text bcSalesOrderCustomerName
        text bcSalesOrderStatus
        numeric bcSalesOrderTotalAmountIncVat
    }

    bcSalesOrderLine {
        uuid bcSalesOrderLineId PK
        text bcSalesOrderLineExternalId UK
        text bcSalesOrderLineDocumentNo FK
        text bcSalesOrderLineDescription
        numeric bcSalesOrderLineQuantity
        numeric bcSalesOrderLineAmount
    }

    bcProductionOrder {
        uuid bcProductionOrderId PK
        text bcProductionOrderExternalId UK
        text bcProductionOrderStatus
        text bcProductionOrderDescription
        numeric bcProductionOrderQuantity
    }

    bcItemLedgerEntry {
        uuid bcItemLedgerEntryId PK
        text bcItemLedgerEntryExternalNo UK
        text bcItemLedgerEntryItemNo
        text bcItemLedgerEntryEntryType
        text bcItemLedgerEntryDocumentNo
        numeric bcItemLedgerEntryQuantity
    }

    bciProject {
        uuid bciProjectId PK
        text bciProjectExternalId UK
        text bciProjectName
        text bciProjectType
        text bciProjectStage
        numeric bciProjectValue
    }

    bcSalesOrder ||--o{ bcSalesOrderLine : "bcSalesOrderLineDocumentNo"
```

---

## 5. TMS -- ระบบจัดการการขนส่ง

ระบบบริหารการขนส่งครอบคลุมยานพาหนะ (Vehicle), คนขับ (Driver), เส้นทาง (Route) และการจัดส่ง (Shipment/Delivery) รวมถึงการบันทึกเชื้อเพลิง (Fuel Log), การซ่อมบำรุง (Maintenance) และ GPS Tracking

```mermaid
erDiagram
    tmsVehicle {
        uuid tmsVehicleId PK
        text tmsVehiclePlateNumber
        text tmsVehicleType
        text tmsVehicleStatus
        numeric tmsVehicleCapacityKg
    }

    tmsDriver {
        uuid tmsDriverId PK
        text tmsDriverFirstName
        text tmsDriverLastName
        text tmsDriverLicenseNumber
        text tmsDriverStatus
    }

    tmsRoute {
        uuid tmsRouteId PK
        text tmsRouteName
        text tmsRouteOrigin
        text tmsRouteDestination
        numeric tmsRouteDistance
    }

    tmsShipment {
        uuid tmsShipmentId PK
        text tmsShipmentNumber
        text tmsShipmentStatus
        uuid tmsShipmentRouteId FK
        uuid tmsShipmentVehicleId FK
        uuid tmsShipmentDriverId FK
        uuid tmsShipmentAssistantId FK
    }

    tmsDelivery {
        uuid tmsDeliveryId PK
        uuid tmsDeliveryShipmentId FK
        text tmsDeliveryStatus
    }

    tmsFuelLog {
        uuid tmsFuelLogId PK
        uuid tmsFuelLogVehicleId FK
        numeric tmsFuelLogLiters
        numeric tmsFuelLogTotalCost
    }

    tmsMaintenance {
        uuid tmsMaintenanceId PK
        uuid tmsMaintenanceVehicleId FK
        text tmsMaintenanceType
        numeric tmsMaintenanceCost
    }

    tmsGpsLog {
        uuid tmsGpsLogId PK
        uuid tmsGpsLogVehicleId FK
        uuid tmsGpsLogShipmentId FK
        numeric tmsGpsLogLatitude
        numeric tmsGpsLogLongitude
    }

    tmsRoute ||--o{ tmsShipment : "tmsShipmentRouteId"
    tmsVehicle ||--o{ tmsShipment : "tmsShipmentVehicleId"
    tmsDriver ||--o{ tmsShipment : "tmsShipmentDriverId"
    tmsDriver ||--o{ tmsShipment : "tmsShipmentAssistantId"
    tmsShipment ||--o{ tmsDelivery : "tmsDeliveryShipmentId"
    tmsShipment ||--o{ tmsGpsLog : "tmsGpsLogShipmentId"
    tmsVehicle ||--o{ tmsFuelLog : "tmsFuelLogVehicleId"
    tmsVehicle ||--o{ tmsMaintenance : "tmsMaintenanceVehicleId"
    tmsVehicle ||--o{ tmsGpsLog : "tmsGpsLogVehicleId"
```

---

## 6. IT -- ระบบบริหารจัดการไอที

โมดูล IT ครอบคลุมการจัดการทรัพย์สินไอที (Asset), Helpdesk Ticket, ซอฟต์แวร์และ License, คำร้องพัฒนาระบบ (Dev Request) พร้อม Progress Log, การจัดการสิทธิ์เข้าถึงระบบ (System Access), อุปกรณ์เครือข่าย (Network Device) และเหตุการณ์ด้านความปลอดภัย (Security Incident)

```mermaid
erDiagram
    itAsset {
        uuid itAssetId PK
        text itAssetName
        text itAssetCategory
        text itAssetStatus
        text itAssetAssignedTo
    }

    itTicket {
        uuid itTicketId PK
        text itTicketNo
        text itTicketTitle
        text itTicketPriority
        text itTicketStatus
    }

    itSoftware {
        uuid itSoftwareId PK
        text itSoftwareName
        text itSoftwareLicenseType
        text itSoftwareStatus
    }

    itDevRequest {
        uuid itDevRequestId PK
        text itDevRequestNo
        text itDevRequestTitle
        text itDevRequestStatus
        numeric itDevRequestProgress
    }

    itDevProgressLog {
        uuid itDevProgressLogId PK
        uuid itDevProgressLogRequestId FK
        numeric itDevProgressLogProgress
        text itDevProgressLogNote
    }

    itSystemAccess {
        uuid itSystemAccessId PK
        text itSystemAccessSystem
        text itSystemAccessStatus
    }

    itNetworkDevice {
        uuid itNetworkDeviceId PK
        text itNetworkDeviceName
        text itNetworkDeviceIpAddress
        text itNetworkDeviceStatus
    }

    itSecurityIncident {
        uuid itSecurityIncidentId PK
        text itSecurityIncidentTitle
        text itSecurityIncidentSeverity
        text itSecurityIncidentStatus
    }

    itDevRequest ||--o{ itDevProgressLog : "itDevProgressLogRequestId"
```

---

## 7. Performance -- ระบบประเมินผลงาน

ระบบประเมินผลงานครอบคลุม 3 เครื่องมือหลัก:
- **KPI**: กำหนด KPI Definition แล้วมอบหมาย (Assignment) ให้พนักงาน บันทึกผลจริงผ่าน KPI Record
- **OKR**: ตั้ง Objective (รองรับ parent-child แบบ cascade) แตกเป็น Key Result แล้ว Check-in ความคืบหน้า
- **360 Feedback**: สร้าง Cycle กำหนด Competency ที่ต้องประเมิน จากนั้น Nominate ผู้ประเมิน/ผู้ถูกประเมิน และเก็บ Response

ผลประเมินรวมจะถูกสรุปใน perfEvaluation และ perfEvaluationFeedback

```mermaid
erDiagram
    perfKpiDefinition {
        uuid perfKpiDefinitionId PK
        text perfKpiDefinitionName
        text perfKpiDefinitionCategory
        text perfKpiDefinitionUnit
        numeric perfKpiDefinitionTargetValue
    }

    perfKpiAssignment {
        uuid perfKpiAssignmentId PK
        uuid perfKpiAssignmentDefinitionId FK
        uuid perfKpiAssignmentEmployeeId
        integer perfKpiAssignmentYear
        numeric perfKpiAssignmentTargetValue
    }

    perfKpiRecord {
        uuid perfKpiRecordId PK
        uuid perfKpiRecordAssignmentId FK
        text perfKpiRecordPeriodLabel
        numeric perfKpiRecordActualValue
    }

    perfOkrObjective {
        uuid perfOkrObjectiveId PK
        uuid perfOkrObjectiveEmployeeId
        text perfOkrObjectiveTitle
        integer perfOkrObjectiveYear
        text perfOkrObjectiveStatus
        uuid perfOkrObjectiveParentObjectiveId FK
    }

    perfOkrKeyResult {
        uuid perfOkrKeyResultId PK
        uuid perfOkrKeyResultObjectiveId FK
        text perfOkrKeyResultTitle
        numeric perfOkrKeyResultCurrentValue
        numeric perfOkrKeyResultTargetValue
    }

    perfOkrCheckin {
        uuid perfOkrCheckinId PK
        uuid perfOkrCheckinKeyResultId FK
        numeric perfOkrCheckinNewValue
        text perfOkrCheckinNote
    }

    perf360Cycle {
        uuid perf360CycleId PK
        text perf360CycleName
        integer perf360CycleYear
        text perf360CycleStatus
    }

    perf360Competency {
        uuid perf360CompetencyId PK
        uuid perf360CompetencyCycleId FK
        text perf360CompetencyName
        jsonb perf360CompetencyQuestions
    }

    perf360Nomination {
        uuid perf360NominationId PK
        uuid perf360NominationCycleId FK
        uuid perf360NominationRevieweeEmployeeId
        uuid perf360NominationReviewerEmployeeId
        text perf360NominationStatus
    }

    perf360Response {
        uuid perf360ResponseId PK
        uuid perf360ResponseNominationId FK
        uuid perf360ResponseCycleId FK
        numeric perf360ResponseOverallScore
    }

    perfEvaluation {
        uuid perfEvaluationId PK
        uuid perfEvaluationEvaluateeEmployeeId
        jsonb perfEvaluationScores
        numeric perfEvaluationOverallScore
        text perfEvaluationGrade
    }

    perfEvaluationFeedback {
        uuid perfEvaluationFeedbackId PK
        uuid perfEvaluationFeedbackEmployeeId
        numeric perfEvaluationFeedbackOverallScore
        text perfEvaluationFeedbackFeedback
    }

    perfKpiDefinition ||--o{ perfKpiAssignment : "perfKpiAssignmentDefinitionId"
    perfKpiAssignment ||--o{ perfKpiRecord : "perfKpiRecordAssignmentId"
    perfOkrObjective ||--o{ perfOkrObjective : "perfOkrObjectiveParentObjectiveId (self-ref)"
    perfOkrObjective ||--o{ perfOkrKeyResult : "perfOkrKeyResultObjectiveId"
    perfOkrKeyResult ||--o{ perfOkrCheckin : "perfOkrCheckinKeyResultId"
    perf360Cycle ||--o{ perf360Competency : "perf360CompetencyCycleId"
    perf360Cycle ||--o{ perf360Nomination : "perf360NominationCycleId"
    perf360Cycle ||--o{ perf360Response : "perf360ResponseCycleId"
    perf360Nomination ||--o{ perf360Response : "perf360ResponseNominationId"
```

---

## 8. Omnichannel -- ระบบสื่อสารหลายช่องทาง

ระบบ Omnichannel รองรับการสื่อสารผ่านหลายช่องทาง (LINE, Facebook, Web Chat ฯลฯ) โดยแต่ละ Channel จะมี Contact ที่เข้ามาสนทนา (Conversation) และบันทึกข้อความ (Message) รวมถึงรองรับ AI Auto Reply ระบบยังสามารถสร้างใบเสนอราคา (Quotation) จากบทสนทนาได้โดยตรง และมี Price Item สำหรับอ้างอิงราคาสินค้า

```mermaid
erDiagram
    omChannel {
        uuid omChannelId PK
        text omChannelType UK
        text omChannelName
        text omChannelAccessToken
        text omChannelStatus
    }

    omContact {
        uuid omContactId PK
        text omContactChannelType
        text omContactExternalId
        text omContactDisplayName
    }

    omConversation {
        uuid omConversationId PK
        uuid omConversationContactId FK
        text omConversationChannelType
        text omConversationStatus
        boolean omConversationAiAutoReply
    }

    omMessage {
        uuid omMessageId PK
        uuid omMessageConversationId FK
        text omMessageSenderType
        text omMessageContent
        text omMessageType
        boolean omMessageIsAi
        jsonb omMessageOcrData
    }

    omPriceItem {
        uuid omPriceItemId PK
        text omPriceItemNumber UK
        text omPriceItemName
        numeric omPriceItemUnitPrice
    }

    omQuotation {
        uuid omQuotationId PK
        uuid omQuotationConversationId FK
        uuid omQuotationContactId FK
        text omQuotationNo
        text omQuotationStatus
        text omQuotationCustomerName
    }

    omQuotationLine {
        uuid omQuotationLineId PK
        uuid omQuotationLineQuotationId FK
        text omQuotationLineProductName
        numeric omQuotationLineQuantity
        numeric omQuotationLineAmount
    }

    omAiSetting {
        uuid omAiSettingId PK
        text omAiSettingSystemPrompt
        text omAiSettingModel
        numeric omAiSettingTemperature
    }

    omContact ||--o{ omConversation : "omConversationContactId"
    omConversation ||--o{ omMessage : "omMessageConversationId"
    omConversation ||--o{ omQuotation : "omQuotationConversationId"
    omContact ||--o{ omQuotation : "omQuotationContactId"
    omQuotation ||--o{ omQuotationLine : "omQuotationLineQuotationId"
```

---

## 9. Warehouse -- ระบบคลังสินค้าและ RFID

ระบบคลังสินค้ารองรับการสแกน RFID ผ่าน Scan Session โดยแต่ละ Session จะบันทึก Scan Record (EPC tag) และสามารถจับคู่กับใบสั่งขาย (Order Match) เพื่อตรวจสอบความถูกต้องของสินค้า ระบบยังจัดการเวอร์ชันของแอปพลิเคชัน (App Version) สำหรับอัปเดต

```mermaid
erDiagram
    whScanSession {
        uuid whScanSessionId PK
        uuid whScanSessionUserId
        text whScanSessionName
        text whScanSessionType
        integer whScanSessionTagCount
    }

    whScanRecord {
        uuid whScanRecordId PK
        uuid whScanRecordSessionId FK
        text whScanRecordEpc
        text whScanRecordItemNumber
        text whScanRecordItemName
    }

    whOrderMatch {
        uuid whOrderMatchId PK
        uuid whOrderMatchSessionId FK
        text whOrderMatchOrderNumber
        text whOrderMatchStatus
        integer whOrderMatchExpectedItems
        integer whOrderMatchScannedItems
    }

    whAppVersion {
        uuid whAppVersionId PK
        text whAppVersionCode
        text whAppVersionName
        text whAppVersionDownloadUrl
    }

    whScanSession ||--o{ whScanRecord : "whScanRecordSessionId"
    whScanSession ||--o{ whOrderMatch : "whOrderMatchSessionId"
```
