# Data Flow Diagrams (DFD)

เอกสาร Data Flow Diagram แสดงการไหลของข้อมูลในระบบ Evergreen ERP

---

## 1. Context Diagram (Level 0)

แสดงภาพรวมระบบ Evergreen กับ external entities ทั้งหมด

```mermaid
flowchart TB
    User([👤 ผู้ใช้งาน\nWeb Browser / Mobile])
    BC([🏢 Microsoft\nBusiness Central 365])
    LINE([💬 LINE\nMessaging API])
    FB([📘 Facebook\nMessenger API])
    AI([🤖 OpenRouter\nAI API])
    Printer([🖨️ Chainway CP30\nRFID Printer])
    Scanner([📱 Chainway C72\nRFID Scanner])
    Cron([⏰ Cron Scheduler])

    subgraph Evergreen["🌲 Evergreen ERP"]
        System[ระบบ Evergreen ERP\nNext.js + Supabase]
    end

    User -->|"HTTP Request\n(Cookie/Bearer Auth)"| System
    System -->|"HTML/JSON Response"| User

    Cron -->|"GET /api/sync/bc\n(Bearer CRON_SECRET)"| System
    System -->|"OData V4 API"| BC
    BC -->|"Customers, Items,\nSales Orders, Production"| System

    LINE -->|"Webhook POST\n(HMAC-SHA256)"| System
    System -->|"Push Message API"| LINE

    FB -->|"Webhook POST\n(HMAC-SHA256)"| System
    System -->|"Graph API /me/messages"| FB

    System -->|"Chat Completions API"| AI
    AI -->|"AI Response"| System

    System -->|"ZPL over TCP/IP\nport 9100"| Printer
    Scanner -->|"EPC Hex → POST /api/warehouse/rfid/decode"| System
```

---

## 2. Level 1 DFD — Main System Processes

```mermaid
flowchart TB
    User([👤 ผู้ใช้งาน])
    BC([🏢 BC 365])
    LINE([💬 LINE])
    FB([📘 Facebook])
    AI([🤖 AI])
    Printer([🖨️ Printer])

    subgraph Evergreen
        AUTH[1.0\nAuthentication\n& RBAC]
        HR[2.0\nHR Module]
        SALES[3.0\nSales/CRM Module]
        MKT[4.0\nMarketing\nOmnichannel]
        FIN[5.0\nFinance Module]
        TMS[6.0\nTMS Module]
        WH[7.0\nWarehouse\n& RFID]
        PROD[8.0\nProduction Module]
        PERF[9.0\nPerformance Module]
        IT[10.0\nIT Module]
        SYNC[11.0\nBC Sync Engine]
    end

    DB[(Supabase\nPostgreSQL)]

    User --> AUTH
    AUTH --> HR & SALES & MKT & FIN & TMS & WH & PROD & PERF & IT

    HR --> DB
    SALES --> DB
    MKT --> DB
    FIN --> DB
    TMS --> DB
    WH --> DB
    PROD --> DB
    PERF --> DB
    IT --> DB

    SYNC --> BC
    BC --> SYNC
    SYNC --> DB

    LINE --> MKT
    FB --> MKT
    MKT --> LINE & FB & AI

    WH --> Printer
```

---

## 3. Level 2 DFD — BC Sync Flow

แสดงกระบวนการ Sync ข้อมูลจาก Business Central 365

```mermaid
flowchart TB
    Cron([⏰ Cron / Manual Trigger])
    BC([🏢 BC 365 OData])

    subgraph SyncEngine["11.0 BC Sync Engine"]
        LOCK[11.1\nAcquire Sync Lock\nTTL 5 min]
        DIM[11.2\nFetch Dimension Values\nProject/Cost Center mapping]
        CUST[11.3\nSync Customers\nbcCustomer table]
        ITEM[11.4\nSync Items\nbcItem table\n+ RFID preservation]
        SO[11.5\nSync Sales Orders\nbcSalesOrder +\nbcSalesOrderLine]
        PO[11.6\nSync Production\nbcProductionOrder +\nbcItemLedgerEntry]
        CLEAN[11.7\nCleanup Stale Data\nSafety threshold 50%]
        UNLOCK[11.8\nRelease Lock]
    end

    DB[(Supabase)]

    Cron -->|"GET /api/sync/bc"| LOCK
    LOCK --> DIM
    DIM -->|"bcApiGet\ndimensionValues"| BC
    DIM --> CUST

    CUST -->|"bcODataGet\nCustomerList"| BC
    CUST -->|"batchUpsert\n1000 rows/batch"| DB
    CUST --> ITEM

    ITEM -->|"bcODataGet\nItem_Card_Excel"| BC
    ITEM -->|"SELECT bcItemRfidCode\nWHERE NOT NULL"| DB
    ITEM -->|"batchUpsert\npreserve RFID codes"| DB
    ITEM --> SO

    SO -->|"bcODataGet\nSales_Order_Excel +\nSales_Order_Line_Excel"| BC
    SO -->|"batchUpsert"| DB
    SO --> PO

    PO -->|"bcProductionODataGet\nproductionOrder +\nItemLedgerEntries"| BC
    PO -->|"DELETE all → INSERT\n(full replace)"| DB
    PO --> CLEAN

    CLEAN -->|"DELETE stale rows\n(no RFID)"| DB
    CLEAN -->|"UPDATE blocked=true\n(has RFID)"| DB
    CLEAN --> UNLOCK
```

---

## 4. Level 2 DFD — Omnichannel Message Flow

แสดงการรับ-ส่งข้อความผ่าน LINE/Facebook

```mermaid
flowchart TB
    LINE([💬 LINE Platform])
    FB([📘 Facebook Platform])
    AI([🤖 OpenRouter AI])
    Storage[(Supabase Storage\nomnichannel bucket)]

    subgraph Omnichannel["4.0 Marketing Omnichannel"]
        WH_VERIFY[4.1\nWebhook Verify\nHMAC-SHA256]
        MSG_PROCESS[4.2\nProcess Message\nText / Image / Sticker]
        CONTACT_UPSERT[4.3\nUpsert Contact\nomContact]
        CONV_FIND[4.4\nFind/Create\nConversation]
        IMG_STORE[4.5\nDownload & Store\nImage]
        MSG_SAVE[4.6\nSave Message\nomMessage]
        AI_CHECK[4.7\nCheck AI\nAuto-Reply Setting]
        AI_GENERATE[4.8\nGenerate AI Reply\nContext + Catalog]
        AI_SEND[4.9\nSend Reply\nvia Platform API]
        OCR[4.10\nSlip OCR\nPayment Detection]
        QUOTE_EXTRACT[4.11\nExtract Order\nfrom Conversation]
    end

    DB[(Supabase)]

    LINE -->|"POST webhook\n+ signature"| WH_VERIFY
    FB -->|"POST webhook\n+ signature"| WH_VERIFY

    WH_VERIFY --> MSG_PROCESS
    MSG_PROCESS --> CONTACT_UPSERT
    CONTACT_UPSERT -->|"upsert omContact"| DB
    CONTACT_UPSERT --> CONV_FIND
    CONV_FIND -->|"find/create omConversation"| DB

    MSG_PROCESS -->|"image message"| IMG_STORE
    IMG_STORE -->|"download from LINE/FB"| LINE & FB
    IMG_STORE -->|"upload to bucket"| Storage

    CONV_FIND --> MSG_SAVE
    MSG_SAVE -->|"insert omMessage"| DB

    MSG_SAVE --> AI_CHECK
    AI_CHECK -->|"omConversationAiAutoReply = true"| AI_GENERATE
    AI_GENERATE -->|"last 20 messages\n+ product catalog"| DB
    AI_GENERATE -->|"chat completions"| AI
    AI_GENERATE --> AI_SEND
    AI_SEND -->|"push message"| LINE
    AI_SEND -->|"Graph API"| FB
    AI_SEND -->|"save AI message"| DB

    IMG_STORE -->|"image after order"| OCR
    OCR -->|"vision model"| AI
    OCR -->|"save ocrData"| DB

    AI_GENERATE -->|"รับออเดอร์"| QUOTE_EXTRACT
    QUOTE_EXTRACT -->|"create omQuotation"| DB
```

---

## 5. Level 2 DFD — Sales Pipeline Flow

แสดงขั้นตอนการขายจาก Lead ถึง Order

```mermaid
flowchart TB
    User([👤 Sales Rep])

    subgraph SalesPipeline["3.0 Sales/CRM Module"]
        LEAD[3.1\nCreate Lead\ncrmLead]
        QUALIFY[3.2\nQualify Lead\nScore: hot/warm/cold]
        CONVERT[3.3\nConvert Lead\n→ Contact + Opportunity]
        OPP[3.4\nManage Opportunity\nPipeline stages]
        QUOTE[3.5\nCreate Quotation\ncrmQuotation + Lines]
        APPROVE[3.6\nApprove Quotation]
        ORDER[3.7\nCreate Order\ncrmOrder]
        ACTIVITY[3.8\nLog Activities\ncrmActivity]
    end

    DB[(Supabase)]

    User --> LEAD
    LEAD -->|"insert crmLead"| DB
    LEAD --> QUALIFY
    QUALIFY -->|"update score/status"| DB

    QUALIFY -->|"status = qualified"| CONVERT
    CONVERT -->|"create crmContact"| DB
    CONVERT -->|"create crmOpportunity"| DB
    CONVERT -->|"update lead.convertedContactId\n+ convertedOpportunityId"| DB

    CONVERT --> OPP
    OPP -->|"update stage:\nprospecting → proposal →\nnegotiation → won/lost"| DB
    OPP --> QUOTE

    QUOTE -->|"insert crmQuotation\n+ crmQuotationLine"| DB
    QUOTE --> APPROVE
    APPROVE -->|"update status:\ndraft → approved"| DB
    APPROVE --> ORDER

    ORDER -->|"insert crmOrder\nfrom quotation"| DB

    User --> ACTIVITY
    ACTIVITY -->|"insert crmActivity\n(call/email/meeting/task)"| DB
```

---

## 6. Level 2 DFD — RFID/Warehouse Flow

แสดงกระบวนการจัดการ RFID ในคลังสินค้า

```mermaid
flowchart TB
    User([👤 Warehouse Staff])
    Printer([🖨️ Chainway CP30])
    Scanner([📱 Chainway C72])

    subgraph Warehouse["7.0 Warehouse & RFID"]
        ASSIGN[7.1\nAssign RFID Code\n/api/warehouse/rfid/assign]
        VALIDATE[7.2\nValidate\nRange 1-99,999,999\nDuplicate check]
        PRINT[7.3\nPrint RFID Label\nPrintRfidModal]
        EPC[7.4\nGenerate EPC\n96-bit encoding]
        ZPL[7.5\nBuild ZPL\nThai text + RFID write]
        SEND[7.6\nTCP Send\nport 9100]
        SCAN[7.7\nRFID Scan\nChainway C72]
        DECODE[7.8\nDecode EPC\n/api/warehouse/rfid/decode]
        LOOKUP[7.9\nItem Lookup\nbcItemRfidCode]
        INVENTORY[7.10\nView Inventory\nGrouped by project]
    end

    DB[(Supabase)]

    User -->|"assign rfidCode\nto item"| ASSIGN
    ASSIGN --> VALIDATE
    VALIDATE -->|"check duplicate\nbcItemRfidCode"| DB
    VALIDATE -->|"update\nbcItemRfidCode"| DB

    User -->|"print label"| PRINT
    PRINT -->|"check hasRfidCode\n& batch ≤ 25"| EPC
    EPC -->|"rfidCode → 8-digit pad\n+ /seq+total"| ZPL
    ZPL -->|"^GFA bitmap (Thai)\n+ ^RFW,H (RFID)"| SEND
    SEND -->|"ZPL over TCP/IP"| Printer

    Scanner -->|"scan EPC hex"| SCAN
    SCAN -->|"POST epc hex"| DECODE
    DECODE -->|"parse ASCII\nextract rfidCode"| LOOKUP
    LOOKUP -->|"SELECT * FROM bcItem\nWHERE bcItemRfidCode = ?"| DB
    LOOKUP -->|"item details"| User

    User --> INVENTORY
    INVENTORY -->|"SELECT bcItem\nGROUP BY project"| DB
```

---

## 7. Level 2 DFD — Auth & RBAC Flow

แสดงกระบวนการ Authentication และ Permission Check

```mermaid
flowchart TB
    User([👤 ผู้ใช้งาน])

    subgraph AuthRBAC["1.0 Authentication & RBAC"]
        LOGIN_PW[1.1\nPassword Login\nsupabase.auth.signInWithPassword]
        LOGIN_PIN[1.2\nPIN Login\nbcrypt verify → magic link]
        SESSION[1.3\nSession Management\n30-min timeout]
        API_AUTH[1.4\nAPI withAuth\nCookie or Bearer]
        PERM_CHECK[1.5\nPermission Check\nget_user_permissions RPC]
        ACCESS_LOG[1.6\nLog Access\nrbacAccessLog]
    end

    DB[(Supabase)]
    SupaAuth[(Supabase Auth)]

    User -->|"email + password"| LOGIN_PW
    LOGIN_PW -->|"signInWithPassword"| SupaAuth
    SupaAuth -->|"JWT cookie"| SESSION

    User -->|"6-digit PIN"| LOGIN_PIN
    LOGIN_PIN -->|"verify bcrypt hash"| SupaAuth
    LOGIN_PIN -->|"generate magic link"| SupaAuth
    SupaAuth -->|"JWT cookie"| SESSION

    SESSION -->|"check every 1 min"| SupaAuth
    SESSION -->|"30 min inactivity\n→ auto sign out"| User

    User -->|"API request"| API_AUTH
    API_AUTH -->|"getUser from cookie/token"| SupaAuth
    API_AUTH --> PERM_CHECK
    PERM_CHECK -->|"RPC get_user_permissions\nrbacUserRole → rbacRole →\nrbacRolePermission →\nrbacPermission →\nrbacResource + rbacAction"| DB
    PERM_CHECK -->|"resource:action match"| ACCESS_LOG
    ACCESS_LOG -->|"insert rbacAccessLog"| DB
```

---

## 8. Level 2 DFD — TMS Shipment Flow

แสดงกระบวนการจัดส่งสินค้า

```mermaid
flowchart TB
    User([👤 Logistics Staff])
    Driver([🚛 Driver])

    subgraph TMS["6.0 TMS Module"]
        CREATE[6.1\nCreate Shipment\ntmsShipment]
        ASSIGN_V[6.2\nAssign Vehicle\n& Driver]
        DISPATCH[6.3\nDispatch\nstatus → dispatched]
        TRANSIT[6.4\nIn Transit\nGPS tracking]
        DELIVER[6.5\nDelivered\nstatus → delivered]
        FUEL[6.6\nFuel Log\ntmsFuelLog]
        MAINT[6.7\nMaintenance\ntmsMaintenance]
        REPORT[6.8\nReports\nCost, distance, time]
        ALERT[6.9\nAlerts\nLicense/insurance expiry]
    end

    DB[(Supabase)]

    User --> CREATE
    CREATE -->|"insert tmsShipment\n+ route + items"| DB
    CREATE --> ASSIGN_V
    ASSIGN_V -->|"set vehicleId, driverId"| DB

    User --> DISPATCH
    DISPATCH -->|"update status=dispatched\ndispatchedAt=now"| DB

    Driver --> TRANSIT
    TRANSIT -->|"insert tmsGpsLog\nlat, lon, speed"| DB

    Driver --> DELIVER
    DELIVER -->|"update status=delivered\ndeliveredAt=now"| DB
    DELIVER -->|"create tmsDelivery"| DB

    Driver --> FUEL
    FUEL -->|"insert tmsFuelLog\nliters, cost, mileage"| DB

    User --> MAINT
    MAINT -->|"insert tmsMaintenance\ntype, cost, nextDue"| DB

    User --> REPORT
    REPORT -->|"aggregate queries"| DB

    DB -->|"license/insurance expiry\nvehicle maintenance due"| ALERT
    ALERT --> User
```

---

## 9. Level 2 DFD — Performance Management Flow

```mermaid
flowchart TB
    Manager([👤 Manager])
    Employee([👤 Employee])
    AI([🤖 AI])

    subgraph Performance["9.0 Performance Module"]
        EVAL[9.1\nValue Evaluation\nperfEvaluation]
        KPI_DEF[9.2\nDefine KPI\nperfKpiDefinition]
        KPI_ASSIGN[9.3\nAssign KPI\nperfKpiAssignment]
        KPI_RECORD[9.4\nRecord KPI\nperfKpiRecord]
        OKR_OBJ[9.5\nSet Objectives\nperfOkrObjective]
        OKR_KR[9.6\nKey Results\nperfOkrKeyResult]
        OKR_CHECK[9.7\nCheck-in\nperfOkrCheckin]
        C360_CYCLE[9.8\nCreate 360 Cycle\nperf360Cycle]
        C360_NOM[9.9\nNominate Reviewers\nperf360Nomination]
        C360_RESP[9.10\nSubmit Responses\nperf360Response]
        FEEDBACK[9.11\nGenerate Feedback\nAI-powered]
    end

    DB[(Supabase)]

    Manager --> EVAL
    EVAL -->|"insert perfEvaluation\nscores by category"| DB

    Manager --> KPI_DEF
    KPI_DEF -->|"insert perfKpiDefinition"| DB
    KPI_DEF --> KPI_ASSIGN
    KPI_ASSIGN -->|"assign to employee\n+ target + weight"| DB
    Employee --> KPI_RECORD
    KPI_RECORD -->|"insert actual value\nby period"| DB

    Employee --> OKR_OBJ
    OKR_OBJ -->|"insert objective\n(supports parent → child)"| DB
    OKR_OBJ --> OKR_KR
    OKR_KR -->|"insert key result\nstart → target value"| DB
    Employee --> OKR_CHECK
    OKR_CHECK -->|"insert check-in\nprevious → new value"| DB

    Manager --> C360_CYCLE
    C360_CYCLE -->|"create cycle\n+ competencies"| DB
    C360_CYCLE --> C360_NOM
    C360_NOM -->|"nominate reviewers\nself/peer/supervisor/subordinate"| DB
    Employee --> C360_RESP
    C360_RESP -->|"submit scores\n+ comments"| DB

    EVAL -->|"evaluation data"| FEEDBACK
    FEEDBACK -->|"generate AI feedback"| AI
    FEEDBACK -->|"save perfEvaluationFeedback"| DB
```
