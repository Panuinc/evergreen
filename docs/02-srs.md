# Software Requirements Specification (SRS)

## Evergreen ERP System

| รายการ | รายละเอียด |
|--------|------------|
| **โครงการ** | Evergreen ERP |
| **บริษัท** | C.H.H. |
| **เวอร์ชัน** | 1.0 |
| **วันที่** | 2026-03-01 |
| **Tech Stack** | Next.js (App Router), Supabase (PostgreSQL), HeroUI, Tailwind CSS |
| **Deployment** | Vercel (Serverless) |
| **External Integration** | Microsoft Dynamics 365 Business Central (OData), LINE Messaging API, Facebook Messenger API, OpenRouter AI |

---

## 1. บทนำ (Introduction)

### 1.1 วัตถุประสงค์ (Purpose)

ระบบ Evergreen ERP เป็นระบบ Enterprise Resource Planning ที่พัฒนาขึ้นสำหรับบริษัท C.H.H. เพื่อรวมศูนย์การบริหารจัดการทรัพยากรองค์กรทั้งหมดไว้ในแพลตฟอร์มเดียว ครอบคลุมตั้งแต่การบริหารทรัพยากรบุคคล การขาย การเงิน ไอที การตลาด การผลิต คลังสินค้า ไปจนถึงการขนส่ง

### 1.2 ขอบเขต (Scope)

ระบบครอบคลุม 14 module หลัก ที่ทำงานร่วมกัน:

| # | Module | คำอธิบาย |
|---|--------|----------|
| 1 | RBAC | จัดการสิทธิ์การเข้าถึง ผู้ใช้ บทบาท |
| 2 | HR | จัดการทรัพยากรบุคคล |
| 3 | Performance | ประเมินผลงานพนักงาน |
| 4 | IT | จัดการทรัพย์สินไอที และ Helpdesk |
| 5 | Finance | การเงิน — ข้อมูลจาก Business Central |
| 6 | Sales/CRM | การขาย ลูกค้าสัมพันธ์ ใบเสนอราคา คำสั่งซื้อ |
| 7 | Marketing | การตลาด Omnichannel Chat และ AI |
| 8 | Production | การผลิต — ข้อมูลจาก Business Central |
| 9 | TMS | ระบบจัดการขนส่ง |
| 10 | Warehouse | คลังสินค้า RFID |
| 11 | BC Integration | ข้อมูล read-only จาก Business Central |
| 12 | Settings | ตั้งค่าระบบ การ sync ข้อมูล |
| 13 | Overview | Dashboard และ Analytics ภาพรวม |
| 14 | Profile | โปรไฟล์ผู้ใช้ เปลี่ยนรหัสผ่าน |

### 1.3 กลุ่มผู้ใช้ (User Roles)

| Role | คำอธิบาย | Module หลักที่ใช้งาน |
|------|----------|---------------------|
| **Admin** | ผู้ดูแลระบบ สิทธิ์สูงสุด | RBAC, Settings, ทุก module |
| **HR Manager** | ผู้จัดการฝ่ายบุคคล | HR, Performance |
| **Sales Rep** | พนักงานขาย | Sales/CRM, Finance |
| **Marketing Staff** | พนักงานการตลาด | Marketing, Omnichannel Chat |
| **IT Staff** | พนักงานไอที | IT, RBAC |
| **Warehouse Staff** | พนักงานคลังสินค้า | Warehouse, RFID |
| **Driver** | พนักงานขับรถ | TMS (จำกัดสิทธิ์) |
| **Production Manager** | ผู้จัดการฝ่ายผลิต | Production |
| **Finance Staff** | พนักงานการเงิน | Finance, Collections |

### 1.4 คำจำกัดความ (Definitions)

| คำย่อ | ความหมาย |
|-------|----------|
| BC | Microsoft Dynamics 365 Business Central |
| BCI | BCI Asia (ข้อมูลโครงการก่อสร้าง) |
| RBAC | Role-Based Access Control |
| OKR | Objectives and Key Results |
| KPI | Key Performance Indicator |
| TMS | Transport Management System |
| RFID | Radio-Frequency Identification |
| EPC | Electronic Product Code |
| ZPL | Zebra Programming Language |
| OData | Open Data Protocol |
| SSE | Server-Sent Events |
| AR | Accounts Receivable (ลูกหนี้การค้า) |
| AP | Accounts Payable (เจ้าหนี้การค้า) |
| BOM | Bill of Materials |

---

## 2. Functional Requirements (ความต้องการด้านฟังก์ชัน)

---

### 2.1 RBAC — ระบบจัดการสิทธิ์การเข้าถึง (Role-Based Access Control)

**คำอธิบาย:** ระบบควบคุมสิทธิ์การเข้าถึงแบบ Role-Based สำหรับจัดการผู้ใช้ บทบาท ทรัพยากร การกระทำ สิทธิ์ ลำดับชั้นการอนุมัติ และ Workflow การอนุมัติ

**ฟีเจอร์หลัก:**
- จัดการ Users — สร้างผู้ใช้ รีเซ็ตรหัสผ่าน กำหนดบทบาทให้ผู้ใช้
- จัดการ Roles — CRUD บทบาท รองรับ Superadmin flag
- จัดการ Resources — CRUD ทรัพยากรที่ต้องการควบคุมสิทธิ์ แบ่งตาม module
- จัดการ Actions — CRUD การกระทำ (เช่น create, read, update, delete)
- จัดการ Permissions — ผูก Resource + Action เป็น Permission
- กำหนด Role-Permission — ผูก Permission เข้ากับ Role
- กำหนด User-Role — ผูก Role เข้ากับ User (หลาย Role ต่อ User)
- Access Logs — บันทึก log การเข้าถึงทรัพยากร (granted/denied)
- Approval Hierarchy — ลำดับชั้นการอนุมัติ
- Approval Workflows — กำหนด workflow การอนุมัติ

**หน้าที่เกี่ยวข้อง:**

| Route | คำอธิบาย |
|-------|----------|
| `/rbac/users` | จัดการผู้ใช้งาน |
| `/rbac/roles` | จัดการบทบาท |
| `/rbac/resources` | จัดการทรัพยากร |
| `/rbac/actions` | จัดการ Actions |
| `/rbac/permissions` | จัดการ Permissions |
| `/rbac/accessLogs` | ดู Access Logs |
| `/rbac/approvalHierarchy` | ลำดับชั้นการอนุมัติ |
| `/rbac/approvalWorkflows` | Workflow การอนุมัติ |

---

### 2.2 HR — ระบบจัดการทรัพยากรบุคคล (Human Resources)

**คำอธิบาย:** ระบบจัดการข้อมูลพนักงาน โครงสร้างองค์กร (ฝ่าย แผนก ตำแหน่ง) พร้อม Dashboard ภาพรวม

**ฟีเจอร์หลัก:**
- Dashboard — ภาพรวมจำนวนพนักงาน สถิติตามแผนก/ฝ่าย
- Employees — CRUD พนักงาน, เชื่อมโยง (link) กับ user account ในระบบ, ดึงรายชื่อ unlinked employees/users
- Departments — CRUD แผนก, เชื่อมโยงกับ Division (ฝ่าย)
- Divisions — CRUD ฝ่าย
- Positions — CRUD ตำแหน่ง
- Soft delete — ใช้ `isActive` flag แทนการลบจริง

**หน้าที่เกี่ยวข้อง:**

| Route | คำอธิบาย |
|-------|----------|
| `/hr/dashboard` | Dashboard ภาพรวม HR |
| `/hr/employees` | จัดการพนักงาน |
| `/hr/departments` | จัดการแผนก |
| `/hr/divisions` | จัดการฝ่าย |
| `/hr/positions` | จัดการตำแหน่ง |

---

### 2.3 Performance — ระบบประเมินผลงาน (Performance Management)

**คำอธิบาย:** ระบบประเมินผลงานครบวงจร ครอบคลุม Value Evaluation, OKR, KPI, และ 360-Degree Evaluation

**ฟีเจอร์หลัก:**

#### 2.3.1 Value Evaluation (การประเมินค่านิยม)
- ประเมินผลงานพนักงานตามเกณฑ์ค่านิยมองค์กร (scores เก็บเป็น JSONB)
- คำนวณค่าเฉลี่ยรายหมวด (categoryAverages) และคะแนนรวม (overallScore)
- กำหนดเกรด (grade) อัตโนมัติ
- สรุปผลประเมิน (summary) รายงวด
- Feedback — สร้าง feedback จากผลประเมินให้พนักงาน

#### 2.3.2 OKR (Objectives and Key Results)
- Objectives — CRUD วัตถุประสงค์ แบ่งตามปี/ไตรมาส, รองรับ hierarchical (parent-child)
- Key Results — CRUD ผลลัพธ์หลักภายใต้ Objective, กำหนด metric type/target/weight
- Check-ins — บันทึกความคืบหน้า Key Result เป็นระยะ (previous → new value)
- คำนวณ progress อัตโนมัติจาก Key Results
- Visibility — กำหนดระดับการมองเห็น (team/company/private)

#### 2.3.3 KPI (Key Performance Indicators)
- Dashboard — ภาพรวม KPI ทั้งองค์กร
- Definitions — CRUD ตัวชี้วัด กำหนดหมวดหมู่ หน่วย ความถี่ เป้าหมาย threshold
- Assignments — มอบหมาย KPI ให้พนักงาน กำหนดเป้าหมายและน้ำหนัก
- Records — บันทึกค่า actual ของ KPI รายงวด

#### 2.3.4 360-Degree Evaluation (การประเมินแบบ 360 องศา)
- Cycles — CRUD รอบการประเมิน กำหนดปี/ไตรมาส, deadline, anonymous flag
- Competencies — กำหนด competency ต่อรอบ พร้อม questions (JSONB) และ weight
- Nominations — กำหนดผู้ประเมิน-ผู้ถูกประเมิน กำหนด relationship type
- Responses — บันทึกผลประเมิน (scores, competencyAverages, comments)
- Results — ดูผลลัพธ์รวมของการประเมิน
- Cycle Transition — เปลี่ยนสถานะรอบประเมิน

**หน้าที่เกี่ยวข้อง:**

| Route | คำอธิบาย |
|-------|----------|
| `/performance/evaluation` | Value Evaluation |
| `/performance/okr` | OKR Management |
| `/performance/kpi` | KPI Management |
| `/performance/360` | 360-Degree Evaluation |

---

### 2.4 IT — ระบบจัดการไอที (IT Management)

**คำอธิบาย:** ระบบจัดการทรัพย์สินไอที Helpdesk ซอฟต์แวร์ คำขอพัฒนาระบบ สิทธิ์เข้าถึงระบบ อุปกรณ์เครือข่าย และเหตุการณ์ด้านความปลอดภัย

**ฟีเจอร์หลัก:**
- Dashboard — ภาพรวมสถิติ IT (จำนวน assets, tickets, software)
- Assets — CRUD ทรัพย์สินไอที แบ่งหมวดหมู่ (computer, monitor, printer ฯลฯ) ติดตามสถานะ/การมอบหมาย/ประกัน
- Tickets (Helpdesk) — CRUD ticket, กำหนด priority (low/medium/high/critical), status (open/in_progress/resolved/closed), หมวดหมู่, มอบหมายผู้รับผิดชอบ
- Software Licenses — CRUD ข้อมูลซอฟต์แวร์/ลิขสิทธิ์ ติดตามวันหมดอายุ
- Dev Requests — CRUD คำขอพัฒนาระบบ, ติดตามความคืบหน้า (progress %) พร้อม progress log
- System Access — CRUD คำขอสิทธิ์เข้าถึงระบบ (pending/approved/rejected)
- Network Devices — CRUD อุปกรณ์เครือข่าย (IP, location, type, status)
- Security Incidents — CRUD เหตุการณ์ด้านความปลอดภัย (severity, status)

**หน้าที่เกี่ยวข้อง:**

| Route | คำอธิบาย |
|-------|----------|
| `/it/dashboard` | Dashboard ภาพรวม IT |
| `/it/assets` | จัดการทรัพย์สินไอที |
| `/it/tickets` | Helpdesk Tickets |
| `/it/software` | จัดการซอฟต์แวร์/ลิขสิทธิ์ |
| `/it/devRequests` | คำขอพัฒนาระบบ |
| `/it/systemAccess` | คำขอสิทธิ์เข้าถึง |
| `/it/network` | อุปกรณ์เครือข่าย |
| `/it/security` | เหตุการณ์ด้านความปลอดภัย |

---

### 2.5 Finance — ระบบการเงิน (Finance)

**คำอธิบาย:** ระบบการเงินที่ดึงข้อมูลจาก Business Central ครอบคลุม Trial Balance, งบการเงิน, ลูกหนี้/เจ้าหนี้ ใบแจ้งหนี้ และระบบติดตามลูกหนี้

**ฟีเจอร์หลัก:**
- Dashboard — ภาพรวมการเงิน สรุปยอด
- Trial Balance — ข้อมูลงบทดลองจาก BC
- Balance Sheet — งบดุลจาก BC
- Income Statement — งบกำไรขาดทุนจาก BC
- Aged Receivables — รายงานอายุลูกหนี้จาก BC
- Aged Payables — รายงานอายุเจ้าหนี้จาก BC
- Sales Invoices — ใบแจ้งหนี้ขายจาก BC
- Purchase Invoices — ใบแจ้งหนี้ซื้อจาก BC
- Collections (AR Follow-up) — ระบบติดตามลูกหนี้ บันทึกการติดต่อ วิธีติดต่อ เหตุผล สัญญาชำระ นัดติดตามครั้งถัดไป
- AI Analysis — วิเคราะห์ข้อมูลการเงินด้วย AI

**หน้าที่เกี่ยวข้อง:**

| Route | คำอธิบาย |
|-------|----------|
| `/finance/dashboard` | Dashboard การเงิน |
| `/finance/trialBalance` | งบทดลอง |
| `/finance/agedReceivables` | รายงานอายุลูกหนี้ |
| `/finance/agedPayables` | รายงานอายุเจ้าหนี้ |
| `/finance/salesInvoices` | ใบแจ้งหนี้ขาย |
| `/finance/purchaseInvoices` | ใบแจ้งหนี้ซื้อ |
| `/finance/collections` | ติดตามลูกหนี้ |

---

### 2.6 Sales/CRM — ระบบการขายและลูกค้าสัมพันธ์

**คำอธิบาย:** ระบบ CRM ครบวงจร ตั้งแต่ Lead → Contact + Opportunity → Quotation → Order พร้อม Pipeline management และ BCI Projects

**ฟีเจอร์หลัก:**
- Dashboard — ภาพรวมการขาย pipeline funnel สถิติ
- Leads — CRUD leads, กำหนด source/score/status, convert lead เป็น Contact + Opportunity
- Contacts — CRUD ผู้ติดต่อ เชื่อมโยงกับ Account
- Accounts — CRUD บัญชีลูกค้า (บริษัท)
- Opportunities — CRUD โอกาสการขาย, pipeline stages (prospecting → qualification → proposal → negotiation → closed_won/closed_lost), กำหนดมูลค่า/ความน่าจะเป็น
- Quotations — CRUD ใบเสนอราคา + Quotation Lines, ระบบ approval (draft → pending → approved/rejected), หมายเลขอัตโนมัติ
- Orders — สร้าง Order จาก Quotation ที่ approved, ติดตามสถานะ
- Activities — CRUD กิจกรรมการขาย (call, meeting, email ฯลฯ) เชื่อมกับ Contact/Opportunity/Account
- Reports — รายงานการขาย
- BCI Projects — นำเข้าและดูข้อมูลโครงการก่อสร้างจาก BCI Asia

**หน้าที่เกี่ยวข้อง:**

| Route | คำอธิบาย |
|-------|----------|
| `/sales/dashboard` | Dashboard การขาย |
| `/sales/leads` | จัดการ Leads |
| `/sales/contacts` | จัดการผู้ติดต่อ |
| `/sales/accounts` | จัดการ Accounts |
| `/sales/opportunities` | จัดการ Opportunities |
| `/sales/quotations` | จัดการใบเสนอราคา |
| `/sales/quotations/[id]` | รายละเอียดใบเสนอราคา |
| `/sales/orders` | จัดการคำสั่งซื้อ |
| `/sales/activities` | จัดการกิจกรรมการขาย |
| `/sales/reports` | รายงาน |
| `/sales/bci-projects` | โครงการ BCI |

---

### 2.7 Marketing — ระบบการตลาด (Marketing & Omnichannel)

**คำอธิบาย:** ระบบการตลาดพร้อม Omnichannel Chat (LINE + Facebook) แบบ real-time, AI Auto-Reply, AI Suggestions, ใบเสนอราคาจากแชท, รายการราคาสินค้า, และคำสั่งซื้อจาก BC

**ฟีเจอร์หลัก:**
- Analytics — วิเคราะห์ข้อมูลการตลาด
- Omnichannel Chat — รับ-ส่งข้อความ LINE และ Facebook ผ่านระบบเดียว, real-time ด้วย Supabase Realtime
- Webhook — รับข้อความจาก LINE/Facebook webhooks, HMAC verification
- AI Auto-Reply — ตอบข้อความอัตโนมัติด้วย AI (OpenRouter), เปิด/ปิดต่อ conversation
- AI Suggestions — AI แนะนำข้อความตอบกลับสำหรับพนักงาน
- AI Settings — ตั้งค่า system prompt, model, temperature, bank account info
- Quotations (จากแชท) — สร้างใบเสนอราคาจาก conversation, CRUD, approval workflow
- Stock Items (Price List) — รายการราคาสินค้าสำหรับอ้างอิง
- Sales Orders — ดูคำสั่งซื้อจาก BC (read-only)
- Shipping Labels — พิมพ์ใบปะหน้าพัสดุ
- OCR — อ่านข้อมูลจากรูปภาพ (slip) ที่ลูกค้าส่ง

**หน้าที่เกี่ยวข้อง:**

| Route | คำอธิบาย |
|-------|----------|
| `/marketing/analytics` | Analytics |
| `/marketing/omnichannel` | Omnichannel Chat |
| `/marketing/omnichannel/quotations` | ใบเสนอราคาจากแชท |
| `/marketing/omnichannel/quotations/[id]` | รายละเอียดใบเสนอราคา |
| `/marketing/omnichannel/stockItems` | รายการราคาสินค้า |
| `/marketing/salesOrders` | คำสั่งซื้อ BC |
| `/marketing/salesOrders/[no]` | รายละเอียดคำสั่งซื้อ |
| `/marketing/shippingLabel/[no]` | พิมพ์ใบปะหน้าพัสดุ |

---

### 2.8 Production — ระบบการผลิต (Production)

**คำอธิบาย:** ระบบจัดการการผลิตที่ดึงข้อมูลจาก Business Central ครอบคลุม Production Orders, BOM Calculator, และ Item Ledger Entries

**ฟีเจอร์หลัก:**
- Dashboard — ภาพรวมการผลิต สถิติ production orders, cores, frames
- Production Orders — ดูรายการคำสั่งผลิตจาก BC (status, quantity, dimension, due date)
- BOM Calculator — คำนวณ Bill of Materials
- Item Ledger Entries — ดูรายการ Consumption/Output จาก BC (entry type, quantity, cost, lot, serial)
- Cores — ข้อมูล production cores
- Frames — ข้อมูล production frames

**หน้าที่เกี่ยวข้อง:**

| Route | คำอธิบาย |
|-------|----------|
| `/production/dashboard` | Dashboard การผลิต |
| `/production/orders` | คำสั่งผลิต |
| `/production/bom` | BOM Calculator |
| `/production/entries` | Item Ledger Entries |

---

### 2.9 TMS — ระบบจัดการขนส่ง (Transport Management System)

**คำอธิบาย:** ระบบจัดการขนส่งครบวงจร ครอบคลุมยานพาหนะ พนักงานขับรถ การจัดส่ง เส้นทาง น้ำมัน ซ่อมบำรุง GPS tracking และการแจ้งเตือน

**ฟีเจอร์หลัก:**
- Dashboard — ภาพรวมขนส่ง สถานะยานพาหนะ shipment ที่ active
- Vehicles — CRUD ยานพาหนะ ข้อมูลทะเบียน ประกันภัย พ.ร.บ. ความจุ เลขไมล์ สถานะ (available/in_use/maintenance)
- Drivers — CRUD พนักงานขับรถ ข้อมูลใบขับขี่ ประเภท วันหมดอายุ บทบาท (driver/assistant)
- Shipments — CRUD การจัดส่ง เชื่อมกับ vehicle/driver/route, **Status workflow:** `pending` → `dispatched` → `in_transit` → `delivered`, บันทึก timestamp ทุกขั้นตอน
- Deliveries — จัดการการจัดส่ง เชื่อมกับ shipment
- Routes — CRUD เส้นทาง (ต้นทาง-ปลายทาง ระยะทาง เวลาประมาณ)
- Fuel Logs — CRUD บันทึกเติมน้ำมัน (ปริมาณ ราคา สถานี เลขไมล์)
- Maintenance — CRUD ซ่อมบำรุง (ประเภท ค่าใช้จ่าย ร้าน นัดครั้งถัดไป)
- GPS Tracking — บันทึกและดูตำแหน่งยานพาหนะ real-time (lat/lon/speed)
- Reports — รายงานขนส่ง
- Alerts — การแจ้งเตือน (ใบขับขี่/ประกัน/ทะเบียนใกล้หมดอายุ, maintenance due)

**หน้าที่เกี่ยวข้อง:**

| Route | คำอธิบาย |
|-------|----------|
| `/tms/dashboard` | Dashboard ขนส่ง |
| `/tms/vehicles` | จัดการยานพาหนะ |
| `/tms/drivers` | จัดการพนักงานขับรถ |
| `/tms/shipments` | จัดการ Shipments |
| `/tms/deliveries` | จัดการ Deliveries |
| `/tms/routes` | จัดการเส้นทาง |
| `/tms/fuelLogs` | บันทึกเติมน้ำมัน |
| `/tms/maintenance` | ซ่อมบำรุง |
| `/tms/tracking` | GPS Tracking |
| `/tms/reports` | รายงาน |
| `/tms/alerts` | การแจ้งเตือน |

---

### 2.10 Warehouse — ระบบคลังสินค้า (Warehouse & RFID)

**คำอธิบาย:** ระบบจัดการคลังสินค้าด้วย RFID ครอบคลุมสินค้าคงคลัง การพิมพ์แท็ก RFID (Chainway CP30) การสแกน (Chainway C72) การโอนย้าย และการจับคู่คำสั่งซื้อ

**ฟีเจอร์หลัก:**
- Dashboard — ภาพรวมคลังสินค้า
- Inventory — ดูสินค้าคงคลัง จัดกลุ่มตาม project
- Inventory Detail — ดูรายละเอียดสินค้าแต่ละกลุ่ม
- RFID Print — พิมพ์แท็ก RFID ผ่าน Chainway CP30 (TCP/IP socket, ZPL, Thermal Transfer), รองรับข้อความภาษาไทย (bitmap via `node-canvas` → `^GFA`), toggle เข้ารหัส RFID EPC
- RFID Decode — ถอดรหัส EPC จากแท็ก RFID
- RFID Code Assignment — กำหนดรหัส RFID ให้สินค้า (`bcItemRfidCode` unique constraint)
- Scan Sessions — สร้าง/จัดการ session การสแกน (GPS, tag count, total reads)
- Scan Records — บันทึกผลการสแกน (EPC, RSSI, item info, photo)
- Transfers — โอนย้ายสินค้าระหว่าง location (from/to, GPS, status)
- Orders — ดูรายการคำสั่งซื้อ
- Order Match — จับคู่สินค้าที่สแกนกับรายการในคำสั่งซื้อ
- App Version — จัดการเวอร์ชัน warehouse mobile app

**หน้าที่เกี่ยวข้อง:**

| Route | คำอธิบาย |
|-------|----------|
| `/warehouse/inventory` | สินค้าคงคลัง |
| `/warehouse/inventory/[group]` | รายละเอียดตามกลุ่ม |

> **หมายเหตุ:** Warehouse ส่วนใหญ่ใช้งานผ่าน Mobile App (Chainway C72) เชื่อมต่อผ่าน API

---

### 2.11 BC Integration — เชื่อมต่อ Business Central

**คำอธิบาย:** แสดงข้อมูล read-only ที่ sync จาก Microsoft Dynamics 365 Business Central ผ่าน OData

**ฟีเจอร์หลัก:**
- Customers — รายชื่อลูกค้าจาก BC (number, name, phone, contact, balance)
- Items — รายการสินค้าจาก BC (number, name, type, inventory, price, category, project)
- Sales Orders — รายการคำสั่งซื้อจาก BC (number, customer, date, status, amount)
- Production Orders — ข้อมูลคำสั่งผลิตจาก BC
- Item Ledger Entries — รายการ consumption/output จาก BC

**หน้าที่เกี่ยวข้อง:**

| Route | คำอธิบาย |
|-------|----------|
| `/bc/customers` | ลูกค้า BC |
| `/bc/items` | สินค้า BC |
| `/bc/salesOrders` | คำสั่งซื้อ BC |

---

### 2.12 Settings — ตั้งค่าระบบ

**คำอธิบาย:** หน้าตั้งค่าระบบสำหรับ Admin ครอบคลุมการ sync ข้อมูลจาก BC และตรวจสอบ configuration

**ฟีเจอร์หลัก:**
- BC Sync — trigger การ sync ข้อมูลจาก BC แบบ manual, แสดงความคืบหน้าแบบ real-time ด้วย SSE, รองรับ batch upsert 1000 rows ต่อ batch, safety threshold 50% (หยุด sync ถ้าข้อมูลลดลงเกินครึ่ง), `maxDuration = 300s`
- Config Check — ตรวจสอบ configuration ของระบบว่าครบถ้วน

**หน้าที่เกี่ยวข้อง:**

| Route | คำอธิบาย |
|-------|----------|
| `/settings/sync-bc` | Sync ข้อมูล BC |
| `/settings/configCheck` | ตรวจสอบ Config |

---

### 2.13 Overview — ภาพรวมระบบ

**คำอธิบาย:** หน้า Dashboard และ Analytics ภาพรวมขององค์กร

**ฟีเจอร์หลัก:**
- Dashboard — ภาพรวมข้อมูลสำคัญจากทุก module
- Analytics — วิเคราะห์ข้อมูลเชิงลึก

**หน้าที่เกี่ยวข้อง:**

| Route | คำอธิบาย |
|-------|----------|
| `/overview/dashboard` | Dashboard ภาพรวม |
| `/overview/analytics` | Analytics |

---

### 2.14 Profile — โปรไฟล์ผู้ใช้

**คำอธิบาย:** จัดการข้อมูลส่วนตัวของผู้ใช้

**ฟีเจอร์หลัก:**
- ดู/แก้ไขโปรไฟล์ (display name, avatar)
- เปลี่ยนรหัสผ่าน
- ตั้งค่า/ยืนยัน PIN

**หน้าที่เกี่ยวข้อง:**

| Route | คำอธิบาย |
|-------|----------|
| `/profile` | โปรไฟล์ผู้ใช้ |

---

## 3. Non-Functional Requirements (ความต้องการที่ไม่ใช่ฟังก์ชัน)

### 3.1 Performance (ประสิทธิภาพ)

| ข้อกำหนด | เป้าหมาย |
|----------|----------|
| API Response Time | < 2 วินาที สำหรับ API ทั่วไป |
| BC Sync Duration | < 5 นาที (`maxDuration = 300s`) |
| Batch Upsert Size | 1,000 rows ต่อ batch, concurrency 3 |
| Real-time Chat Latency | < 1 วินาที (Supabase Realtime) |
| Page Load Time | < 3 วินาที (First Contentful Paint) |
| SSE Streaming | ส่ง progress updates ทุก batch ระหว่าง sync |

### 3.2 Security (ความปลอดภัย)

| ข้อกำหนด | รายละเอียด |
|----------|------------|
| Authentication | Supabase Auth (email/password) |
| Authorization | RBAC — Role-Based Access Control, ตรวจสอบสิทธิ์ทุก API route |
| Webhook Verification | HMAC signature verification สำหรับ LINE/Facebook webhooks |
| PIN Security | bcrypt hash สำหรับ PIN code |
| Session Management | Supabase session ผ่าน cookie, auto-refresh |
| Access Logging | บันทึก access log ทุกครั้งที่เข้าถึงทรัพยากร (granted/denied) |
| Soft Delete | ใช้ `isActive` flag แทนการลบจริงเพื่อป้องกันข้อมูลสูญหาย |
| API Protection | ทุก API route ตรวจสอบ authentication ก่อนประมวลผล |

### 3.3 Availability (ความพร้อมใช้งาน)

| ข้อกำหนด | รายละเอียด |
|----------|------------|
| Hosting | Vercel (Serverless) — auto-scaling ตาม traffic |
| Database | Supabase (Managed PostgreSQL) — high availability |
| CDN | Vercel Edge Network — static assets |
| Serverless Functions | Timeout สูงสุด 300 วินาที สำหรับ long-running tasks (BC Sync) |
| Zero-downtime Deploy | Vercel atomic deployments |

### 3.4 Data Integrity (ความถูกต้องของข้อมูล)

| ข้อกำหนด | รายละเอียด |
|----------|------------|
| Soft Deletes | ทุกตารางที่มี DELETE ใช้ `isActive` boolean + partial index |
| RFID Unique Constraint | `bcItem_rfidCode_unique` — RFID code ไม่ซ้ำ (allow null) |
| Sync Safety Threshold | 50% — หยุด sync ถ้าข้อมูลใน BC ลดลงมากกว่าครึ่ง |
| Foreign Key Constraints | ทุกตารางที่มีความสัมพันธ์ใช้ FK constraint |
| UUID Primary Keys | ทุกตารางใช้ UUID v4 เป็น primary key |
| Timestamps | `createdAt`, `updatedAt` อัตโนมัติ |
| Upsert on Conflict | BC sync ใช้ upsert on conflict เพื่อป้องกัน duplicate |

### 3.5 Scalability (ความสามารถในการขยาย)

| ข้อกำหนด | รายละเอียด |
|----------|------------|
| Module Architecture | แยก module อิสระ ขยายได้ง่าย |
| API Design | RESTful, stateless, แต่ละ route เป็น serverless function |
| Database Indexing | Partial indexes บน `isActive` สำหรับทุกตาราง soft delete |
| Batch Processing | รองรับ batch upsert สำหรับข้อมูลจำนวนมาก |

---

## 4. API Endpoints Summary (สรุป API Endpoints)

### 4.1 Authentication & Profile

| Method | Path | คำอธิบาย |
|--------|------|----------|
| POST | `/api/auth/pin` | ตั้งค่า PIN |
| POST | `/api/auth/pin/verify` | ยืนยัน PIN |
| GET | `/api/profile` | ดูโปรไฟล์ |
| PUT | `/api/profile` | แก้ไขโปรไฟล์ |
| POST | `/api/profile/changePassword` | เปลี่ยนรหัสผ่าน |

### 4.2 Admin

| Method | Path | คำอธิบาย |
|--------|------|----------|
| POST | `/api/admin/createUser` | สร้างผู้ใช้ใหม่ |
| POST | `/api/admin/resetPassword` | รีเซ็ตรหัสผ่าน |

### 4.3 RBAC

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/rbac/roles` | ดูรายการ Roles |
| POST | `/api/rbac/roles` | สร้าง Role |
| GET | `/api/rbac/roles/[id]` | ดูรายละเอียด Role |
| PUT | `/api/rbac/roles/[id]` | แก้ไข Role |
| DELETE | `/api/rbac/roles/[id]` | ลบ Role (soft delete) |
| GET | `/api/rbac/resources` | ดูรายการ Resources |
| POST | `/api/rbac/resources` | สร้าง Resource |
| GET | `/api/rbac/resources/[id]` | ดูรายละเอียด Resource |
| PUT | `/api/rbac/resources/[id]` | แก้ไข Resource |
| DELETE | `/api/rbac/resources/[id]` | ลบ Resource (soft delete) |
| GET | `/api/rbac/actions` | ดูรายการ Actions |
| POST | `/api/rbac/actions` | สร้าง Action |
| GET | `/api/rbac/actions/[id]` | ดูรายละเอียด Action |
| PUT | `/api/rbac/actions/[id]` | แก้ไข Action |
| DELETE | `/api/rbac/actions/[id]` | ลบ Action (soft delete) |
| GET | `/api/rbac/permissions` | ดูรายการ Permissions |
| POST | `/api/rbac/permissions` | สร้าง Permission |
| GET | `/api/rbac/permissions/[id]` | ดูรายละเอียด Permission |
| PUT | `/api/rbac/permissions/[id]` | แก้ไข Permission |
| DELETE | `/api/rbac/permissions/[id]` | ลบ Permission (soft delete) |
| GET | `/api/rbac/rolePermissions/[roleId]` | ดู Permissions ของ Role |
| PUT | `/api/rbac/rolePermissions/[roleId]` | อัปเดต Permissions ของ Role |
| GET | `/api/rbac/userRoles` | ดูรายการ User-Roles |
| POST | `/api/rbac/userRoles` | กำหนด Role ให้ User |
| GET | `/api/rbac/userRoles/[userId]` | ดู Roles ของ User |
| PUT | `/api/rbac/userRoles/[userId]` | อัปเดต Roles ของ User |
| GET | `/api/rbac/userPermissions/[userId]` | ดู Permissions ทั้งหมดของ User |

### 4.4 HR

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/hr/employees` | ดูรายการพนักงาน |
| POST | `/api/hr/employees` | สร้างพนักงาน |
| GET | `/api/hr/employees/[id]` | ดูรายละเอียดพนักงาน |
| PUT | `/api/hr/employees/[id]` | แก้ไขพนักงาน |
| DELETE | `/api/hr/employees/[id]` | ลบพนักงาน (soft delete) |
| GET | `/api/hr/departments` | ดูรายการแผนก |
| POST | `/api/hr/departments` | สร้างแผนก |
| GET | `/api/hr/departments/[id]` | ดูรายละเอียดแผนก |
| PUT | `/api/hr/departments/[id]` | แก้ไขแผนก |
| DELETE | `/api/hr/departments/[id]` | ลบแผนก (soft delete) |
| GET | `/api/hr/divisions` | ดูรายการฝ่าย |
| POST | `/api/hr/divisions` | สร้างฝ่าย |
| GET | `/api/hr/divisions/[id]` | ดูรายละเอียดฝ่าย |
| PUT | `/api/hr/divisions/[id]` | แก้ไขฝ่าย |
| DELETE | `/api/hr/divisions/[id]` | ลบฝ่าย (soft delete) |
| GET | `/api/hr/positions` | ดูรายการตำแหน่ง |
| POST | `/api/hr/positions` | สร้างตำแหน่ง |
| GET | `/api/hr/positions/[id]` | ดูรายละเอียดตำแหน่ง |
| PUT | `/api/hr/positions/[id]` | แก้ไขตำแหน่ง |
| DELETE | `/api/hr/positions/[id]` | ลบตำแหน่ง (soft delete) |
| GET | `/api/hr/unlinkedEmployees` | พนักงานที่ยังไม่ link กับ user |
| GET | `/api/hr/unlinkedUsers` | Users ที่ยังไม่ link กับพนักงาน |

### 4.5 Performance

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/performance/evaluation` | ดูรายการประเมิน Value |
| POST | `/api/performance/evaluation` | สร้างการประเมิน |
| GET | `/api/performance/evaluation/summary` | สรุปผลประเมินรายงวด |
| GET | `/api/performance/evaluation/feedback` | ดู feedback |
| POST | `/api/performance/evaluation/feedback` | สร้าง feedback |
| GET | `/api/performance/okr` | ดูรายการ OKR Objectives |
| POST | `/api/performance/okr` | สร้าง Objective |
| GET | `/api/performance/okr/[id]` | ดูรายละเอียด Objective |
| PUT | `/api/performance/okr/[id]` | แก้ไข Objective |
| DELETE | `/api/performance/okr/[id]` | ลบ Objective (soft delete) |
| GET | `/api/performance/okr/key-results` | ดูรายการ Key Results |
| POST | `/api/performance/okr/key-results` | สร้าง Key Result |
| GET | `/api/performance/okr/key-results/[id]` | ดูรายละเอียด Key Result |
| PUT | `/api/performance/okr/key-results/[id]` | แก้ไข Key Result |
| DELETE | `/api/performance/okr/key-results/[id]` | ลบ Key Result (soft delete) |
| GET | `/api/performance/okr/checkins` | ดูรายการ Check-ins |
| POST | `/api/performance/okr/checkins` | สร้าง Check-in |
| GET | `/api/performance/kpi/dashboard` | KPI Dashboard |
| GET | `/api/performance/kpi/definitions` | ดูรายการ KPI Definitions |
| POST | `/api/performance/kpi/definitions` | สร้าง KPI Definition |
| GET | `/api/performance/kpi/definitions/[id]` | ดูรายละเอียด |
| PUT | `/api/performance/kpi/definitions/[id]` | แก้ไข |
| DELETE | `/api/performance/kpi/definitions/[id]` | ลบ (soft delete) |
| GET | `/api/performance/kpi/assignments` | ดูรายการ KPI Assignments |
| POST | `/api/performance/kpi/assignments` | สร้าง Assignment |
| GET | `/api/performance/kpi/assignments/[id]` | ดูรายละเอียด |
| PUT | `/api/performance/kpi/assignments/[id]` | แก้ไข |
| DELETE | `/api/performance/kpi/assignments/[id]` | ลบ (soft delete) |
| GET | `/api/performance/kpi/records` | ดูรายการ KPI Records |
| POST | `/api/performance/kpi/records` | บันทึก KPI Record |
| GET | `/api/performance/360/cycles` | ดูรายการ 360 Cycles |
| POST | `/api/performance/360/cycles` | สร้าง Cycle |
| GET | `/api/performance/360/cycles/[id]` | ดูรายละเอียด Cycle |
| PUT | `/api/performance/360/cycles/[id]` | แก้ไข Cycle |
| DELETE | `/api/performance/360/cycles/[id]` | ลบ Cycle (soft delete) |
| POST | `/api/performance/360/cycles/[id]/transition` | เปลี่ยนสถานะ Cycle |
| GET | `/api/performance/360/competencies` | ดูรายการ Competencies |
| POST | `/api/performance/360/competencies` | สร้าง Competency |
| GET | `/api/performance/360/nominations` | ดูรายการ Nominations |
| POST | `/api/performance/360/nominations` | สร้าง Nomination |
| GET | `/api/performance/360/responses` | ดูรายการ Responses |
| POST | `/api/performance/360/responses` | บันทึก Response |
| GET | `/api/performance/360/results` | ดูผลลัพธ์ |

### 4.6 IT

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/it/dashboard` | IT Dashboard |
| GET | `/api/it/assets` | ดูรายการ Assets |
| POST | `/api/it/assets` | สร้าง Asset |
| GET | `/api/it/assets/[id]` | ดูรายละเอียด |
| PUT | `/api/it/assets/[id]` | แก้ไข Asset |
| DELETE | `/api/it/assets/[id]` | ลบ (soft delete) |
| GET | `/api/it/tickets` | ดูรายการ Tickets |
| POST | `/api/it/tickets` | สร้าง Ticket |
| GET | `/api/it/tickets/[id]` | ดูรายละเอียด |
| PUT | `/api/it/tickets/[id]` | แก้ไข Ticket |
| DELETE | `/api/it/tickets/[id]` | ลบ (soft delete) |
| GET | `/api/it/software` | ดูรายการ Software |
| POST | `/api/it/software` | สร้าง Software |
| GET | `/api/it/software/[id]` | ดูรายละเอียด |
| PUT | `/api/it/software/[id]` | แก้ไข |
| DELETE | `/api/it/software/[id]` | ลบ (soft delete) |
| GET | `/api/it/devRequests` | ดูรายการ Dev Requests |
| POST | `/api/it/devRequests` | สร้าง Dev Request |
| GET | `/api/it/devRequests/[id]` | ดูรายละเอียด |
| PUT | `/api/it/devRequests/[id]` | แก้ไข |
| DELETE | `/api/it/devRequests/[id]` | ลบ (soft delete) |
| POST | `/api/it/devRequests/[id]/progress` | เพิ่ม Progress Log |
| GET | `/api/it/systemAccess` | ดูรายการ System Access |
| POST | `/api/it/systemAccess` | สร้างคำขอ |
| GET | `/api/it/systemAccess/[id]` | ดูรายละเอียด |
| PUT | `/api/it/systemAccess/[id]` | แก้ไข |
| DELETE | `/api/it/systemAccess/[id]` | ลบ (soft delete) |
| GET | `/api/it/network` | ดูรายการ Network Devices |
| POST | `/api/it/network` | สร้าง Device |
| GET | `/api/it/network/[id]` | ดูรายละเอียด |
| PUT | `/api/it/network/[id]` | แก้ไข |
| DELETE | `/api/it/network/[id]` | ลบ (soft delete) |
| GET | `/api/it/security` | ดูรายการ Security Incidents |
| POST | `/api/it/security` | สร้าง Incident |
| GET | `/api/it/security/[id]` | ดูรายละเอียด |
| PUT | `/api/it/security/[id]` | แก้ไข |
| DELETE | `/api/it/security/[id]` | ลบ (soft delete) |

### 4.7 Finance

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/finance/trialBalance` | ดู Trial Balance |
| GET | `/api/finance/balanceSheet` | ดู Balance Sheet |
| GET | `/api/finance/incomeStatement` | ดู Income Statement |
| GET | `/api/finance/agedReceivables` | ดู Aged Receivables |
| GET | `/api/finance/agedPayables` | ดู Aged Payables |
| GET | `/api/finance/salesInvoices` | ดูใบแจ้งหนี้ขาย |
| GET | `/api/finance/purchaseInvoices` | ดูใบแจ้งหนี้ซื้อ |
| GET | `/api/finance/collections` | ดู Collections |
| POST | `/api/finance/collections` | สร้าง Collection Record |
| POST | `/api/finance/aiAnalysis` | วิเคราะห์ด้วย AI |

### 4.8 Sales/CRM

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/sales/dashboard` | Sales Dashboard |
| GET | `/api/sales/leads` | ดูรายการ Leads |
| POST | `/api/sales/leads` | สร้าง Lead |
| GET | `/api/sales/leads/[id]` | ดูรายละเอียด Lead |
| PUT | `/api/sales/leads/[id]` | แก้ไข Lead (รวม convert) |
| DELETE | `/api/sales/leads/[id]` | ลบ Lead (soft delete) |
| GET | `/api/sales/contacts` | ดูรายการ Contacts |
| POST | `/api/sales/contacts` | สร้าง Contact |
| GET | `/api/sales/contacts/[id]` | ดูรายละเอียด Contact |
| PUT | `/api/sales/contacts/[id]` | แก้ไข Contact |
| DELETE | `/api/sales/contacts/[id]` | ลบ (soft delete) |
| GET | `/api/sales/accounts` | ดูรายการ Accounts |
| POST | `/api/sales/accounts` | สร้าง Account |
| GET | `/api/sales/accounts/[id]` | ดูรายละเอียด Account |
| PUT | `/api/sales/accounts/[id]` | แก้ไข Account |
| DELETE | `/api/sales/accounts/[id]` | ลบ (soft delete) |
| GET | `/api/sales/opportunities` | ดูรายการ Opportunities |
| POST | `/api/sales/opportunities` | สร้าง Opportunity |
| GET | `/api/sales/opportunities/[id]` | ดูรายละเอียด |
| PUT | `/api/sales/opportunities/[id]` | แก้ไข |
| DELETE | `/api/sales/opportunities/[id]` | ลบ (soft delete) |
| GET | `/api/sales/quotations` | ดูรายการ Quotations |
| POST | `/api/sales/quotations` | สร้าง Quotation |
| GET | `/api/sales/quotations/[id]` | ดูรายละเอียด + lines |
| PUT | `/api/sales/quotations/[id]` | แก้ไข/approve/reject |
| DELETE | `/api/sales/quotations/[id]` | ลบ (soft delete) |
| GET | `/api/sales/orders` | ดูรายการ Orders |
| POST | `/api/sales/orders` | สร้าง Order (จาก Quotation) |
| GET | `/api/sales/orders/[id]` | ดูรายละเอียด Order |
| PUT | `/api/sales/orders/[id]` | แก้ไข Order |
| DELETE | `/api/sales/orders/[id]` | ลบ (soft delete) |
| GET | `/api/sales/activities` | ดูรายการ Activities |
| POST | `/api/sales/activities` | สร้าง Activity |

### 4.9 Marketing

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/marketing/analytics` | Marketing Analytics |
| GET | `/api/marketing/omnichannel/conversations` | ดูรายการ Conversations |
| POST | `/api/marketing/omnichannel/conversations` | สร้าง Conversation |
| GET | `/api/marketing/omnichannel/conversations/[id]` | ดูรายละเอียด |
| PUT | `/api/marketing/omnichannel/conversations/[id]` | อัปเดต (assign, status, AI toggle) |
| GET | `/api/marketing/omnichannel/conversations/[id]/messages` | ดูข้อความ |
| POST | `/api/marketing/omnichannel/conversations/[id]/messages` | ส่งข้อความ |
| POST | `/api/marketing/omnichannel/send` | ส่งข้อความผ่าน channel |
| GET/POST | `/api/marketing/omnichannel/webhooks/line` | LINE Webhook |
| GET/POST | `/api/marketing/omnichannel/webhooks/facebook` | Facebook Webhook |
| POST | `/api/marketing/omnichannel/ai/reply` | AI Auto-Reply |
| POST | `/api/marketing/omnichannel/ai/suggest` | AI Suggestion |
| GET | `/api/marketing/omnichannel/ai/settings` | ดูตั้งค่า AI |
| PUT | `/api/marketing/omnichannel/ai/settings` | แก้ไขตั้งค่า AI |
| GET | `/api/marketing/omnichannel/quotations` | ดูรายการใบเสนอราคา |
| POST | `/api/marketing/omnichannel/quotations` | สร้างใบเสนอราคา |
| GET | `/api/marketing/omnichannel/quotations/[id]` | ดูรายละเอียด |
| PUT | `/api/marketing/omnichannel/quotations/[id]` | แก้ไข/approve |
| POST | `/api/marketing/omnichannel/quotations/createFromChat` | สร้างจากแชท |
| POST | `/api/marketing/shippingLabel/print` | พิมพ์ใบปะหน้าพัสดุ |

### 4.10 Production

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/production/dashboard` | Production Dashboard |
| GET | `/api/production/cores` | ดูข้อมูล Cores |
| GET | `/api/production/frames` | ดูข้อมูล Frames |
| GET | `/api/bc/productionOrders` | ดู Production Orders (BC) |
| GET | `/api/bc/production` | ดูข้อมูลผลิต (BC) |

### 4.11 TMS

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/tms/dashboard` | TMS Dashboard |
| GET | `/api/tms/vehicles` | ดูรายการยานพาหนะ |
| POST | `/api/tms/vehicles` | สร้างยานพาหนะ |
| GET | `/api/tms/vehicles/[id]` | ดูรายละเอียด |
| PUT | `/api/tms/vehicles/[id]` | แก้ไข |
| DELETE | `/api/tms/vehicles/[id]` | ลบ (soft delete) |
| GET | `/api/tms/drivers` | ดูรายการพนักงานขับรถ |
| POST | `/api/tms/drivers` | สร้าง |
| GET | `/api/tms/drivers/[id]` | ดูรายละเอียด |
| PUT | `/api/tms/drivers/[id]` | แก้ไข |
| DELETE | `/api/tms/drivers/[id]` | ลบ (soft delete) |
| GET | `/api/tms/shipments` | ดูรายการ Shipments |
| POST | `/api/tms/shipments` | สร้าง Shipment |
| GET | `/api/tms/shipments/[id]` | ดูรายละเอียด |
| PUT | `/api/tms/shipments/[id]` | แก้ไข |
| DELETE | `/api/tms/shipments/[id]` | ลบ (soft delete) |
| PUT | `/api/tms/shipments/[id]/status` | เปลี่ยนสถานะ Shipment |
| GET | `/api/tms/deliveries` | ดูรายการ Deliveries |
| POST | `/api/tms/deliveries` | สร้าง Delivery |
| GET | `/api/tms/deliveries/[id]` | ดูรายละเอียด |
| PUT | `/api/tms/deliveries/[id]` | แก้ไข |
| DELETE | `/api/tms/deliveries/[id]` | ลบ (soft delete) |
| GET | `/api/tms/routes` | ดูรายการเส้นทาง |
| POST | `/api/tms/routes` | สร้างเส้นทาง |
| GET | `/api/tms/routes/[id]` | ดูรายละเอียด |
| PUT | `/api/tms/routes/[id]` | แก้ไข |
| DELETE | `/api/tms/routes/[id]` | ลบ (soft delete) |
| GET | `/api/tms/fuelLogs` | ดูรายการเติมน้ำมัน |
| POST | `/api/tms/fuelLogs` | สร้าง |
| GET | `/api/tms/fuelLogs/[id]` | ดูรายละเอียด |
| PUT | `/api/tms/fuelLogs/[id]` | แก้ไข |
| DELETE | `/api/tms/fuelLogs/[id]` | ลบ (soft delete) |
| GET | `/api/tms/maintenance` | ดูรายการซ่อมบำรุง |
| POST | `/api/tms/maintenance` | สร้าง |
| GET | `/api/tms/maintenance/[id]` | ดูรายละเอียด |
| PUT | `/api/tms/maintenance/[id]` | แก้ไข |
| DELETE | `/api/tms/maintenance/[id]` | ลบ (soft delete) |
| GET | `/api/tms/gpsLogs` | ดู GPS Logs |
| POST | `/api/tms/gpsLogs` | บันทึก GPS Log |
| GET | `/api/tms/gpsLogs/latest` | ดูตำแหน่งล่าสุด |
| GET | `/api/tms/reports` | รายงาน TMS |
| GET | `/api/tms/alerts` | การแจ้งเตือน |

### 4.12 Warehouse

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/warehouse/dashboard` | Warehouse Dashboard |
| GET | `/api/warehouse/inventory` | ดูสินค้าคงคลัง |
| POST | `/api/warehouse/print` | พิมพ์แท็ก RFID |
| POST | `/api/warehouse/rfid/decode` | ถอดรหัส EPC |
| GET | `/api/warehouse/sessions` | ดูรายการ Scan Sessions |
| POST | `/api/warehouse/sessions` | สร้าง Session |
| GET | `/api/warehouse/sessions/[id]` | ดูรายละเอียด Session |
| PUT | `/api/warehouse/sessions/[id]` | แก้ไข/ปิด Session |
| GET | `/api/warehouse/sessions/[id]/records` | ดู Scan Records |
| POST | `/api/warehouse/sessions/[id]/records` | เพิ่ม Scan Record |
| GET | `/api/warehouse/transfers` | ดูรายการ Transfers |
| POST | `/api/warehouse/transfers` | สร้าง Transfer |
| GET | `/api/warehouse/transfers/[id]` | ดูรายละเอียด |
| PUT | `/api/warehouse/transfers/[id]` | แก้ไข/complete Transfer |
| GET | `/api/warehouse/orders` | ดูรายการ Orders |
| POST | `/api/warehouse/orders/[no]/match` | จับคู่สินค้ากับ Order |
| GET | `/api/warehouse/app-version` | ดูเวอร์ชัน App |

### 4.13 BC Integration

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/bc/customers` | ดูลูกค้า BC |
| GET | `/api/bc/items` | ดูสินค้า BC |
| GET | `/api/bc/salesOrders` | ดูคำสั่งซื้อ BC |
| GET | `/api/bc/productionOrders` | ดู Production Orders BC |
| GET | `/api/bc/production` | ดูข้อมูลผลิต BC |

### 4.14 BCI Projects

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/bci/projects` | ดูรายการ BCI Projects |
| POST | `/api/bci/import` | นำเข้าข้อมูล BCI |

### 4.15 Settings & System

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/sync/bc` | Trigger BC Sync (SSE stream) |
| GET | `/api/configCheck` | ตรวจสอบ Configuration |
| POST | `/api/chat` | AI Chat (general) |

---

## 5. Database Tables Summary (สรุปตาราง Database)

### 5.1 BC Integration Tables (ข้อมูลจาก Business Central)

| ตาราง | คำอธิบาย | Key Fields |
|-------|----------|------------|
| `bcCustomer` | ลูกค้าจาก BC | bcCustomerExternalId (unique), bcCustomerNumber, bcCustomerDisplayName, bcCustomerBalanceDue, bcCustomerSalespersonCode |
| `bcItem` | สินค้าจาก BC | bcItemExternalId (unique), bcItemNumber, bcItemDisplayName, bcItemInventory, bcItemUnitPrice, bcItemCategoryCode, bcItemProjectCode, bcItemRfidCode (unique) |
| `bcItemLedgerEntry` | รายการ Consumption/Output | bcItemLedgerEntryExternalNo (unique), bcItemLedgerEntryEntryType, bcItemLedgerEntryDocumentNo, bcItemLedgerEntryItemNo, bcItemLedgerEntryQuantity |
| `bcProductionOrder` | คำสั่งผลิต BC | bcProductionOrderExternalId (unique), bcProductionOrderStatus, bcProductionOrderSourceNo, bcProductionOrderQuantity, bcProductionOrderDueDate |
| `bcSalesOrder` | คำสั่งซื้อ BC | bcSalesOrderExternalId (unique), bcSalesOrderNumber, bcSalesOrderCustomerNumber, bcSalesOrderStatus, bcSalesOrderTotalAmountIncVat |
| `bcSalesOrderLine` | รายการในคำสั่งซื้อ | bcSalesOrderLineExternalId (unique), bcSalesOrderLineDocumentNo, bcSalesOrderLineDescription, bcSalesOrderLineQuantity, bcSalesOrderLineAmount |
| `bciProject` | โครงการ BCI Asia | bciProjectExternalId (unique), bciProjectName, bciProjectType, bciProjectStage, bciProjectValue, bciProjectOwnerCompany |

### 5.2 RBAC Tables (สิทธิ์การเข้าถึง)

| ตาราง | คำอธิบาย | Key Fields |
|-------|----------|------------|
| `rbacUserProfile` | โปรไฟล์ผู้ใช้ | rbacUserProfileId (PK = auth.users.id), rbacUserProfileEmail, rbacUserProfileDisplayName, rbacUserProfileAvatarUrl |
| `rbacRole` | บทบาท | rbacRoleId, rbacRoleName, rbacRoleDescription, rbacRoleIsSuperadmin, isActive |
| `rbacResource` | ทรัพยากร | rbacResourceId, rbacResourceName, rbacResourceModuleId, isActive |
| `rbacAction` | การกระทำ | rbacActionId, rbacActionName, rbacActionDescription, isActive |
| `rbacPermission` | สิทธิ์ (Resource + Action) | rbacPermissionId, rbacPermissionResourceId (FK), rbacPermissionActionId (FK), isActive |
| `rbacRolePermission` | ผูก Role-Permission | rbacRolePermissionId, rbacRolePermissionRoleId (FK), rbacRolePermissionPermissionId (FK), isActive |
| `rbacUserRole` | ผูก User-Role | rbacUserRoleId, rbacUserRoleUserId (FK), rbacUserRoleRoleId (FK), isActive |
| `rbacAccessLog` | บันทึกการเข้าถึง | rbacAccessLogId, rbacAccessLogUserId, rbacAccessLogResource, rbacAccessLogAction, rbacAccessLogGranted |

### 5.3 HR Tables (ทรัพยากรบุคคล)

| ตาราง | คำอธิบาย | Key Fields |
|-------|----------|------------|
| `hrEmployee` | พนักงาน | hrEmployeeId, hrEmployeeFirstName, hrEmployeeLastName, hrEmployeeEmail, hrEmployeeDepartment, hrEmployeePosition, hrEmployeeStatus, hrEmployeeUserId, isActive |
| `hrDepartment` | แผนก | hrDepartmentId, hrDepartmentName, hrDepartmentDivisionId (FK → hrDivision), isActive |
| `hrDivision` | ฝ่าย | hrDivisionId, hrDivisionName, hrDivisionDescription, isActive |
| `hrPosition` | ตำแหน่ง | hrPositionId, hrPositionTitle, hrPositionDepartment, isActive |

### 5.4 Performance Tables (ประเมินผลงาน)

| ตาราง | คำอธิบาย | Key Fields |
|-------|----------|------------|
| `perfEvaluation` | การประเมินค่านิยม | perfEvaluationId, perfEvaluationEvaluatorId, perfEvaluationEvaluateeEmployeeId, perfEvaluationPeriod, perfEvaluationScores (JSONB), perfEvaluationOverallScore, perfEvaluationGrade |
| `perfEvaluationFeedback` | Feedback จากผลประเมิน | perfEvaluationFeedbackId, perfEvaluationFeedbackEmployeeId, perfEvaluationFeedbackPeriod, perfEvaluationFeedbackOverallScore, perfEvaluationFeedbackGrade |
| `perfOkrObjective` | OKR Objective | perfOkrObjectiveId, perfOkrObjectiveEmployeeId, perfOkrObjectiveTitle, perfOkrObjectiveYear, perfOkrObjectiveQuarter, perfOkrObjectiveParentObjectiveId (FK, self-ref), perfOkrObjectiveProgress, isActive |
| `perfOkrKeyResult` | OKR Key Result | perfOkrKeyResultId, perfOkrKeyResultObjectiveId (FK), perfOkrKeyResultTitle, perfOkrKeyResultTargetValue, perfOkrKeyResultCurrentValue, perfOkrKeyResultWeight, isActive |
| `perfOkrCheckin` | OKR Check-in | perfOkrCheckinId, perfOkrCheckinKeyResultId (FK), perfOkrCheckinPreviousValue, perfOkrCheckinNewValue, perfOkrCheckinNote |
| `perfKpiDefinition` | KPI Definition | perfKpiDefinitionId, perfKpiDefinitionName, perfKpiDefinitionCategory, perfKpiDefinitionUnit, perfKpiDefinitionFrequency, perfKpiDefinitionTargetValue, perfKpiDefinitionIsActive, isActive |
| `perfKpiAssignment` | KPI Assignment | perfKpiAssignmentId, perfKpiAssignmentDefinitionId (FK), perfKpiAssignmentEmployeeId, perfKpiAssignmentYear, perfKpiAssignmentTargetValue, perfKpiAssignmentWeight, isActive |
| `perfKpiRecord` | KPI Record | perfKpiRecordId, perfKpiRecordAssignmentId (FK), perfKpiRecordPeriodLabel, perfKpiRecordActualValue |
| `perf360Cycle` | 360 Cycle | perf360CycleId, perf360CycleName, perf360CycleYear, perf360CycleQuarter, perf360CycleStatus, perf360CycleResponseDeadline, perf360CycleAnonymousToReviewee, isActive |
| `perf360Competency` | 360 Competency | perf360CompetencyId, perf360CompetencyCycleId (FK), perf360CompetencyName, perf360CompetencyQuestions (JSONB), perf360CompetencyWeight |
| `perf360Nomination` | 360 Nomination | perf360NominationId, perf360NominationCycleId (FK), perf360NominationRevieweeEmployeeId, perf360NominationReviewerEmployeeId, perf360NominationRelationshipType, perf360NominationStatus, isActive |
| `perf360Response` | 360 Response | perf360ResponseId, perf360ResponseNominationId (FK), perf360ResponseCycleId (FK), perf360ResponseScores (JSONB), perf360ResponseOverallScore |

### 5.5 IT Tables (ไอที)

| ตาราง | คำอธิบาย | Key Fields |
|-------|----------|------------|
| `itAsset` | ทรัพย์สินไอที | itAssetId, itAssetName, itAssetTag, itAssetCategory, itAssetSerialNumber, itAssetStatus, itAssetAssignedTo, itAssetWarrantyExpiry, isActive |
| `itTicket` | Helpdesk Ticket | itTicketId, itTicketNo, itTicketTitle, itTicketCategory, itTicketPriority, itTicketStatus, itTicketRequestedBy, itTicketAssignedTo, isActive |
| `itSoftware` | ซอฟต์แวร์/ลิขสิทธิ์ | itSoftwareId, itSoftwareName, itSoftwareVendor, itSoftwareLicenseKey, itSoftwareLicenseType, itSoftwareExpiryDate, isActive |
| `itDevRequest` | คำขอพัฒนาระบบ | itDevRequestId, itDevRequestNo, itDevRequestTitle, itDevRequestStatus, itDevRequestProgress, itDevRequestAssignedTo, itDevRequestDueDate, isActive |
| `itDevProgressLog` | Progress Log | itDevProgressLogId, itDevProgressLogRequestId (FK), itDevProgressLogProgress, itDevProgressLogNote |
| `itSystemAccess` | คำขอสิทธิ์เข้าถึง | itSystemAccessId, itSystemAccessSystem, itSystemAccessRequestedFor, itSystemAccessStatus, isActive |
| `itNetworkDevice` | อุปกรณ์เครือข่าย | itNetworkDeviceId, itNetworkDeviceName, itNetworkDeviceIpAddress, itNetworkDeviceType, itNetworkDeviceStatus, isActive |
| `itSecurityIncident` | เหตุการณ์ความปลอดภัย | itSecurityIncidentId, itSecurityIncidentTitle, itSecurityIncidentSeverity, itSecurityIncidentStatus, isActive |

### 5.6 Finance Tables (การเงิน)

| ตาราง | คำอธิบาย | Key Fields |
|-------|----------|------------|
| `arFollowUp` | ติดตามลูกหนี้ | id, customerNumber, customerName, invoiceNumber, contactDate, contactMethod, reason, promiseDate, promiseAmount, status, nextFollowUpDate, assignedTo, createdBy |

> **หมายเหตุ:** ข้อมูลการเงินส่วนใหญ่ (Trial Balance, Aged AR/AP, Invoices, Balance Sheet, Income Statement) ดึงจาก BC โดยตรงผ่าน OData ไม่มีตารางใน Supabase

### 5.7 Sales/CRM Tables (การขาย)

| ตาราง | คำอธิบาย | Key Fields |
|-------|----------|------------|
| `salesLead` | Lead | crmLeadId, crmLeadNo, crmLeadName, crmLeadCompany, crmLeadSource, crmLeadScore, crmLeadStatus, crmLeadConvertedContactId (FK), crmLeadConvertedOpportunityId (FK), isActive |
| `salesContact` | ผู้ติดต่อ | crmContactId, crmContactFirstName, crmContactLastName, crmContactEmail, crmContactAccountId (FK), isActive |
| `salesAccount` | บัญชีลูกค้า | crmAccountId, crmAccountName, crmAccountIndustry, crmAccountEmail, isActive |
| `salesOpportunity` | โอกาสการขาย | crmOpportunityId, crmOpportunityName, crmOpportunityStage, crmOpportunityAmount, crmOpportunityProbability, crmOpportunityContactId (FK), crmOpportunityAccountId (FK), isActive |
| `salesQuotation` | ใบเสนอราคา | crmQuotationId, crmQuotationNo, crmQuotationStatus, crmQuotationOpportunityId (FK), crmQuotationTotal, crmQuotationApprovedBy, isActive |
| `salesQuotationLine` | รายการในใบเสนอราคา | crmQuotationLineId, crmQuotationLineQuotationId (FK), crmQuotationLineProductName, crmQuotationLineQuantity, crmQuotationLineUnitPrice, crmQuotationLineAmount, isActive |
| `salesOrder` | คำสั่งซื้อ | crmOrderId, crmOrderNo, crmOrderQuotationId (FK), crmOrderOpportunityId (FK), crmOrderStatus, crmOrderTotal, isActive |
| `salesPipelineStage` | Pipeline Stages | crmPipelineStageId, crmPipelineStageName, crmPipelineStageColor, crmPipelineStageOrder |
| `salesActivity` | กิจกรรมการขาย | crmActivityId, crmActivityType, crmActivityStatus, crmActivitySubject, crmActivityDueDate, crmActivityContactId (FK), crmActivityOpportunityId (FK), isActive |

> **หมายเหตุ:** ตารางถูก rename จาก `crm*` เป็น `sales*` แต่ column names ยังคง prefix `crm` อยู่

### 5.8 Marketing Tables (การตลาด)

| ตาราง | คำอธิบาย | Key Fields |
|-------|----------|------------|
| `omChannel` | ช่องทาง Chat | omChannelId, omChannelType (unique), omChannelName, omChannelAccessToken, omChannelPageId, omChannelSecret, omChannelStatus |
| `omContact` | ผู้ติดต่อจากแชท | omContactId, omContactChannelType, omContactExternalId, omContactDisplayName, omContactAvatarUrl |
| `omConversation` | Conversation | omConversationId, omConversationContactId (FK), omConversationChannelType, omConversationStatus, omConversationAiAutoReply, omConversationAssignedTo, isActive |
| `omMessage` | ข้อความ | omMessageId, omMessageConversationId (FK), omMessageSenderType, omMessageContent, omMessageType, omMessageIsAi, omMessageOcrData (JSONB), isActive |
| `omAiSetting` | ตั้งค่า AI | omAiSettingId, omAiSettingSystemPrompt, omAiSettingModel, omAiSettingTemperature, omAiSettingMaxHistoryMessages, omAiSettingBankAccountInfo |
| `omPriceItem` | รายการราคาสินค้า | omPriceItemId, omPriceItemNumber (unique), omPriceItemName, omPriceItemUnitPrice |
| `omQuotation` | ใบเสนอราคาจากแชท | omQuotationId, omQuotationConversationId (FK), omQuotationContactId (FK), omQuotationNo, omQuotationStatus, omQuotationCustomerName, omQuotationApprovedBy |
| `omQuotationLine` | รายการในใบเสนอราคา | omQuotationLineId, omQuotationLineQuotationId (FK), omQuotationLineProductName, omQuotationLineQuantity, omQuotationLineUnitPrice, omQuotationLineAmount |

### 5.9 TMS Tables (ขนส่ง)

| ตาราง | คำอธิบาย | Key Fields |
|-------|----------|------------|
| `tmsVehicle` | ยานพาหนะ | tmsVehicleId, tmsVehiclePlateNumber, tmsVehicleName, tmsVehicleType, tmsVehicleRegistrationExpiry, tmsVehicleInsuranceExpiry, tmsVehicleCapacityKg, tmsVehicleStatus, isActive |
| `tmsDriver` | พนักงานขับรถ | tmsDriverId, tmsDriverFirstName, tmsDriverLastName, tmsDriverLicenseNumber, tmsDriverLicenseType, tmsDriverLicenseExpiry, tmsDriverRole, tmsDriverStatus, isActive |
| `tmsShipment` | การจัดส่ง | tmsShipmentId, tmsShipmentNumber, tmsShipmentVehicleId (FK), tmsShipmentDriverId (FK), tmsShipmentAssistantId (FK), tmsShipmentRouteId (FK), tmsShipmentStatus, tmsShipmentDate, isActive |
| `tmsDelivery` | Delivery | tmsDeliveryId, tmsDeliveryShipmentId (FK), tmsDeliveryStatus, isActive |
| `tmsRoute` | เส้นทาง | tmsRouteId, tmsRouteName, tmsRouteOrigin, tmsRouteDestination, tmsRouteDistance, tmsRouteEstimatedTime, isActive |
| `tmsFuelLog` | บันทึกเติมน้ำมัน | tmsFuelLogId, tmsFuelLogVehicleId (FK), tmsFuelLogDate, tmsFuelLogLiters, tmsFuelLogTotalCost, tmsFuelLogMileage, isActive |
| `tmsMaintenance` | ซ่อมบำรุง | tmsMaintenanceId, tmsMaintenanceVehicleId (FK), tmsMaintenanceType, tmsMaintenanceDate, tmsMaintenanceCost, tmsMaintenanceNextDueDate, isActive |
| `tmsGpsLog` | GPS Logs | tmsGpsLogId, tmsGpsLogVehicleId (FK), tmsGpsLogShipmentId (FK), tmsGpsLogLatitude, tmsGpsLogLongitude, tmsGpsLogSpeed, tmsGpsLogRecordedAt |

### 5.10 Warehouse Tables (คลังสินค้า)

| ตาราง | คำอธิบาย | Key Fields |
|-------|----------|------------|
| `whScanSession` | Scan Session | whScanSessionId, whScanSessionUserId, whScanSessionName, whScanSessionType, whScanSessionStartedAt, whScanSessionEndedAt, whScanSessionGpsLat/Lon, whScanSessionTagCount |
| `whScanRecord` | Scan Record | whScanRecordId, whScanRecordSessionId (FK), whScanRecordEpc, whScanRecordRssi, whScanRecordItemNumber, whScanRecordItemName, whScanRecordPhotoUrl |
| `whTransfer` | Transfer | whTransferId, whTransferUserId, whTransferNo, whTransferFromLocation, whTransferToLocation, whTransferSessionId (FK), whTransferStatus, whTransferGpsLat/Lon |
| `whOrderMatch` | Order Match | whOrderMatchId, whOrderMatchUserId, whOrderMatchOrderNumber, whOrderMatchExpectedItems (JSONB), whOrderMatchScannedItems (JSONB), whOrderMatchSessionId (FK), whOrderMatchStatus |
| `whAppVersion` | App Version | whAppVersionId, whAppVersionCode, whAppVersionName, whAppVersionDownloadUrl, whAppVersionIsMandatory |

---

## Appendix A: ER Diagram Overview (ภาพรวมความสัมพันธ์)

```
rbacUserProfile ──┬── rbacUserRole ── rbacRole ── rbacRolePermission ── rbacPermission
                  │                                                          │
                  │                                                    ┌─────┴─────┐
                  │                                              rbacResource  rbacAction
                  │
                  ├── hrEmployee ── hrDepartment ── hrDivision
                  │        │
                  │        ├── perfEvaluation
                  │        ├── perfOkrObjective ── perfOkrKeyResult ── perfOkrCheckin
                  │        ├── perfKpiAssignment ── perfKpiRecord
                  │        │       └── perfKpiDefinition
                  │        └── perf360Nomination ── perf360Response
                  │                    └── perf360Cycle ── perf360Competency
                  │
                  ├── omConversation ── omMessage
                  │        │                └── omContact
                  │        └── omQuotation ── omQuotationLine
                  │
                  └── whScanSession ── whScanRecord
                           ├── whTransfer
                           └── whOrderMatch

salesLead ──→ salesContact ──→ salesAccount
                   │
              salesOpportunity ── salesQuotation ── salesQuotationLine
                                       │
                                  salesOrder

tmsShipment ── tmsVehicle ── tmsFuelLog
     │              └── tmsMaintenance
     ├── tmsDriver
     ├── tmsRoute
     ├── tmsDelivery
     └── tmsGpsLog

bcCustomer    bcItem    bcSalesOrder ── bcSalesOrderLine
bcProductionOrder    bcItemLedgerEntry    bciProject
```

---

## Appendix B: Status Workflows

### Shipment Status Flow
```
pending → dispatched → in_transit → delivered
```

### Sales Quotation Status Flow
```
draft → pending_approval → approved → converted_to_order
                        → rejected
```

### Marketing Quotation Status Flow
```
draft → pending → approved
                → rejected
```

### IT Ticket Status Flow
```
open → in_progress → resolved → closed
```

### IT Dev Request Status Flow
```
pending → in_progress → completed → cancelled
```

### 360 Cycle Status Flow
```
active → nomination → in_progress → completed
```

### Lead Status Flow
```
new → contacted → qualified → converted → lost
```

### Opportunity Pipeline Stages
```
prospecting → qualification → proposal → negotiation → closed_won
                                                     → closed_lost
```
