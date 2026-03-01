# Sequence Diagrams

เอกสาร Sequence Diagram แสดงลำดับการทำงานของ flow สำคัญในระบบ Evergreen ERP

---

## 1. Authentication Flow — Password Login

```mermaid
sequenceDiagram
    actor User as ผู้ใช้งาน
    participant Browser as Browser
    participant SignIn as /auth/signin
    participant SupaAuth as Supabase Auth
    participant AuthCtx as AuthContext

    User->>Browser: เปิดหน้า Login
    Browser->>SignIn: แสดงฟอร์ม Email + Password

    User->>SignIn: กรอก email + password
    SignIn->>SupaAuth: supabase.auth.signInWithPassword({email, password})

    alt Login สำเร็จ
        SupaAuth-->>SignIn: { user, session }
        SignIn->>Browser: localStorage.setItem("lastLoginEmail", email)
        SignIn->>Browser: router.push("/overview/dashboard")
        Browser->>AuthCtx: onAuthStateChange(SIGNED_IN)
        AuthCtx->>AuthCtx: setUser(user)
        AuthCtx->>AuthCtx: เริ่ม inactivity timer (30 นาที)
        AuthCtx->>AuthCtx: เริ่ม session check (ทุก 1 นาที)
    else Login ล้มเหลว
        SupaAuth-->>SignIn: { error }
        SignIn->>Browser: toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
    end
```

---

## 2. Authentication Flow — PIN Login

```mermaid
sequenceDiagram
    actor User as ผู้ใช้งาน
    participant Browser as Browser
    participant PinForm as PinForm
    participant PinAPI as /api/auth/pin/verify
    participant SupaAuth as Supabase Auth

    User->>Browser: เปิดหน้า Login (เลือกโหมด PIN)
    Browser->>PinForm: แสดง PIN input (6 หลัก)

    User->>PinForm: กรอก PIN 6 หลัก
    PinForm->>PinAPI: POST { email, pin }

    PinAPI->>SupaAuth: admin.getUserByEmail(email)
    SupaAuth-->>PinAPI: user (with app_metadata.pinHash)

    alt ถูก lock (failedAttempts >= 5)
        PinAPI-->>PinForm: 429 "บัญชีถูกล็อค 15 นาที"
    else PIN ถูกต้อง
        PinAPI->>PinAPI: bcrypt.compare(pin, pinHash) ✓
        PinAPI->>SupaAuth: admin.generateLink({ type: "magiclink", email })
        SupaAuth-->>PinAPI: { token_hash }
        PinAPI->>SupaAuth: admin.updateUser({ pinFailedAttempts: 0 })
        PinAPI-->>PinForm: { token_hash }
        PinForm->>SupaAuth: supabase.auth.verifyOtp({ token_hash, type: "magiclink" })
        SupaAuth-->>PinForm: { session }
        PinForm->>Browser: router.push("/overview/dashboard")
    else PIN ผิด
        PinAPI->>PinAPI: bcrypt.compare(pin, pinHash) ✗
        PinAPI->>SupaAuth: admin.updateUser({ pinFailedAttempts: +1 })
        PinAPI-->>PinForm: 401 "PIN ไม่ถูกต้อง"
        PinForm->>Browser: toast.error + เหลืออีก N ครั้ง
    end
```

---

## 3. API Request — Permission Check Flow

```mermaid
sequenceDiagram
    actor User as ผู้ใช้งาน
    participant Client as Client (Browser/Mobile)
    participant API as API Route
    participant Auth as withAuth()
    participant SupaAuth as Supabase Auth
    participant DB as Supabase DB

    User->>Client: กดปุ่ม / เปิดหน้า
    Client->>API: HTTP Request (Cookie or Bearer token)

    API->>Auth: await withAuth()

    alt Web (Cookie Auth)
        Auth->>SupaAuth: supabase.auth.getUser() (from cookie)
        SupaAuth-->>Auth: { user }
    else Mobile (Bearer Token)
        Auth->>Auth: extract Bearer token from header
        Auth->>SupaAuth: supabase.auth.getUser(token)
        SupaAuth-->>Auth: { user }
    end

    alt ไม่มี user
        Auth-->>API: { error: 401 Unauthorized }
        API-->>Client: 401 JSON
    else มี user
        Auth->>DB: SELECT rbacUserRole → rbacRole WHERE isSuperadmin AND isActive
        DB-->>Auth: isSuperAdmin: true/false
        Auth-->>API: { supabase, session: { user }, isSuperAdmin }

        API->>DB: Business logic (SELECT/INSERT/UPDATE)
        DB-->>API: data
        API-->>Client: 200 JSON

        Note over API,DB: บาง endpoint จะ log access:<br/>INSERT rbacAccessLog
    end
```

---

## 4. BC Sync Flow

```mermaid
sequenceDiagram
    participant Cron as Cron / Manual Trigger
    participant Sync as /api/sync/bc
    participant BC as BC 365 OData
    participant DB as Supabase DB

    Cron->>Sync: GET /api/sync/bc?stream=1 (Bearer CRON_SECRET)

    Sync->>Sync: Acquire sync lock (TTL 5 min)

    rect rgb(240, 248, 255)
        Note over Sync,BC: Phase 1: Dimension Values
        Sync->>BC: bcApiGet("dimensionValues")
        BC-->>Sync: dimension codes + names
        Sync->>Sync: สร้าง dimMap (code → name)
    end

    rect rgb(240, 255, 240)
        Note over Sync,BC: Phase 2: Customers
        Sync->>BC: bcODataGet("CustomerList")
        BC-->>Sync: customers[]
        Sync->>DB: batchUpsert("bcCustomer", rows, 1000/batch)
        Sync-->>Cron: SSE: progress customers
    end

    rect rgb(255, 248, 240)
        Note over Sync,BC: Phase 3: Items (RFID preservation)
        Sync->>BC: bcODataGet("Item_Card_Excel", Blocked eq false)
        BC-->>Sync: items[]
        Sync->>DB: SELECT bcItemExternalId, bcItemRfidCode WHERE rfidCode NOT NULL
        DB-->>Sync: rfidMap (preserve existing RFID codes)
        Sync->>Sync: Merge rfidMap into itemRows
        Sync->>DB: batchUpsert("bcItem", rows, 1000/batch)
        Sync-->>Cron: SSE: progress items
    end

    rect rgb(248, 240, 255)
        Note over Sync,BC: Phase 4: Sales Orders + Lines
        par Parallel fetch
            Sync->>BC: bcODataGet("Sales_Order_Excel", startswith SO26)
            Sync->>BC: bcODataGet("Sales_Order_Line_Excel", startswith SO26)
        end
        BC-->>Sync: orders[] + lines[]
        Sync->>Sync: คำนวณ totalAmount per order
        Sync->>DB: batchUpsert("bcSalesOrder") + batchUpsert("bcSalesOrderLine")
    end

    rect rgb(255, 240, 240)
        Note over Sync,BC: Phase 5: Production
        par Parallel fetch
            Sync->>BC: bcProductionODataGet("productionOrder")
            Sync->>BC: bcProductionODataGet("ItemLedgerEntries")
        end
        BC-->>Sync: prodOrders[] + ileEntries[]
        Sync->>DB: DELETE all from bcProductionOrder + bcItemLedgerEntry
        Sync->>DB: batchUpsert (full replace strategy)
    end

    rect rgb(240, 240, 240)
        Note over Sync,DB: Phase 6: Cleanup
        Sync->>DB: COUNT stale records (syncedAt < now)
        Sync->>Sync: Safety check: stale < 50% of total?

        alt Items cleanup
            Sync->>DB: DELETE stale items WHERE rfidCode IS NULL
            Sync->>DB: UPDATE blocked=true, inventory=0 WHERE rfidCode IS NOT NULL
        end
        alt Customer/SO cleanup
            Sync->>DB: DELETE stale customers/orders
        end
    end

    Sync->>Sync: Release sync lock
    Sync-->>Cron: SSE: done { results, cleanup }
```

---

## 5. LINE Message Flow

```mermaid
sequenceDiagram
    actor Customer as ลูกค้า (LINE)
    participant LINE as LINE Platform
    participant Webhook as /api/marketing/omnichannel/webhooks/line
    participant DB as Supabase DB
    participant Storage as Supabase Storage
    participant AI as OpenRouter AI
    participant AIReply as /api/marketing/omnichannel/ai/reply

    Customer->>LINE: ส่งข้อความ
    LINE->>Webhook: POST webhook (body + X-Line-Signature)

    Webhook->>Webhook: HMAC-SHA256 verify (LINE_CHANNEL_SECRET)

    alt Signature ไม่ถูกต้อง
        Webhook-->>LINE: 401 Unauthorized
    end

    Webhook->>DB: SELECT omMessage WHERE externalId = messageId
    Note over Webhook,DB: ตรวจ duplicate

    alt ข้อความซ้ำ
        Webhook-->>LINE: 200 OK (skip)
    end

    Webhook->>LINE: GET /v2/bot/profile/{userId}
    LINE-->>Webhook: { displayName, pictureUrl }

    Webhook->>DB: UPSERT omContact (externalId, displayName, avatarUrl)
    Webhook->>DB: SELECT omConversation WHERE contactId AND channelType='line'

    alt ไม่มี conversation
        Webhook->>DB: INSERT omConversation
    end

    alt ข้อความเป็นรูปภาพ
        Webhook->>LINE: GET /v2/bot/message/{id}/content
        LINE-->>Webhook: image binary
        Webhook->>Storage: upsert("omnichannel", "messages/{id}.jpg")
        Storage-->>Webhook: publicUrl
    end

    Webhook->>DB: INSERT omMessage (content, type, imageUrl, externalId)
    Webhook->>DB: UPDATE omConversation (lastMessageAt, lastMessagePreview, unreadCount+1)

    alt AI Auto-Reply เปิดอยู่
        Webhook->>AIReply: POST (INTERNAL_API_SECRET)

        AIReply->>AIReply: delay 1 second (debounce)
        AIReply->>DB: SELECT last 20 messages from conversation
        AIReply->>DB: SELECT bcItem (product catalog with prices)
        AIReply->>DB: SELECT omAiSetting (system prompt, model)

        AIReply->>AI: POST chat/completions (messages + system prompt + catalog)
        AI-->>AIReply: AI response text

        alt ตรวจพบ "รับออเดอร์"
            AIReply->>AI: Extract order data (JSON)
            AIReply->>DB: INSERT omQuotation + omQuotationLine
        end

        AIReply->>LINE: POST /v2/bot/message/push (AI reply)
        AIReply->>DB: INSERT omMessage (isAi: true)
    end

    Webhook-->>LINE: 200 OK
```

---

## 6. RFID Print Flow

```mermaid
sequenceDiagram
    actor User as Warehouse Staff
    participant Modal as PrintRfidModal
    participant API as /api/warehouse/rfid/assign
    participant PrintAPI as /api/warehouse/print
    participant EPC as epc.js
    participant ZPL as zpl.js
    participant Printer as Chainway CP30 (TCP:9100)
    participant DB as Supabase DB

    Note over User,Modal: Step 1: Assign RFID Code
    User->>Modal: เลือกสินค้า
    User->>API: POST { itemNumber, rfidCode }
    API->>API: Validate range (1 - 99,999,999)
    API->>DB: SELECT bcItem WHERE rfidCode = ? AND itemNumber != ?
    DB-->>API: existing[] (duplicate check)

    alt มี duplicate
        API-->>User: 409 "rfidCode ถูกใช้แล้วโดย ..."
    else ไม่ซ้ำ
        API->>DB: UPDATE bcItem SET rfidCode = ? WHERE itemNumber = ?
        API-->>Modal: { success: true }
    end

    Note over User,Printer: Step 2: Print RFID Label
    User->>Modal: ระบุจำนวน + กดพิมพ์

    Modal->>Modal: Validate: hasRfidCode? qty ≤ 25?

    Modal->>PrintAPI: POST { item, quantity, enableRFID }

    loop สำหรับแต่ละ label (1 to qty)
        PrintAPI->>EPC: generatePlainEPC(rfidCode, seq, total)
        EPC->>EPC: Validate: rfidCode ≤ 99,999,999, seq ≤ 25
        EPC->>EPC: pad rfidCode to 8 digits
        EPC->>EPC: encode: "00000123/1A" → ASCII hex (24 chars)
        EPC-->>PrintAPI: epc hex string

        PrintAPI->>ZPL: buildThaiRFIDLabel({ itemNumber, rfidCode, displayName, ... })
        ZPL->>ZPL: textToGraphic() → node-canvas → ^GFA bitmap
        ZPL->>ZPL: ^MTT (Thermal Transfer)
        ZPL->>ZPL: ^RS8^RFW,H^FD{epc}^FS (RFID write)
        ZPL-->>PrintAPI: zpl string

        PrintAPI->>Printer: TCP send(zpl)
        Printer-->>PrintAPI: (label printed + RFID encoded)
    end

    PrintAPI-->>Modal: { success, results[] }
    Modal->>User: toast.success("พิมพ์ RFID {qty} ใบ สำเร็จ")
```

---

## 7. Sales Quotation Flow

```mermaid
sequenceDiagram
    actor Sales as Sales Rep
    participant UI as QuotationEditor
    participant API as /api/sales/quotations
    participant LineAPI as /api/sales/quotations/[id]
    participant DB as Supabase DB

    Sales->>UI: กดสร้างใบเสนอราคา
    UI->>API: POST { opportunityId, contactId, accountId }
    API->>DB: INSERT crmQuotation (status: 'draft')
    API->>DB: Generate quotationNo
    DB-->>API: quotation record
    API-->>UI: { quotation }

    Sales->>UI: เพิ่มรายการสินค้า
    UI->>LineAPI: POST lines [{ productName, qty, unitPrice }]
    LineAPI->>DB: INSERT crmQuotationLine[]
    LineAPI->>DB: UPDATE crmQuotation SET subtotal, tax, total
    DB-->>LineAPI: updated quotation
    LineAPI-->>UI: { quotation with lines }

    Sales->>UI: กดส่งอนุมัติ
    UI->>LineAPI: PUT { status: 'submitted' }
    LineAPI->>DB: UPDATE status = 'submitted'

    alt อนุมัติ
        Sales->>UI: กดอนุมัติ
        UI->>LineAPI: PUT { status: 'approved', approvedBy }
        LineAPI->>DB: UPDATE status = 'approved'
    end

    Sales->>UI: สร้าง Order จาก Quotation
    UI->>API: POST /api/sales/orders { quotationId }
    API->>DB: SELECT crmQuotation + lines
    API->>DB: INSERT crmOrder (from quotation data)
    API->>DB: INSERT order lines (from quotation lines)
    DB-->>API: order record
    API-->>UI: { order }
    UI->>Sales: แสดง Order สำเร็จ
```

---

## 8. Facebook Message Flow

```mermaid
sequenceDiagram
    actor Customer as ลูกค้า (Facebook)
    participant FB as Facebook Platform
    participant Webhook as /api/marketing/omnichannel/webhooks/facebook
    participant DB as Supabase DB
    participant Storage as Supabase Storage
    participant AIReply as AI Reply Service

    Customer->>FB: ส่งข้อความ Messenger
    FB->>Webhook: POST webhook (body + X-Hub-Signature-256)

    Webhook->>Webhook: HMAC-SHA256 verify (FACEBOOK_APP_SECRET)

    loop แต่ละ messaging event
        Webhook->>DB: SELECT omMessage WHERE externalId = mid
        Note over Webhook,DB: ตรวจ duplicate

        Webhook->>DB: UPSERT omContact (externalId = sender.id)
        Webhook->>DB: SELECT/INSERT omConversation (channelType='facebook')

        alt มี attachment (image)
            Webhook->>FB: Download image from attachment.url
            FB-->>Webhook: image binary
            Webhook->>Storage: upsert to "omnichannel" bucket
        end

        Webhook->>DB: INSERT omMessage
        Webhook->>DB: UPDATE omConversation (lastMessage, unreadCount)

        alt AI Auto-Reply เปิดอยู่
            Webhook->>AIReply: Trigger AI reply
            AIReply->>FB: POST /me/messages (Graph API)
        end
    end

    Webhook-->>FB: 200 OK
```

---

## 9. Shipment Lifecycle Flow

```mermaid
sequenceDiagram
    actor Staff as Logistics Staff
    actor Driver as Driver
    participant UI as TMS UI
    participant API as /api/tms/shipments
    participant StatusAPI as /api/tms/shipments/[id]/status
    participant GPSAPI as /api/tms/gpsLogs
    participant DB as Supabase DB

    Staff->>UI: สร้างรายการขนส่ง
    UI->>API: POST { customerName, destination, vehicleId, driverId }
    API->>DB: INSERT tmsShipment (status: 'pending')
    DB-->>API: shipment
    API-->>UI: { shipment }

    Staff->>UI: จัดส่ง (Dispatch)
    UI->>StatusAPI: POST { status: 'dispatched' }
    StatusAPI->>DB: UPDATE status='dispatched', dispatchedAt=now()

    loop ระหว่างขนส่ง
        Driver->>GPSAPI: POST { vehicleId, shipmentId, lat, lon, speed }
        GPSAPI->>DB: INSERT tmsGpsLog
        Note over Driver,DB: GPS log ทุก N วินาที
    end

    Driver->>UI: ยืนยันส่งถึง
    UI->>StatusAPI: POST { status: 'in_transit' }
    StatusAPI->>DB: UPDATE status='in_transit'

    Driver->>UI: ส่งมอบสำเร็จ
    UI->>StatusAPI: POST { status: 'delivered' }
    StatusAPI->>DB: UPDATE status='delivered', deliveredAt=now()
    StatusAPI->>DB: INSERT tmsDelivery (shipmentId, status: 'completed')

    Staff->>UI: ดูรายงาน
    UI->>API: GET /api/tms/reports
    API->>DB: Aggregate queries (cost, distance, time)
    DB-->>API: report data
    API-->>UI: { reports }
```

---

## 10. Session Management & Inactivity Timeout

```mermaid
sequenceDiagram
    participant Browser as Browser
    participant AuthCtx as AuthContext
    participant SupaAuth as Supabase Auth

    Note over Browser,SupaAuth: เมื่อ user login สำเร็จ

    AuthCtx->>AuthCtx: เริ่ม inactivityTimer = 30 นาที
    AuthCtx->>AuthCtx: เริ่ม sessionCheckInterval = 1 นาที
    AuthCtx->>Browser: addEventListener: mousemove, keydown, scroll, touchstart

    loop ทุก 1 นาที
        AuthCtx->>SupaAuth: supabase.auth.getUser()
        alt Session valid
            SupaAuth-->>AuthCtx: { user }
        else Session expired
            SupaAuth-->>AuthCtx: { error }
            AuthCtx->>SupaAuth: supabase.auth.signOut()
            AuthCtx->>Browser: router.push("/auth/signin")
        end
    end

    Browser->>AuthCtx: User activity (mouse/keyboard/scroll/touch)
    AuthCtx->>AuthCtx: Reset inactivityTimer = 30 นาที

    Note over AuthCtx: ถ้าไม่มี activity 30 นาที
    AuthCtx->>SupaAuth: supabase.auth.signOut()
    AuthCtx->>Browser: router.push("/auth/signin")
    Browser->>Browser: toast.info("ออกจากระบบเนื่องจากไม่มีการใช้งาน")
```
