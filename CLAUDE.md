# ⚠️ Production Safety Rules (CRITICAL — อ่านก่อนทุกอย่าง)

> ระบบนี้ใช้งานจริงในองค์กร ข้อมูลที่แสดงผลใช้ตัดสินใจทางธุรกิจและการเงิน
> **ข้อผิดพลาดที่หลุดไปยัง production อาจก่อให้เกิดความเสียหายร้ายแรง**
> กฏในหัวข้อนี้มีความสำคัญสูงกว่ากฏอื่นทั้งหมด

---

## S1: ห้ามแตะตัวเลขการเงินโดยไม่มี precision control

ข้อมูลการเงินทุกตัว (ยอดเงิน, ราคา, ต้นทุน, กำไร) ต้องใช้ `numeric`/`decimal` เท่านั้น — ห้ามใช้ `float64` หรือ `number` ในการคำนวณที่แสดงผลต่อผู้ใช้

```go
// ❌ WRONG — float64 มี rounding error สะสม
var total float64
for _, row := range rows {
    total += row["amount"].(float64)
}

// ✅ CORRECT — ให้ SQL คำนวณแล้วรับผลลัพธ์เดียว
SELECT SUM("bcCustomerLedgerEntryRemainingAmount") AS "totalAmount"
FROM "bcCustomerLedgerEntry"
```

```typescript
// ❌ WRONG — JavaScript number มี precision ปัญหา
const total = rows.reduce((s, r) => s + r.amount, 0)

// ✅ CORRECT — รับค่า aggregated มาจาก backend แล้ว format เพื่อแสดงผลเท่านั้น
const display = new Intl.NumberFormat('th-TH').format(data.totalAmount)
```

---

## S2: ห้าม hardcode ข้อมูลใดๆ ที่แสดงต่อผู้ใช้

ข้อมูลทุกอย่างที่ user เห็นต้องมาจาก Supabase เท่านั้น ห้าม:
- Hardcode ชื่อ, ตัวเลข, สถานะ, วันที่ในโค้ด
- Return mock/dummy data แม้ระหว่าง development
- ใช้ fallback value ที่ดูเหมือนข้อมูลจริง (เช่น `|| "ไม่ระบุ"` สำหรับตัวเลขสำคัญ)

ถ้า table ยังไม่มี → **แจ้งผู้ใช้** อย่าสร้าง mock

---

## S3: ทุก endpoint ต้องผ่าน auth middleware

ห้ามสร้าง endpoint ใหม่โดยไม่ได้ mount อยู่ใต้ route group ที่มี auth middleware
ตรวจสอบใน `routes.go` ว่า route ใหม่อยู่ใต้ `r.Group(func(r chi.Router) { r.Use(middleware.Auth) ... })`

```go
// ❌ WRONG — ไม่มี auth
r.Get("/api/finance/collections", h.Collections)

// ✅ CORRECT — อยู่ใต้ auth group
r.Route("/api", func(r chi.Router) {
    r.Use(middleware.Auth)
    r.Get("/finance/collections", h.Collections)
})
```

---

## S4: ห้ามลบหรือ truncate ข้อมูลโดยไม่มี confirmation

การ DELETE, TRUNCATE, UPDATE ที่กระทบหลาย rows ต้องมี:
1. WHERE clause ที่ชัดเจน — ห้าม DELETE ไม่มี WHERE
2. Soft delete ก่อน (`isActive = false`) สำหรับข้อมูลที่มีความสำคัญ
3. แจ้งผู้ใช้ว่ากำลังจะลบอะไร จำนวนเท่าไหร่ ก่อนดำเนินการ

---

## S5: SQL ต้องใช้ parameterized query เสมอ

ห้าม interpolate ค่าจาก user input ลงใน SQL string โดยตรง (SQL Injection)

```go
// ❌ WRONG — SQL Injection risk
q := fmt.Sprintf(`SELECT * FROM "hrEmployee" WHERE "hrEmployeeId" = '%s'`, id)

// ✅ CORRECT — parameterized
q := `SELECT ... FROM "hrEmployee" WHERE "hrEmployeeId" = $1`
db.QueryRow(ctx, pool, q, id)
```

---

## S6: Error ต้องไม่หายเงียบ

ห้ามใช้ `_ =` กับ error ที่เกิดจาก DB operation หรือ data mutation
ทุก error ต้องถูก return หรือ log อย่างน้อยหนึ่งอย่าง

```go
// ❌ WRONG — error หายไป
_ = h.store.UpdateStatus(ctx, id, status)

// ✅ CORRECT — error ถูก handle
if err := h.store.UpdateStatus(ctx, id, status); err != nil {
    logger.Error("failed to update status", "id", id, "error", err)
    response.InternalError(w, err)
    return
}
```

---

## S7: ห้าม deploy โดยไม่ผ่าน checklist นี้

ก่อน push code ที่จะขึ้น production ต้องผ่านทุกข้อ:

- [ ] `go build ./...` ผ่านโดยไม่มี warning
- [ ] `npx tsc --noEmit` ผ่านโดยไม่มี error
- [ ] ไม่มี hardcoded data ที่แสดงต่อ user
- [ ] ทุก endpoint ใหม่อยู่ใต้ auth middleware
- [ ] ไม่มี SQL ที่ interpolate user input ตรงๆ
- [ ] ตัวเลขการเงินไม่มีการคำนวณด้วย float/JS number
- [ ] ไม่มี DELETE/UPDATE ที่ไม่มี WHERE clause

---

# Language Rule (MANDATORY)

- **ตอบเป็นภาษาไทยเท่านั้น** — ทุกการสื่อสารกับ user ต้องเป็นภาษาไทย
- Code, comments, variable names, commit messages ยังคงเป็นภาษาอังกฤษตามปกติ
- คำอธิบาย, คำถาม, สรุปผล, แจ้ง error ต้องเป็นภาษาไทยทั้งหมด

---

# TypeScript Rule (MANDATORY)

## Core Rules

- **ใช้ TypeScript ทั้งหมด** — ทุกไฟล์ต้องเป็น `.ts` หรือ `.tsx` เท่านั้น ห้ามมีไฟล์ `.js` หรือ `.jsx` ในโปรเจกต์
- **ห้ามใช้ `any` เด็ดขาด** — ยกเว้นเฉพาะ third-party library type ที่แก้ไม่ได้ (เช่น HeroUI internal types, react-leaflet LatLng) ต้อง comment อธิบายทุกครั้ง
- **ทุก props ต้องมี interface** — ทุก React component ต้องมี `interface XxxProps { ... }` ที่ชัดเจน
- **ทุก API response ต้องมี type** — ต้องอ่าน Go `store.go` และ define interface ที่ตรงกับ field aliases ทุกตัว
- **ไม่มี implicit `any`** — TypeScript compiler ต้องไม่มี error จาก `noImplicitAny`

## Type Source of Truth

```
Supabase DB column  →  Go store.go (no alias)  →  TypeScript interface  →  Component props
(raw column name)      (returns raw name)           (frontend type)          (typed props)

ตัวอย่าง:
"bcProductionOrderNo"  →  bcProductionOrderNo  →  bcProductionOrderNo: string  →  order.bcProductionOrderNo
```

**ห้ามใช้ AS alias ใน Go SQL** — Go backend ต้อง return raw Supabase column names ตรงๆ เสมอ
**Frontend types ตรงกับ raw Supabase column names** — ไม่ใช่ alias ที่คิดขึ้นเอง

## Type File Structure (MANDATORY)

```
src/
├── types/
│   └── shared.ts          ← shared types ที่ใช้ข้าม module (User, ApiResponse, etc.)
│
└── modules/
    └── {module}/
        └── types.ts        ← interface ทุกตัวที่ module นั้นใช้
```

ทุก module MUST มี `src/modules/{module}/types.ts` ที่ define:
1. Interface สำหรับทุก API response ของ module นั้น (ตรงกับ Go store.go aliases)
2. Props interface สำหรับทุก component ใน module นั้น

## Pattern ที่ถูกต้อง

```typescript
// ✅ src/modules/production/types.ts
// Field names = raw Supabase column names (ไม่มี AS alias)
export interface ProductionOrder {
  bcProductionOrderId: string;
  bcProductionOrderNo: string;
  bcProductionOrderStatus: string;
  bcProductionOrderDescription: string;
  bcProductionOrderDescription2: string | null;
  bcProductionOrderSourceNo: string;
  bcProductionOrderRoutingNo: string | null;
  bcProductionOrderQuantity: number;
  bcProductionOrderOutputQuantity: number;
  bcProductionOrderStartingDateTime: string | null;
  bcProductionOrderEndingDateTime: string | null;
  bcProductionOrderDueDate: string | null;
  bcProductionOrderAssignedUserID: string | null;
  bcProductionOrderFinishedDate: string | null;
}

export interface OrdersViewProps {
  data: ProductionOrder[];
  loading: boolean;
}
```

```typescript
// ✅ Component — ใช้ type จาก types.ts
import type { OrdersViewProps } from '../types';

export default function OrdersView({ data, loading }: OrdersViewProps) {
  // TypeScript รู้จัก data[0].bcProductionOrderNo, data[0].bcProductionOrderStatus ฯลฯ ทันที
}
```

```typescript
// ❌ WRONG — ไม่มี type, ไม่มี interface
export default function OrdersView({ data, loading }) {
  const qty = row.quantiy;  // typo ไม่มี error → bug ที่หาไม่เจอ
}
```

## File Extension Rules

| สถานการณ์ | Extension |
|---|---|
| React component (มี JSX) | `.tsx` |
| Pure TypeScript (ไม่มี JSX) | `.ts` |
| Next.js `page`, `layout`, `error` | `.tsx` |
| Next.js `route` (API handler) | `.ts` |
| Next.js `proxy` (middleware) | `.ts` |
| Lib / utility / helper | `.ts` |
| Module type definitions | `.ts` (ชื่อ `types.ts`) |

## Checklist ก่อน commit

- [ ] ไม่มี `any` ที่ไม่มี comment อธิบาย
- [ ] ทุก component มี `interface XxxProps`
- [ ] ทุก API call มี return type ที่ตรงกับ Go response
- [ ] `npx tsc --noEmit` ผ่านโดยไม่มี error

---

# Data Flow Architecture (MANDATORY)

## Data Direction: Supabase → Backend → Frontend

Priority:
1. **Supabase** — single source of truth (database)
2. **Backend (Go API)** — reads from Supabase, serves to frontend
3. **Frontend (Next.js)** — reads from Backend API only

### Rules

1. **Backend MUST always read from Supabase** — never hardcode or fabricate data.
2. **Backend SHOULD compute and transform data** — aggregate (SUM, COUNT, GROUP BY), JOIN, filter, and shape data into exactly what the frontend needs. The frontend should NOT receive raw tables and compute everything client-side.
   - Aggregate at backend: aged receivables by customer, dashboard KPIs, monthly summaries
   - JOIN at backend: customer name from bcCustomer, dimension names, etc.
   - Filter at backend: exclude closing entries, filter by date range, status, etc.
   - Reduce payload: SELECT only needed columns, never SELECT * for large tables
3. **Frontend MUST always read from Backend API** — never query Supabase directly from client components.
4. **Field names MUST be identical between Backend API response and Frontend:**
   - **ห้ามใช้ `AS` alias ใน SQL** — Go backend ต้อง SELECT column ตรงๆ ไม่ rename
   - Frontend ใช้ raw Supabase column names ตรงๆ (เช่น `bcCustomerLedgerEntryCustomerNo`)
   - TypeScript interface ต้องตรงกับ raw column names เหล่านั้น
5. **ห้าม rename field ใน Go handler** — ไม่ว่าจะด้วย `AS` alias หรือ struct field mapping
   - ผิด: `SELECT "bcCustomerNo" AS "customerNo"` → frontend ใช้ `row.customerNo`
   - ถูก: `SELECT "bcCustomerNo"` → frontend ใช้ `row.bcCustomerNo`
6. **Before writing any endpoint or component**, verify field name alignment:
   - อ่าน Supabase table schema ดูชื่อ column จริงๆ
   - Go SELECT column นั้นตรงๆ ไม่มี AS alias
   - Frontend TypeScript interface ใช้ชื่อเดียวกันทุก property

### Example

```sql
-- Go store.go — NO AS alias, return raw Supabase column names
SELECT
  e."bcCustomerLedgerEntryCustomerNo",
  COALESCE(c."bcCustomerNameValue", e."bcCustomerLedgerEntryCustomerNo") AS "bcCustomerNameValue",
  SUM(CASE WHEN "bcCustomerLedgerEntryRemainingAmount" != 0
    THEN "bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "bcCustomerLedgerEntryRemainingAmount",
  SUM(CASE WHEN "bcCustomerLedgerEntryDueDate" >= CURRENT_DATE
    THEN "bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "currentAmount"
FROM "bcCustomerLedgerEntry" e
LEFT JOIN "bcCustomer" c ON c."bcCustomerNo" = e."bcCustomerLedgerEntryCustomerNo"
WHERE e."bcCustomerLedgerEntryOpenValue" = 'true'
GROUP BY "bcCustomerLedgerEntryCustomerNo", c."bcCustomerNameValue"
```

```typescript
// Frontend TypeScript — ใช้ raw column names ตรงๆ
interface AgedReceivable {
  bcCustomerLedgerEntryCustomerNo: string;
  bcCustomerNameValue: string;
  bcCustomerLedgerEntryRemainingAmount: number;
  currentAmount: number;
}

const data = await get<AgedReceivable[]>("/api/finance/agedReceivables");
data.map(r => ({
  customerNo: r.bcCustomerLedgerEntryCustomerNo,
  name: r.bcCustomerNameValue,
  balanceDue: r.bcCustomerLedgerEntryRemainingAmount,
}));
```

---

# Database Naming Convention (MANDATORY)

## Table Naming

Every table name MUST follow the pattern: `{module}{Entity}` in **camelCase**

- **module** = lowercase module prefix (e.g., `hr`, `bc`, `tms`, `it`, `sales`)
- **Entity** = PascalCase entity name (e.g., `Employee`, `Division`, `Item`, `GLEntry`)

### Module Prefixes

| Module | Prefix | Examples |
|---|---|---|
| Human Resources | `hr` | `hrEmployee`, `hrDivision`, `hrDepartment`, `hrPosition` |
| Business Central | `bc` | `bcItem`, `bcCustomer`, `bcGLEntry`, `bcPostedSalesInvoice` |
| Finance | `finance` | `financeCollection`, `financeBudget` |
| Sales / CRM | `sales` | `salesLead`, `salesOpportunity`, `salesQuotation` |
| Transport (TMS) | `tms` | `tmsVehicle`, `tmsDelivery`, `tmsShipment` |
| IT | `it` | `itAsset`, `itDevRequest` |
| Marketing | `mkt` | `mktCampaign`, `mktWorkOrder` |
| Production | `prod` | `prodOrder`, `prodBOM` |
| Warehouse | `wh` | `whInventory`, `whLocation` |
| RBAC | `rbac` | `rbacRole`, `rbacPermission` |
| Settings | `sys` | `sysConfig`, `sysSyncState` |
| AR / Collections | `ar` | `arFollowUp`, `arCollection` |

## Column Naming

Every column name MUST follow the pattern: `{tableName}{FieldName}`

- **tableName** = exact table name in camelCase (e.g., `hrDivision`, `bcItem`)
- **FieldName** = PascalCase field name (e.g., `Id`, `Name`, `CreatedAt`)

### Examples

```sql
-- Module: hr
CREATE TABLE hrDivision (
  hrDivisionId          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hrDivisionName        text NOT NULL,
  hrDivisionDescription text,
  hrDivisionCreatedAt   timestamptz DEFAULT now(),
  isActive              boolean DEFAULT true
);

CREATE TABLE hrEmployee (
  hrEmployeeId          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hrEmployeeFirstName   text NOT NULL,
  hrEmployeeLastName    text NOT NULL,
  hrEmployeeEmail       text,
  hrDivisionId          uuid REFERENCES hrDivision(hrDivisionId),  -- FK ใช้ชื่อจาก table ต้นทาง
  hrEmployeeCreatedAt   timestamptz DEFAULT now(),
  isActive              boolean DEFAULT true
);

-- Module: bc
CREATE TABLE bcItem (
  bcItemId              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bcItemNo              text NOT NULL UNIQUE,
  bcItemDescription     text,
  bcItemUnitPrice       numeric,
  bcItemCreatedAt       timestamptz
);
```

### Rules

1. **Table name** = `{module}{Entity}` in camelCase — NEVER just the entity name
2. **Primary key** = `{tableName}Id` (uuid) — NEVER just `id`
3. **Every column** starts with `{tableName}` prefix — no exceptions
4. **Foreign keys** = `{tableName}{ReferencedTable}Id` — the FK column belongs to the current table, referencing another table's PK
   - `hrEmployee` references `hrDivision` → column is `hrEmployeeHrDivisionId`
   - `hrEmployee` references `hrDepartment` → column is `hrEmployeeHrDepartmentId`
   - `hrEmployee` references `hrPosition` → column is `hrEmployeeHrPositionId`
5. **PK/FK relations MUST use Id only** — never relate tables by name, code, or number fields. Always use `{tableName}Id` (uuid) for joins
6. **Only exceptions**: `isActive`, `isDeleted` — shared boolean flags without prefix
7. **All names** are camelCase — no snake_case, no UPPER_CASE

### FK Example

```sql
CREATE TABLE hrEmployee (
  hrEmployeeId              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hrEmployeeFirstName       text NOT NULL,
  hrEmployeeLastName        text NOT NULL,
  hrEmployeeHrDivisionId    uuid REFERENCES hrDivision(hrDivisionId),      -- FK → hrDivision
  hrEmployeeHrDepartmentId  uuid REFERENCES hrDepartment(hrDepartmentId),  -- FK → hrDepartment
  hrEmployeeHrPositionId    uuid REFERENCES hrPosition(hrPositionId),      -- FK → hrPosition
  hrEmployeeCreatedAt       timestamptz DEFAULT now(),
  isActive                  boolean DEFAULT true
);
```

---

# Backend SQL Rules (MANDATORY)

1. **ห้าม SELECT *** — ต้อง SELECT เฉพาะ column ที่ frontend ใช้
2. **ห้ามใช้ AS alias** — SELECT column ตรงๆ โดยไม่ rename ชื่อ column ใน SQL
   - ผิด: `SELECT "bcProductionOrderNo" AS "orderNo"`
   - ถูก: `SELECT "bcProductionOrderNo"`
   - **Naming strategy สำหรับกรณีที่ต้องใช้ AS:**

   | ประเภท | กฎ | ตัวอย่าง |
   |---|---|---|
   | Simple column | ใช้ raw column name ตรงๆ ไม่มี AS | `"bcProductionOrderNo"` |
   | SQL aggregate (SUM/COUNT/MAX) | ใช้ source column name เป็น AS | `SUM("bcCustomerLedgerEntryRemainingAmount") AS "bcCustomerLedgerEntryRemainingAmount"` |
   | JOIN column จาก table อื่น | ใช้ column name จาก table ต้นทาง | `d."hrDivisionName"` (ไม่ต้อง AS เลย) |
   | Go computed (คำนวณจากหลาย source) | descriptive camelCase ไม่มี module prefix | `overdueDays`, `profitMargin`, `onTimeRate` |
3. **ทุก column ที่ใช้ใน WHERE, JOIN, GROUP BY, ORDER BY ต้องมี index** — ถ้าเขียน query ใหม่ ต้องตรวจว่ามี index แล้ว ถ้าไม่มีต้องสร้าง
4. **Query ที่มี aggregate (SUM, COUNT) ต้อง filter ให้แคบก่อน GROUP BY** — ใช้ WHERE ตัดข้อมูลที่ไม่ต้องการออกก่อน aggregate
5. **LATERAL subquery กับ json_agg ต้อง SELECT เฉพาะ column ที่ใช้** — ห้าม `to_json(l.*)` ต้อง `json_build_object('field1', l."col1", ...)`
6. **ทุก List query ต้องมี LIMIT เสมอ** — ห้าม query โดยไม่มี LIMIT เพราะ table อาจโตได้ไม่จำกัด ใช้ตัวเลขที่เหมาะกับ use case
   - BC master data (item, customer): `LIMIT 5000–30000`
   - BC ledger/document: `LIMIT 500–2000`
   - App tables (sales, hr, tms, mkt): `LIMIT 200–1000`
   - Dashboard aggregation (GROUP BY): `LIMIT 500–2000`
7. **Dashboard handler ที่มี query หลายตัวต้องใช้ `errgroup` parallel** — ห้าม call store หลายครั้งแบบ sequential

```go
// ✅ CORRECT — parallel ด้วย errgroup
var orders, entries []map[string]any
g, gCtx := errgroup.WithContext(ctx)
g.Go(func() error { var e error; orders, e = h.store.GetOrders(gCtx); return e })
g.Go(func() error { var e error; entries, e = h.store.GetEntries(gCtx); return e })
if err := g.Wait(); err != nil { response.InternalError(w, err); return }

// ❌ WRONG — sequential (ช้ากว่า 2-10x สำหรับ dashboard)
orders, _ := h.store.GetOrders(ctx)
entries, _ := h.store.GetEntries(ctx)
```

---

# Frontend Fetching Rules (MANDATORY)

1. **ถ้า fetch หลาย endpoint ใน page เดียว ต้อง fetch แบบ parallel** — ห้าม waterfall (sequential) fetch
   - Server Component: ใช้ `Promise.all([fetch1(), fetch2()])`
   - Client Component (SWR): SWR จะ parallel อัตโนมัติถ้าไม่มี dependency ระหว่าง key
2. **ข้อมูลที่โหลดตอน page load ให้ใช้ Server Component fetch ก่อน** แล้วส่ง props ลง Client Component
3. **ใช้ client-side fetch (SWR/useEffect) เฉพาะข้อมูลที่ต้อง refresh แบบ realtime** หรือขึ้นกับ user interaction
4. **ห้ามใช้ revalidate cache ใน `api()` เด็ดขาด** — ระบบ BC sync ทุก 5 นาที ข้อมูลต้องเป็น real-time เสมอ
   - ผิด: `api("/api/bc/customers", 1800)` หรือ `api("/api/hr/divisions", 86400)`
   - ถูก: `api("/api/bc/customers")` — ไม่ใส่ parameter ที่ 2 เลย
   - `api()` default คือ `cache: "no-store"` ซึ่งถูกต้องแล้ว อย่าเปลี่ยน
5. **`useSWR` ทุกตัวต้องมี `revalidateOnFocus: false`** — ป้องกัน refetch ไม่จำเป็นทุกครั้งที่ user สลับ tab กลับมา
   - ยกเว้น: ข้อมูลที่ต้องการ aggressive refresh จริงๆ (เช่น GPS tracking ที่มี `refreshInterval`)
   ```typescript
   // ✅ CORRECT
   useSWR<T>(key, fetcher, { revalidateOnFocus: false })

   // ❌ WRONG — จะ refetch ทุกครั้งที่กลับมาที่ tab
   useSWR<T>(key, fetcher)
   ```

---

# API Response Rules (MANDATORY)

1. **Endpoint ที่ return list ต้อง support pagination** — default limit 50, ใช้ query param `?limit=50&offset=0`
2. **ห้าม return nested data ถ้า frontend ไม่ได้ใช้** — ใช้ `?expand=true` เมื่อต้องการ nested relations
3. **Response field names = raw Supabase column names** — ไม่มีการ rename (สอดคล้องกับ Data Flow Architecture Rule #4)

---

# Middleware Rules (MANDATORY)

1. **Auth check result ต้อง cache** (in-memory หรือ Redis) TTL 5 นาที — ห้าม query DB ซ้ำทุก request สำหรับข้อมูลที่ไม่เปลี่ยนบ่อย (role, permission)
2. **Middleware/Auth ควรทำ 1 query รวม** แทนหลาย query แยก — JOIN rbacUserRole + rbacUserProfile + rbacRole ในครั้งเดียว

---

# Next.js Development Rules

Sources: Official Next.js 16.2.0 Documentation
- https://nextjs.org/docs/app/getting-started/layouts-and-pages
- https://nextjs.org/docs/app/getting-started/server-and-client-components
- https://nextjs.org/docs/app/getting-started/fetching-data
- https://nextjs.org/docs/app/getting-started/caching
- https://nextjs.org/docs/app/getting-started/revalidating
- https://nextjs.org/docs/app/getting-started/mutating-data
- https://nextjs.org/docs/app/getting-started/error-handling
- https://nextjs.org/docs/app/getting-started/metadata-and-og-images
- https://nextjs.org/docs/app/api-reference/file-conventions/route
- https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- https://nextjs.org/docs/app/api-reference/file-conventions/route-groups
- https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes
- https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes
- https://nextjs.org/docs/app/guides/redirecting
- https://nextjs.org/docs/app/api-reference/file-conventions/error
- https://nextjs.org/docs/app/api-reference/components/image
- https://nextjs.org/docs/app/getting-started/metadata-and-og-images

---

## 1. Routing — Pages & Layouts

### Pages
- A **page** is UI rendered on a specific route.
- Create by adding `page.js` inside `app/` and **default exporting** a React component.
- **Folders** = route segments. **Files** (`page`, `layout`) = UI for that segment.

```jsx
export default function Page() {
  return <h1>Hello</h1>
}
```

### Layouts
- A **layout** is shared UI between multiple pages.
- On navigation: layouts **preserve state, remain interactive, and do NOT rerender**.
- Must accept a `children` prop.
- The **root layout** (`app/layout.js`) is **required** and must contain `<html>` and `<body>` tags.

```jsx
// app/layout.js
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><main>{children}</main></body>
    </html>
  )
}
```

### Nested Routes & Layouts
- Nest folders to create nested routes: `app/blog/[slug]/page.js`
- Add `layout.js` inside a route folder for a nested layout.
- Root layout wraps → blog layout wraps → page.

### Dynamic Segments
- Wrap folder name in `[brackets]` → dynamic route segment.
- **Next.js 16: `params` is a Promise — MUST `await` it.**

```jsx
// app/blog/[slug]/page.js
export default async function Page({ params }) {
  const { slug } = await params  // ← MUST await
  const post = await getPost(slug)
  return <div><h1>{post.title}</h1></div>
}
```

### Search Params
- **Next.js 16: `searchParams` is a Promise — MUST `await` it.**
- Using `searchParams` opts the page into **dynamic rendering**.

```jsx
export default async function Page({ searchParams }) {
  const { q } = await searchParams  // ← MUST await
}
```

**When to use which:**

| Need | Use |
|---|---|
| Load data from DB (pagination, filtering) | `searchParams` prop in Server Component page |
| Filter already-loaded client list | `useSearchParams` hook in Client Component |
| Read params in event handler | `new URLSearchParams(window.location.search)` |

### Navigation
- `<Link href="...">` from `next/link` = **primary** navigation.
- `useRouter` = **advanced** navigation only (event handlers in Client Components).

```jsx
import Link from 'next/link'
// ...
<Link href={`/blog/${post.slug}`}>{post.title}</Link>
```

---

## 2. Route Groups

- Wrap folder name in `(parentheses)` → **not included in URL path**.
- Used for: organizing routes by team/feature, multiple root layouts, shared layouts without affecting URL.

```
app/
├── (marketing)/
│   ├── layout.js    ← layout for marketing routes only
│   └── about/page.js  → URL: /about
└── (shop)/
    ├── layout.js    ← layout for shop routes only
    └── cart/page.js   → URL: /cart
```

**Rules:**
- Routes in different groups **must not resolve to the same URL path** (e.g., `(a)/about` and `(b)/about` both → `/about` = error).
- Navigating between routes using **different root layouts** triggers a **full page reload**.
- If using multiple root layouts without a top-level `layout.js`, define the home route `/` inside one of the groups.

---

## 3. Server Components vs Client Components

### Default
- **By default, layouts and pages are Server Components.**
- Add `"use client"` only when the component needs client-side features.

### Use Server Components when:
- Fetching data from databases or APIs.
- Using API keys, tokens, secrets (not exposed to client).
- Reducing JavaScript sent to the browser.
- Improving First Contentful Paint (FCP).

### Use Client Components when:
- Using **state** and **event handlers** (`onClick`, `onChange`).
- Using **lifecycle logic** (`useEffect`).
- Using **browser-only APIs** (`localStorage`, `window`, `geolocation`).
- Using **custom hooks**.

```jsx
// Server Component — fetch + pass to Client
export default async function Page({ params }) {
  const { id } = await params
  const post = await getPost(id)
  return <LikeButton likes={post.likes} />
}

// Client Component — interactivity
'use client'
import { useState } from 'react'
export default function LikeButton({ likes }) {
  const [count, setCount] = useState(likes)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

### `"use client"` Rules
- Place at the **top of the file, above imports**.
- Declares a **boundary** — all imports and children become part of the client bundle.
- Add `"use client"` to **specific interactive components** only, not large layout components.

```jsx
// CORRECT — Layout stays Server Component, only Search is Client
import Search from './search'   // 'use client' inside search.js
import Logo from './logo'       // stays Server Component

export default function Layout({ children }) {
  return (
    <><nav><Logo /><Search /></nav><main>{children}</main></>
  )
}
```

### Passing Data Server → Client
- Pass via **props**. Props must be **serializable** by React.

### Interleaving Server and Client Components
- Pass Server Components as **children prop** to Client Components.

```jsx
'use client'
export default function Modal({ children }) {
  return <div>{children}</div>
}

// Server Component parent
export default function Page() {
  return <Modal><Cart /></Modal>  // Cart is a Server Component
}
```

### Context Providers
- React context is **not supported in Server Components**.
- Create a `'use client'` wrapper as the provider.
- Render providers **as deep as possible** in the tree.

```jsx
// theme-provider.js
'use client'
import { createContext } from 'react'
export const ThemeContext = createContext({})
export default function ThemeProvider({ children }) {
  return <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>
}

// layout.js (Server Component)
import ThemeProvider from './theme-provider'
export default function RootLayout({ children }) {
  return <html><body><ThemeProvider>{children}</ThemeProvider></body></html>
}
```

### Third-party Components
- If a third-party component uses client-only features but has no `"use client"`, wrap it:

```jsx
// carousel.js
'use client'
import { Carousel } from 'acme-carousel'
export default Carousel
```

### Preventing Environment Poisoning
- Only `NEXT_PUBLIC_` env vars are in the client bundle. Others → empty string on client.
- Use `server-only` package to prevent server code from being used in Client Components:

```js
import 'server-only'  // build-time error if imported in Client Component
export async function getData() { /* uses process.env.API_KEY safely */ }
```

---

## 4. Data Fetching

### Server Components
- Make component an **async function** and `await` fetch.
- `fetch` requests are **NOT cached by default** in Next.js 16.
- Identical `fetch` requests in the same component tree are **memoized** (de-duplicated automatically).

```jsx
// With fetch API
export default async function Page() {
  const res = await fetch('https://api.example.com/blog')
  const posts = await res.json()
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}

// With ORM/database (safe — server-side only)
export default async function Page() {
  const posts = await db.select().from(postsTable)
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

### Parallel Data Fetching (preferred for performance)
```jsx
export default async function Page({ params }) {
  const { username } = await params

  // Start both requests (do NOT await yet)
  const artistData = getArtist(username)
  const albumsData = getAlbums(username)

  // Await together
  const [artist, albums] = await Promise.all([artistData, albumsData])
  return <><h1>{artist.name}</h1><Albums list={albums} /></>
}
```
> Use `Promise.allSettled` instead of `Promise.all` if you need to handle partial failures.

### Sequential Data Fetching (when one depends on another)
```jsx
export default async function Page({ params }) {
  const { username } = await params
  const artist = await getArtist(username)  // first
  return (
    <>
      <h1>{artist.name}</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Playlists artistID={artist.id} />  {/* depends on artist */}
      </Suspense>
    </>
  )
}
```

### Client Components
**Option 1 — `use` API (stream from server):**
```jsx
// Server Component — pass promise without awaiting
export default function Page() {
  const posts = getPosts()  // no await
  return <Suspense fallback={<div>Loading...</div>}><Posts posts={posts} /></Suspense>
}

// Client Component — resolve with use()
'use client'
import { use } from 'react'
export default function Posts({ posts }) {
  const allPosts = use(posts)
  return <ul>{allPosts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

**Option 2 — SWR or React Query:**
```jsx
'use client'
import useSWR from 'swr'
const fetcher = url => fetch(url).then(r => r.json())
export default function Page() {
  const { data, error, isLoading } = useSWR('/api/blog', fetcher)
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error</div>
  return <ul>{data.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

### Deduplicating with `React.cache`
```js
import { cache } from 'react'
export const getPost = cache(async (slug) => {
  return db.posts.findFirst({ where: { slug } })
})
// getPost called multiple times in one request = executes only once
```

---

## 5. Caching

> Requires `cacheComponents: true` in `next.config.js`.

```js
// next.config.js
const nextConfig = { cacheComponents: true }
module.exports = nextConfig
```

### `use cache` Directive
- Caches the return value of async functions and components.
- Arguments and closed-over values become part of the **cache key** automatically.

**Data-level caching:**
```js
import { cacheLife } from 'next/cache'

export async function getProducts() {
  'use cache'
  cacheLife('hours')
  return db.query('SELECT * FROM products')
}
```

**UI-level caching:**
```jsx
import { cacheLife } from 'next/cache'

export default async function Page() {
  'use cache'
  cacheLife('hours')
  const users = await db.query('SELECT * FROM users')
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```
> If `"use cache"` is at the **top of a file**, all exported functions in that file are cached.

### `cacheLife` Profiles

| Profile | `stale` | `revalidate` | `expire` |
|---|---|---|---|
| `seconds` | 0 | 1s | 60s |
| `minutes` | 5m | 1m | 1h |
| `hours` | 5m | 1h | 1d |
| `days` | 5m | 1d | 1w |
| `weeks` | 5m | 1w | 30d |
| `max` | 5m | 30d | ~indefinite |

Custom config:
```js
'use cache'
cacheLife({ stale: 3600, revalidate: 7200, expire: 86400 })
```

### Streaming Uncached Data
- Do NOT use `"use cache"` for fresh-every-request data.
- Wrap in `<Suspense>` instead:

```jsx
import { Suspense } from 'react'

async function LatestPosts() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json())
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}

export default function Page() {
  return (
    <>
      <h1>Blog</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <LatestPosts />
      </Suspense>
    </>
  )
}
```

### Runtime APIs Must Be Wrapped in `<Suspense>`
Runtime APIs (`cookies`, `headers`, `searchParams`, `params`) require a live request. Components using them must be wrapped in `<Suspense>`:

```jsx
import { cookies } from 'next/headers'
import { Suspense } from 'react'

async function UserGreeting() {
  const theme = (await cookies()).get('theme')?.value || 'light'
  return <p>Theme: {theme}</p>
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UserGreeting />
    </Suspense>
  )
}
```

### Passing Runtime Values to Cached Functions
Extract from runtime APIs first, pass as argument to cached function:

```jsx
async function ProfileContent() {
  const session = (await cookies()).get('session')?.value
  return <CachedContent sessionId={session} />
}

async function CachedContent({ sessionId }) {
  'use cache'
  // sessionId is part of cache key
  const data = await fetchUserData(sessionId)
  return <div>{data}</div>
}
```

### How Rendering Works (Partial Prerendering — PPR)
- `use cache` → included in **static shell**
- `<Suspense>` → fallback in static shell, content streams at request time
- Deterministic operations (pure computations, module imports) → static shell automatically
- If a component can't prerender and isn't wrapped in `<Suspense>` or `use cache` → **build error**

---

## 6. Revalidating

### `cacheTag` + `revalidateTag` / `updateTag`
Tag cached data for on-demand invalidation:

```js
import { cacheTag } from 'next/cache'
export async function getProducts() {
  'use cache'
  cacheTag('products')
  return db.query('SELECT * FROM products')
}
```

**`revalidateTag`** — stale-while-revalidate (serves stale immediately, refreshes in background):
```js
import { revalidateTag } from 'next/cache'
export async function updateProduct(id) {
  // mutate data...
  revalidateTag('products')  // stale content served while fresh content generates
}
```

**`updateTag`** — immediately expires (user sees their change right away):
```js
import { updateTag } from 'next/cache'
export async function createPost(formData) {
  'use server'
  await db.post.create({ data: { title: formData.get('title') } })
  updateTag('posts')  // user sees the new post immediately
}
```

| | `updateTag` | `revalidateTag` |
|---|---|---|
| **Where** | Server Actions only | Server Actions + Route Handlers |
| **Behavior** | Immediately expires cache | Stale-while-revalidate |
| **Use case** | User sees their own change | Background refresh (slight delay OK) |

### `revalidatePath`
Invalidates all cached data for a specific route path:
```js
import { revalidatePath } from 'next/cache'
revalidatePath('/posts')
```
> Prefer `revalidateTag`/`updateTag` over `revalidatePath` when possible — more precise.

---

## 7. Mutating Data — Server Functions

### What Are Server Functions?
- Async functions that run on the **server**, called from client via network request.
- In mutation context, called **Server Actions**.
- Behind the scenes: use `POST` method. **Only POST can invoke them.**
- **Always verify authentication and authorization inside every Server Function** — they are reachable via direct POST requests.

### Creating Server Functions
Add `"use server"` directive at top of function body or top of file:

```js
// app/lib/actions.js
import { auth } from '@/lib/auth'

export async function createPost(formData) {
  'use server'
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const title = formData.get('title')
  // mutate data, revalidate cache
}
```

**Inline in Server Component:**
```jsx
export default function Page() {
  async function create(formData) {
    'use server'
    // ...
  }
  return <form action={create}>...</form>
}
```

**From Client Component** — import from a `"use server"` file:
```js
// app/actions.js
'use server'
export async function createPost() {}
```
```jsx
// app/ui/button.js
'use client'
import { createPost } from '@/app/actions'
export function Button() {
  return <button formAction={createPost}>Create</button>
}
```

### Invoking Server Functions

**In forms (`action` prop):**
```jsx
import { createPost } from '@/app/actions'
export function Form() {
  return (
    <form action={createPost}>
      <input name="title" /><button type="submit">Create</button>
    </form>
  )
}
```
> Server Components support **progressive enhancement** — forms work even if JavaScript hasn't loaded yet.

**In event handlers (Client Component):**
```jsx
'use client'
import { incrementLike } from './actions'
import { useState } from 'react'
export default function LikeButton({ initialLikes }) {
  const [likes, setLikes] = useState(initialLikes)
  return (
    <button onClick={async () => {
      const updated = await incrementLike()
      setLikes(updated)
    }}>
      {likes} likes
    </button>
  )
}
```

### Showing Pending State
```jsx
'use client'
import { useActionState, startTransition } from 'react'
import { createPost } from '@/app/actions'

export function Button() {
  const [state, action, pending] = useActionState(createPost, false)
  return (
    <button onClick={() => startTransition(action)}>
      {pending ? 'Saving...' : 'Create Post'}
    </button>
  )
}
```

### After Mutation: Revalidate + Redirect
```js
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData) {
  // mutate...
  revalidatePath('/posts')   // revalidate BEFORE redirect
  redirect('/posts')         // redirect throws — code after this won't run
}
```
> `redirect` throws a framework exception — call `revalidatePath`/`revalidateTag` **before** it.

### Handling Errors in Server Functions
- For **expected errors**: return error as a value (not throw), use `useActionState`:

```js
// actions.js
'use server'
export async function createPost(prevState, formData) {
  const res = await fetch('/api/posts', { method: 'POST', body: formData })
  if (!res.ok) return { message: 'Failed to create post' }  // return, not throw
}
```
```jsx
// form.js
'use client'
import { useActionState } from 'react'
import { createPost } from '@/app/actions'

export function Form() {
  const [state, formAction, pending] = useActionState(createPost, { message: '' })
  return (
    <form action={formAction}>
      <input name="title" />
      {state?.message && <p>{state.message}</p>}
      <button disabled={pending}>Submit</button>
    </form>
  )
}
```

---

## 8. Route Handlers (`route.js`)

- Custom request handlers using Web `Request` and `Response` APIs.
- Supported HTTP methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`.
- `OPTIONS` is implemented automatically if not defined.
- Create `route.js` inside `app/` directory (cannot coexist with `page.js` in same segment).

```js
// app/api/posts/route.js
export async function GET() {
  return Response.json({ message: 'Hello' })
}

export async function POST(request) {
  const body = await request.json()
  return Response.json({ received: body }, { status: 201 })
}
```

### Dynamic Route Handlers
```js
// app/api/posts/[slug]/route.js
export async function GET(request, { params }) {
  const { slug } = await params  // ← MUST await in Next.js 16
  return Response.json({ slug })
}
```

### Reading Query Parameters
```js
export function GET(request) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  return Response.json({ query })
}
```

### Reading/Setting Cookies
```js
import { cookies } from 'next/headers'
export async function GET(request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')
  return Response.json({ token: token?.value })
}
```

### Reading Headers
```js
import { headers } from 'next/headers'
export async function GET() {
  const headersList = await headers()
  const referer = headersList.get('referer')
  return new Response('Hello', { headers: { referer } })
}
```
> `headers` instance is **read-only**. To set headers, return a `new Response` with new headers.

### FormData
```js
export async function POST(request) {
  const formData = await request.formData()
  const name = formData.get('name')
  return Response.json({ name })
}
```

### Streaming (e.g., for AI/LLMs)
```js
export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode('Hello'))
      controller.close()
    }
  })
  return new Response(stream)
}
```

### CORS Headers
```js
export async function GET() {
  return new Response('OK', {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}
```

### Segment Config Options
```js
export const dynamic = 'auto'
export const revalidate = 60
export const runtime = 'nodejs'
```

---

## 9. Proxy (formerly Middleware)

> **Next.js 16: `middleware.js` is DEPRECATED. File is now `proxy.js`, function is now `proxy()`.**
> To migrate: `npx @next/codemod@canary middleware-to-proxy .`

- `proxy.js` (or `proxy.ts`) placed at project root or inside `src/`.
- Runs **before** routes are rendered — useful for auth, redirects, logging.
- **Does NOT share modules or globals with render code** — deployed separately (e.g., CDN/Edge).
- Pass information to app via **headers**, **cookies**, **rewrites**, or **URL**.
- Defaults to **Node.js runtime**.
- **Always verify auth inside Server Functions** — do not rely on Proxy alone.

```js
// proxy.js
import { NextResponse } from 'next/server'

export function proxy(request) {
  return NextResponse.redirect(new URL('/home', request.url))
}

export const config = {
  matcher: '/about/:path*',
}
```

### Matcher Config
```js
export const config = {
  matcher: ['/about/:path*', '/dashboard/:path*'],
}

// With regex — exclude static files, API routes:
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}

// Advanced matcher with conditions:
export const config = {
  matcher: [{
    source: '/api/:path*',
    has: [{ type: 'header', key: 'Authorization' }],
    missing: [{ type: 'cookie', key: 'session', value: 'active' }],
  }]
}
```

**Matcher rules:**
- MUST start with `/`
- `/about/:path` matches `/about/a` but NOT `/about/a/c`
- `/about/:path*` matches `/about/a/b/c` (`*` = zero or more)
- `:path?` = zero or one, `:path+` = one or more
- Matcher values must be **constants** (no variables)

### Execution Order
1. `headers` from `next.config.js`
2. `redirects` from `next.config.js`
3. **Proxy** (rewrites, redirects, etc.)
4. Filesystem routes (`public/`, `app/`, etc.)
5. Dynamic routes

### Proxy Actions: Redirect, Rewrite, Headers, Cookies
```js
import { NextResponse } from 'next/server'

export function proxy(request) {
  // Redirect
  if (!isAuthenticated(request)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rewrite
  if (request.nextUrl.pathname.startsWith('/old')) {
    return NextResponse.rewrite(new URL('/new', request.url))
  }

  // Set request/response headers
  const response = NextResponse.next({
    request: { headers: new Headers(request.headers) }
  })
  response.headers.set('x-custom', 'value')
  return response
}
```

### Cookies in Proxy
```js
export function proxy(request) {
  const cookie = request.cookies.get('token')
  const response = NextResponse.next()
  response.cookies.set('newCookie', 'value', { path: '/' })
  return response
}
```

### Background Work with `waitUntil`
```js
export function proxy(req, event) {
  event.waitUntil(
    fetch('https://analytics.example.com', {
      method: 'POST',
      body: JSON.stringify({ path: req.nextUrl.pathname }),
    })
  )
  return NextResponse.next()
}
```

---

## 10. Parallel Routes

- Render multiple pages simultaneously in the same layout.
- Created using **named slots** with `@folder` convention.

```
app/
├── layout.js
├── @analytics/
│   └── page.js
└── @team/
    └── page.js
```

```jsx
// app/layout.js
export default function Layout({ children, team, analytics }) {
  return (
    <>
      {children}
      {team}
      {analytics}
    </>
  )
}
```

**Rules:**
- Slots are **NOT route segments** — `@analytics` does not appear in the URL.
- `children` prop is an implicit slot (`app/page.js` = `app/@children/page.js`).
- If one slot is dynamic, **all slots at that level must be dynamic**.

### `default.js` — Fallback for Unmatched Slots
- Required when a slot doesn't have a matching page for a given route.
- On hard navigation (refresh), Next.js renders `default.js`. If it doesn't exist → 404.

```jsx
// app/@analytics/default.js
export default function Default() {
  return null
}
```

### Conditional Routes
```jsx
import { checkUserRole } from '@/lib/auth'
export default function Layout({ user, admin }) {
  const role = checkUserRole()
  return role === 'admin' ? admin : user
}
```

### Tab Groups with Parallel Routes
Add a `layout.js` inside a slot to allow independent navigation:
```jsx
// app/@analytics/layout.js
import Link from 'next/link'
export default function Layout({ children }) {
  return (
    <><nav><Link href="/page-views">Views</Link><Link href="/visitors">Visitors</Link></nav>{children}</>
  )
}
```

### Modals with Parallel Routes + Intercepting Routes
Use `@modal` slot + intercepting route `(.)` to create URL-shareable modals:
- Modal opens via client navigation → intercepted route renders modal overlay
- Direct URL or refresh → full page renders
- Back navigation → closes modal
- Create `default.js` returning `null` so modal is hidden when not active

---

## 11. Intercepting Routes

- Load a route from another part of app **within the current layout**.
- Soft navigation (client-side) → intercept and show overlay.
- Hard navigation (refresh, direct URL) → show full page, no interception.

### Convention
Based on **route segments** (not file system levels):

| Convention | Matches |
|---|---|
| `(.)` | Same level segment |
| `(..)` | One level above |
| `(..)(..)` | Two levels above |
| `(...)` | Root `app` directory |

```
app/
├── feed/
│   └── page.js
├── photo/
│   └── [id]/page.js    ← full page
└── @modal/
    └── (.)photo/
        └── [id]/page.js  ← intercepts /photo/[id] when soft navigating
```

> `(..)` convention is based on route segments, not file system. `@slot` folders are not counted.

---

## 12. Redirects

| Method | Purpose | Where | Status |
|---|---|---|---|
| `redirect()` | After mutation/event | Server Components, Server Functions, Route Handlers | 307 / 303 |
| `permanentRedirect()` | Permanent URL change | Server Components, Server Functions, Route Handlers | 308 |
| `useRouter().push()` | Client-side navigation | Event handlers in Client Components | N/A |
| `redirects` in `next.config.js` | Path-based redirects | Config file | 307/308 |
| `NextResponse.redirect` in Proxy | Condition-based redirects | `proxy.js` | Any |

### `redirect()`
```js
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createPost(formData) {
  // ...mutate
  revalidatePath('/posts')
  redirect('/posts')  // throws — call revalidate BEFORE this
}
```
> Call `redirect` **outside** try/catch blocks. Accepts absolute URLs for external links.

### `permanentRedirect()`
```js
import { permanentRedirect } from 'next/navigation'
permanentRedirect(`/profile/${username}`)  // 308 status
```

### `useRouter` (Client Component event handlers)
```jsx
'use client'
import { useRouter } from 'next/navigation'
export default function Page() {
  const router = useRouter()
  return <button onClick={() => router.push('/dashboard')}>Go</button>
}
```

### `redirects` in `next.config.js` (runs before Proxy)
```js
module.exports = {
  async redirects() {
    return [
      { source: '/old', destination: '/new', permanent: true },
      { source: '/blog/:slug', destination: '/news/:slug', permanent: true },
    ]
  }
}
```
> Limit: 1,024 redirects on Vercel. For 1000+ redirects, use Proxy + Bloom filter.

### `NextResponse.redirect` in Proxy (runs after config redirects, before rendering)
```js
export function proxy(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

---

## 13. Error Handling

### Expected Errors (validation, failed requests)
- Return errors as **values**, not throw. Use `useActionState`:

```js
// actions.js
'use server'
export async function createPost(prevState, formData) {
  const res = await fetch('/api/posts', { method: 'POST' })
  if (!res.ok) return { message: 'Failed to create post' }  // return, not throw
}
```
```jsx
// form.js
'use client'
import { useActionState } from 'react'
import { createPost } from '@/app/actions'

export function Form() {
  const [state, formAction, pending] = useActionState(createPost, { message: '' })
  return (
    <form action={formAction}>
      <input name="title" />
      {state?.message && <p aria-live="polite">{state.message}</p>}
      <button disabled={pending}>Submit</button>
    </form>
  )
}
```

### Not Found
```jsx
import { notFound } from 'next/navigation'

export default async function Page({ params }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()
  return <div>{post.title}</div>
}
```
```jsx
// app/blog/[slug]/not-found.js
export default function NotFound() {
  return <div>404 - Not Found</div>
}
```

### Uncaught Exceptions — `error.js`
- `error.js` **MUST be a Client Component** (`'use client'`).
- Wraps route segment in React Error Boundary.
- Does NOT catch errors in the `layout.js` or `template.js` of the **same segment** — only children.
- Does NOT catch errors in event handlers.

```jsx
// app/dashboard/error.js
'use client'
import { useEffect } from 'react'

export default function Error({ error, unstable_retry }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => unstable_retry()}>Try again</button>
    </div>
  )
}
```

**Props:**
- `error` — Error instance. In production, server errors show generic message + `error.digest` (hash for server log matching).
- `unstable_retry()` — re-fetches and re-renders the segment. Prefer over `reset()`.

### Global Error (`global-error.js`)
- Handles errors in the **root layout**.
- **MUST define its own `<html>` and `<body>` tags** (replaces root layout when active).
- Must be `'use client'`.

```jsx
// app/global-error.js
'use client'
export default function GlobalError({ error, unstable_retry }) {
  return (
    <html><body>
      <h2>Something went wrong!</h2>
      <button onClick={() => unstable_retry()}>Try again</button>
    </body></html>
  )
}
```

### Errors in Event Handlers
Error boundaries do NOT catch event handler errors. Use `useState`:
```jsx
'use client'
import { useState } from 'react'
export function Button() {
  const [error, setError] = useState(null)
  const handleClick = () => {
    try { /* ... */ } catch (e) { setError(e) }
  }
  if (error) return <div>Error: {error.message}</div>
  return <button onClick={handleClick}>Click</button>
}
```

> Unhandled errors inside `startTransition` bubble up to the nearest error boundary.

---

## 14. Metadata & OG Images

- `metadata` object and `generateMetadata` function: **Server Components only**.
- Two default tags always added: `<meta charset="utf-8" />` and `<meta name="viewport" .../>`.

### Static Metadata
```js
// app/blog/layout.js or page.js
export const metadata = {
  title: 'My Blog',
  description: '...',
}
```

### Dynamic Metadata
```js
// app/blog/[slug]/page.js
export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params
  const post = await fetch(`https://api.example.com/blog/${slug}`).then(r => r.json())
  return {
    title: post.title,
    description: post.description,
  }
}
```
- Metadata streams separately from UI — doesn't block rendering.
- Streaming metadata is **disabled for bots/crawlers** (Twitterbot, Slackbot, Bingbot).

### Deduplicating Data in `generateMetadata` + Page
Use `React.cache` so both page and metadata fetch the same data without duplicate requests:
```js
import { cache } from 'react'
export const getPost = cache(async (slug) => {
  return db.posts.findFirst({ where: { slug } })
})
```

### File-Based Metadata Special Files
| File | Purpose |
|---|---|
| `favicon.ico` | Browser tab icon |
| `opengraph-image.jpg` | OG image for social sharing |
| `twitter-image.jpg` | Twitter card image |
| `robots.txt` | Search engine crawler rules |
| `sitemap.xml` | Sitemap for SEO |

More specific files (deeper in folder) override less specific ones.

### Generated OG Images
```js
// app/blog/[slug]/opengraph-image.js
import { ImageResponse } from 'next/og'
import { getPost } from '@/app/lib/data'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }) {
  const post = await getPost(params.slug)
  return new ImageResponse(
    <div style={{ fontSize: 128, background: 'white', width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {post.title}
    </div>
  )
}
```
> `ImageResponse` supports flexbox and absolute positioning. `display: grid` is NOT supported.

---

## 15. Image Optimization (`next/image`)

- Always use `<Image>` from `next/image` instead of `<img>`.
- Provides automatic optimization: WebP/AVIF conversion, lazy loading, size optimization.

```jsx
import Image from 'next/image'

export default function Page() {
  return (
    <Image
      src="/profile.png"
      width={500}
      height={500}
      alt="Profile picture"
    />
  )
}
```

### Required Props
- `src` — path string, absolute URL (must configure `remotePatterns`), or static import.
- `alt` — describes image for screen readers. Fallback text if image fails. Decorative images: `alt=""`.

### External Images
Must configure in `next.config.js`:
```js
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'example.com', pathname: '/images/**' }
    ]
  }
}
```
> The default loader does NOT forward headers when fetching `src`. For authenticated images, use `unoptimized`.

---

## 16. Special File Conventions Summary

| File | Purpose | Notes |
|---|---|---|
| `page.js` | UI for a route | Default export required |
| `layout.js` | Shared UI wrapping pages | Must accept `children` |
| `loading.js` | Loading UI (wraps page in Suspense) | Auto-wraps page in `<Suspense>` |
| `error.js` | Error boundary fallback | **MUST be `'use client'`** |
| `global-error.js` | Root layout error boundary | Must have `<html>` and `<body>` |
| `not-found.js` | 404 UI | Triggered by `notFound()` |
| `route.js` | API Route Handler | Cannot coexist with `page.js` |
| `proxy.js` | Request proxy (formerly middleware.js) | At project root or `src/` |
| `default.js` | Fallback for unmatched parallel route slots | Returns `null` if no match needed |
| `opengraph-image.js` | Generated OG image | Uses `ImageResponse` |
| `favicon.ico` | Browser tab icon | In root `app/` |
| `robots.txt` | Crawler rules | In root `app/` |
| `sitemap.xml` | SEO sitemap | In root `app/` |

---

## 17. Naming Conventions

### File Names
- **camelCase for all files** — `financeDashboardClient.tsx`, `signInPasswordForm.tsx`, `authContext.ts`
- **Exception — Next.js special files:** `page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`, `global-error.tsx`, `forbidden.tsx`, `providers.tsx`, `route.ts`, `proxy.ts`, `default.tsx`, `template.tsx` — stay lowercase as-is
- **Never use PascalCase for file names** even for component files
- **All new files must use `.ts` or `.tsx`** — never create new `.js` or `.jsx` files

```
// CORRECT
src/components/layout/header.tsx
src/modules/finance/financeDashboardClient.tsx
src/contexts/authContext.ts

// WRONG
src/components/layout/Header.tsx
src/modules/finance/FinanceDashboardClient.tsx
src/modules/finance/financeDashboardClient.jsx  ← ห้ามใช้ .jsx ทั้งเก่าและใหม่
```

### Variable & Constant Names
- **camelCase for all identifiers** — variables, functions, constants
- **Never use UPPER_SNAKE_CASE** for constants — use camelCase

```js
// CORRECT
const sender = { name: "Company", address: "..." }
const statusColors = { active: "success", inactive: "default" }
const urlRegex = /(https?:\/\/[^\s]+)/g

// WRONG
const SENDER = { ... }
const STATUS_COLORS = { ... }
const URL_REGEX = /...
```

### Component / Function Names
- **React components must remain PascalCase** (React treats lowercase as HTML elements)
- The component EXPORT name is PascalCase, but the FILE name is camelCase

```tsx
// file: src/components/layout/header.tsx
export default function Header() {   // ← PascalCase component name (required by React)
  return <nav>...</nav>
}

// import in another file:
import Header from "@/components/layout/header"  // ← camelCase path
```

---

# Project Architecture Pattern (MANDATORY)

## File Structure per Feature

Every new feature MUST follow this exact 3-tier file structure:

### Backend (Go API — `evergreen-api/internal/{module}/`)

| File | Responsibility |
|---|---|
| `store.go` | SQL queries with clean `AS` aliases. Returns `[]map[string]any` via `db.QueryRows()` / `db.QueryRow()` |
| `handler.go` | HTTP handler — calls store, transforms/aggregates data, returns via `response.OK(w, data)` |
| `routes.go` | Register route on Chi router. Mounted in `cmd/server/main.go` as `/api/{module}` |

### Frontend (Next.js — `src/`)

| File | Responsibility |
|---|---|
| `src/app/(main)/{module}/{feature}/page.tsx` | **Server Component** — fetch via `api()` from `@/lib/api.server`, pass `initialData` to Client |
| `src/modules/{module}/{module}{Feature}Client.tsx` | **Client Component** (`"use client"`) — manages state, reload logic, passes data to View |
| `src/modules/{module}/components/{feature}View.tsx` | **View Component** — pure UI, receives data via props, renders tables/charts/forms |
| `src/modules/{module}/types.ts` | **Type definitions** — interface สำหรับ API response, props, และ state ของ module นั้น |

### Example: Adding "Production Entries" feature

```
# Backend
evergreen-api/internal/production/store.go    → add GetEntries() SQL query
evergreen-api/internal/production/handler.go   → add ListEntries() handler
evergreen-api/internal/production/routes.go    → add r.Get("/entries", h.ListEntries)

# Frontend
src/app/(main)/production/entries/page.tsx              → Server Component, fetch + pass initialData
src/modules/production/prodEntriesClient.tsx             → Client Component, state + reload
src/modules/production/components/entriesView.tsx        → View Component, DataTable + filters
src/modules/production/types.ts                          → interface ProductionEntry { ... }
```

## Adding a New Feature — Checklist

Before writing ANY code for a new feature:

1. **Read existing module files first** — understand current patterns in that module
   - `store.go` → see SQL query style, alias patterns
   - `handler.go` → see response structure
   - `routes.go` → see route naming convention
   - Existing Client/View components → see state management pattern

2. **Define the API contract** — list exact field names the frontend needs
   ```
   orderNo, status, itemDescription, quantity, startDate
   ```

3. **Write backend store.go** — SQL with `AS` aliases matching the contract
   ```sql
   SELECT "bcProductionOrderNo" AS "orderNo", ...
   ```

4. **Write backend handler.go** — call store, return via `response.OK(w, data)`

5. **Write backend routes.go** — register the endpoint

6. **Write frontend page.jsx** — Server Component fetch

7. **Write frontend Client.jsx** — state management + reload

8. **Write frontend View.jsx** — UI using exact same field names as API response

9. **Verify field alignment** — ensure field names are IDENTICAL across store.go → handler.go → View.jsx

---

# API Client Usage (MANDATORY)

## Server Component (page.jsx)

```jsx
import { api } from "@/lib/api.server";

export default async function Page() {
  const data = await api("/api/{module}/{endpoint}");
  return <FeatureClient initialData={data || []} />;
}
```

## Client Component (reload/refetch)

```jsx
"use client";
import { get, post } from "@/lib/apiClient";

// GET request
const result = await get("/api/{module}/{endpoint}");

// POST request
const result = await post("/api/{module}/{endpoint}", { body: payload });
```

## Rules

- **Server Component**: use `api()` from `@/lib/api.server`
- **Client Component**: use `get()` / `post()` from `@/lib/apiClient`
- **NEVER use `fetch()` directly** — always use the project helpers above
- **NEVER query Supabase from components** — always go through the Go backend API

---

# UI Component Rules (MANDATORY)

## Libraries

| Purpose | Library | Import |
|---|---|---|
| UI Framework | HeroUI (formerly NextUI) | `import { Button, Input, ... } from "@heroui/react"` |
| Icons | Lucide React | `import { Search, Plus, ... } from "lucide-react"` |
| Toast | Sonner | `import { toast } from "sonner"` |
| Tables | Custom DataTable | `import DataTable from "@/components/ui/dataTable"` |
| Charts | Recharts | `import { BarChart, LineChart, ... } from "recharts"` |

## Rules

- **Do NOT install new UI libraries** without asking the user first
- **Use HeroUI components** for all form elements (Button, Input, Select, Modal, Card, Chip, etc.)
- **Use Lucide icons** — do NOT use other icon libraries
- **Use DataTable** for all tabular data — do NOT create custom table markup
- **Use Sonner toast** for all notifications — `toast.success()`, `toast.error()`

---

# Common Mistakes to Avoid (MANDATORY)

## 1. Using AS Alias in SQL (Most Common Architecture Violation)
**ห้ามใช้ AS alias ใน Go SQL queries — return raw Supabase column names ตรงๆ เสมอ**

```sql
❌ SELECT "bcProductionOrderNo" AS "orderNo"    -- WRONG: rename ทำให้ชื่อไม่ตรง Supabase
✅ SELECT "bcProductionOrderNo"                 -- CORRECT: ชื่อตรงกับ Supabase column
```

```typescript
❌ interface Order { orderNo: string }          // WRONG: ใช้ alias name
✅ interface Order { bcProductionOrderNo: string }  // CORRECT: ใช้ raw column name
```

ผลลัพธ์: Supabase column = Go returns = TypeScript interface = ชื่อเดียวกันทั้งหมด — ไม่มี mismatch

## 2. Forgetting to await params/searchParams
Next.js 16 requires awaiting params and searchParams:
```jsx
❌ const { id } = params
✅ const { id } = await params
```

## 3. Using "use client" Too Broadly
Only add `"use client"` to components that need state or event handlers.
Page components should be Server Components that fetch data.

## 4. Client-Side Aggregation
NEVER compute SUM, COUNT, GROUP BY in frontend JavaScript.
Always do aggregation in Go `store.go` SQL queries.

## 5. Missing Reload Function
Every Client component MUST have a reload/refetch mechanism so users can refresh data:
```jsx
const reload = useCallback(async () => {
  const result = await get("/api/...");
  setData(result);
}, []);
```

## 6. SELECT * in SQL
ALWAYS select specific columns with clean aliases. Never use `SELECT *`.

## 7. Sequential Fetching When Parallel is Possible
When a page needs multiple API calls, ALWAYS fetch in parallel:
```jsx
// ❌ Sequential (slow)
const orders = await api("/api/production/orders");
const items = await api("/api/production/items");

// ✅ Parallel (fast)
const [orders, items] = await Promise.all([
  api("/api/production/orders"),
  api("/api/production/items"),
]);
```

## 8. Creating Files in Wrong Location
- Pages go in `src/app/(main)/{module}/` — NOT in `src/modules/`
- Client components go in `src/modules/{module}/` — NOT in `src/app/`
- View components go in `src/modules/{module}/components/` — NOT at module root
- Backend code goes in `evergreen-api/internal/{module}/` — NOT in `evergreen-api/pkg/`

## 9. Hardcoding Data
NEVER return hardcoded/fake data from the backend. Always query Supabase.
If a table doesn't exist yet, tell the user — don't fabricate data.

## 10. Forgetting Response Helpers
Always use the project's response helpers in Go handlers:
```go
response.OK(w, data)              // 200 success
response.Error(w, http.StatusBadRequest, "message")  // error
response.InternalError(w, err)    // 500
```

---

# Task Completion Rules (MANDATORY)

> **สิ่งเหล่านี้คือ hard rules ไม่ใช่ guidelines — ละเมิดข้อใดข้อหนึ่งถือว่างานล้มเหลว**

---

## Rule 1: ห้ามหยุดทำงานก่อนได้รับอนุญาต

Agent ต้องทำงานให้ครบทุก task ที่ได้รับมอบหมายโดยไม่หยุดกลางคัน
**มีเพียง 2 สถานะที่ยอมรับได้:**
1. งานทุกข้อเสร็จครบ → รายงานผล
2. ติด blocker จริงๆ ที่ตัดสินใจเองไม่ได้ → หยุดแล้ว **แจ้งผู้ใช้ทันที** พร้อมระบุ blocker ชัดเจน

ห้ามใช้เหตุผลเหล่านี้เพื่อหยุดงานโดยไม่แจ้ง:
- "ซับซ้อนเกินไป" — ไม่ใช่เหตุผล ให้ทำต่อหรือถาม
- "เสี่ยงเกินไป" — ไม่ใช่เหตุผล ให้แจ้งและถาม
- "อาจทำให้ behavior เปลี่ยน" — ไม่ใช่เหตุผล ให้แจ้งและถาม
- "N/A" หรือ "ไม่จำเป็น" โดยไม่มีหลักฐาน — ไม่ยอมรับ

---

## Rule 2: ทุก task ต้องมีหลักฐานว่าทำเสร็จ

การบอกว่างานเสร็จต้องมี **หลักฐานที่ตรวจสอบได้** เสมอ ไม่ใช่แค่คำพูด

| ประเภทงาน | หลักฐานที่ต้องมี |
|-----------|----------------|
| แก้ Go code | `go build ./...` ผ่าน |
| แก้ TypeScript | `npx tsc --noEmit` ผ่าน |
| เพิ่ม endpoint | แสดงว่า route ลงทะเบียนแล้ว + handler เรียก store ถูก |
| แก้ frontend | อ่านไฟล์ที่แก้แล้ว verify ว่า old logic ถูกลบออก |
| split component | นับ lines ของไฟล์ต้นทางหลังแก้ว่าลดลงจริง |
| refactor | อ่านไฟล์ใหม่ทั้งหมด ไม่ใช่แค่บอกว่า "เสร็จแล้ว" |

```
❌ WRONG
"เพิ่ม CollectionsMerged endpoint แล้ว ✓"
→ ไม่มีหลักฐานว่า frontend ถูกอัปเดต

✅ CORRECT
"เพิ่ม CollectionsMerged endpoint แล้ว
อ่าน collectionsClient.tsx บรรทัด 38-101 → useMemo merge ถูกลบออกแล้ว
ไฟล์ลดจาก 308 → 187 lines
go build ผ่าน, tsc ผ่าน ✓"
```

---

## Rule 3: งาน backend+frontend ต้องครบทั้ง 2 ฝั่งเสมอ

เมื่อได้รับงานที่เกี่ยวกับ data flow ต้องทำ **ทุกไฟล์ในห่วงโซ่**:

```
store.go  →  handler.go  →  routes.go  →  page.tsx  →  Client.tsx  →  types.ts
```

ห้ามหยุดกลางห่วงโซ่ ถ้าทำ store.go แล้ว ต้องทำ handler → routes → frontend ด้วย

```
❌ WRONG — ทำครึ่งเดียวแล้วรายงานว่าเสร็จ
store.go ✓  handler.go ✓  routes.go ✓
(frontend ยังเรียก endpoint เดิมอยู่ — ไม่มีใครรู้)

✅ CORRECT — ครบ chain
store.go ✓  handler.go ✓  routes.go ✓
collectionsClient.tsx ✓ (endpoint เปลี่ยนแล้ว, useMemo merge ลบแล้ว)
types.ts ✓ (interface อัปเดตแล้ว)
```

---

## Rule 4: ห้ามประเมินสถานะจากการมีอยู่ของไฟล์

ต้อง **อ่าน content จริง** เพื่อ verify — ห้ามสรุปจากชื่อไฟล์หรือ directory structure

```
❌ WRONG
ls components/ → bomView.tsx มีอยู่
→ สรุป: "structure ถูกต้องแล้ว, split เสร็จแล้ว"

✅ CORRECT
wc -l bomClient.tsx → 1,578 lines
→ สรุป: "bomClient ยังใหญ่อยู่ ต้องทำต่อ"
```

---

## Rule 5: ห้ามตีความ task ให้แคบกว่าที่สั่ง

เมื่อได้รับคำสั่ง เช่น "ทำทั้งหมด" หรือ "ทำให้เสร็จ" หมายถึง **ทุกข้อ** ในขอบเขตนั้น
ห้ามตีความว่า "ทำแค่ส่วนที่ง่าย" หรือ "ทำแค่ส่วนที่แน่ใจ"

ถ้าไม่แน่ใจว่า scope ครอบคลุมถึงไหน → **ถามก่อนทำ** ไม่ใช่ทำแค่ส่วนที่เดาว่าต้องการ

---

## Rule 6: blocker ต้องแจ้งทันที ไม่ใช่ข้ามเงียบๆ

ถ้าเจอสิ่งที่ทำไม่ได้จริงๆ (missing schema, external system, ambiguous requirement):

**รูปแบบการแจ้ง blocker ที่ถูกต้อง:**
```
🚫 BLOCKED: [ชื่อ task]
สาเหตุ: [อธิบายชัดเจนว่าติดเรื่องอะไร]
ต้องการ: [สิ่งที่ต้องการจากผู้ใช้เพื่อดำเนินการต่อ]
ทางเลือก: [option A] หรือ [option B]
```

ห้าม:
- ข้ามงานโดยไม่แจ้ง
- เขียนหมายเหตุสั้นๆ แล้วทำงานต่อราวกับว่าไม่มีอะไรเกิดขึ้น
- รอให้ผู้ใช้ถามเองว่า task นั้นเสร็จหรือยัง

---

## Rule 7: Verification ก่อน commit เสมอ

ก่อน commit ทุกครั้ง ต้องรัน:
```bash
# Go changes
cd evergreen-api && go build ./...

# TypeScript changes
cd evergreen && npx tsc --noEmit
```

ถ้า error → แก้ให้ผ่านก่อน ห้าม commit code ที่ build ไม่ผ่าน

---

# Enterprise Scale Rules (MANDATORY)

> ระบบนี้มีผู้ใช้งานระดับองค์กร 100+ คน และลูกค้าภายนอกอีกหลายหมื่นคน
> กฏชุดนี้บังคับใช้กับทุก feature ที่สร้างใหม่หรือแก้ไข — ไม่มีข้อยกเว้น

---

## E1: Pagination บังคับสำหรับทุก list endpoint

ทุก endpoint ที่ return list ต้องรองรับ pagination เสมอ — ห้าม return ทุก row โดยไม่จำกัด

```go
// ✅ CORRECT — Backend support pagination
func (s *Store) ListLeads(ctx context.Context, limit, offset int) ([]map[string]any, error) {
    return db.QueryRows(ctx, s.pool, `
        SELECT "salesLeadId", "salesLeadTitle", "salesLeadStatus"
        FROM "salesLead"
        WHERE "isActive" = true
        ORDER BY "salesLeadCreatedAt" DESC
        LIMIT $1 OFFSET $2
    `, limit, offset)
}

// Handler reads from query params
func (h *Handler) ListLeads(w http.ResponseWriter, r *http.Request) {
    limit := queryInt(r, "limit", 50)   // default 50
    offset := queryInt(r, "offset", 0)
    data, err := h.store.ListLeads(r.Context(), limit, offset)
    // ...
}
```

```typescript
// ✅ CORRECT — Frontend pagination controls
const [page, setPage] = useState(1)
const limit = 50
const offset = (page - 1) * limit
const { data } = useSWR(`/api/sales/leads?limit=${limit}&offset=${offset}`, fetcher, {
  revalidateOnFocus: false,
})
```

กฏ:
- Default limit = 50 (user-facing tables) หรือ 100 (admin/internal tables)
- Maximum limit = 500 (ห้ามเกิน)
- ทุก list response ควร include `total` count เพื่อให้ frontend แสดง pagination controls

---

## E2: Loading / Error / Empty state บังคับทุก async operation

ทุก component ที่ fetch ข้อมูล async ต้องมีครบทั้ง 3 state — ห้าม render แต่ data เฉยๆ

```typescript
// ✅ CORRECT — ครบ 3 state
const { data, error, isLoading } = useSWR('/api/finance/collections', fetcher, {
  revalidateOnFocus: false,
})

if (isLoading) return <TableSkeleton rows={10} />           // Loading state
if (error) return <ErrorState message="โหลดข้อมูลไม่สำเร็จ" onRetry={mutate} />  // Error state
if (!data || data.length === 0) return <EmptyState />        // Empty state

return <CollectionsView data={data} />                        // Data state
```

**Loading State:**
- ใช้ Skeleton UI เสมอ — ห้ามใช้ spinner กลางหน้าเดียวๆ สำหรับ table content
- Skeleton ต้องมี shape เหมือน content จริง (table rows, cards, etc.)

**Error State:**
- แสดงข้อความที่ user เข้าใจ (ภาษาไทย)
- มีปุ่ม "ลองใหม่" เสมอ — เรียก `mutate()` หรือ reload function
- ห้าม expose raw error message จาก server ให้ user เห็น

**Empty State:**
- อธิบายว่าทำไมถึงไม่มีข้อมูล ("ยังไม่มีรายการ", "ไม่พบผลการค้นหา")
- เพิ่ม call-to-action ถ้าเหมาะสม ("+ เพิ่มรายการแรก")

---

## E3: Input validation ต้องครบทั้ง frontend และ backend

ห้าม validate เฉพาะฝั่งใดฝั่งหนึ่ง — ต้องมีทั้งคู่เสมอ

**Frontend validation (ก่อน submit):**
```typescript
// ✅ CORRECT — validate ก่อน call API
const handleSubmit = async () => {
  if (!formData.title?.trim()) {
    toast.error("กรุณากรอกชื่อ")
    return
  }
  if (formData.amount <= 0) {
    toast.error("จำนวนเงินต้องมากกว่า 0")
    return
  }
  await post("/api/finance/collections", formData)
}
```

**Backend validation (ใน handler):**
```go
// ✅ CORRECT — validate ใน Go handler ก่อนส่งไป store
func (h *Handler) CreateCollection(w http.ResponseWriter, r *http.Request) {
    var body map[string]any
    json.NewDecoder(r.Body).Decode(&body)

    title, _ := body["title"].(string)
    if strings.TrimSpace(title) == "" {
        response.Error(w, http.StatusBadRequest, "title is required")
        return
    }
    // proceed to store...
}
```

กฏ:
- Field ที่ required → ต้อง validate ทั้ง 2 ฝั่ง
- ตัวเลขการเงิน → validate range (ไม่ติดลบ, ไม่เกิน limit ที่สมเหตุสมผล)
- String fields → TrimSpace + check empty
- UUID/ID fields → validate format ก่อน query DB

---

## E4: Virtual scrolling / windowing สำหรับ dataset ขนาดใหญ่

ถ้า list มีมากกว่า 500 rows ที่แสดงพร้อมกัน ต้องใช้ virtual scrolling หรือ server-side pagination

```typescript
// ❌ WRONG — render 5000 rows พร้อมกัน = browser freeze
return (
  <tbody>
    {data.map(row => <tr key={row.id}>...</tr>)}  // 5000 rows
  </tbody>
)

// ✅ CORRECT — ตัวเลือก 1: Server-side pagination (preferred)
// แสดงทีละ 50 rows, มี pagination controls

// ✅ CORRECT — ตัวเลือก 2: Virtual scrolling ถ้า UX ต้องการ scroll ต่อเนื่อง
// ใช้ @tanstack/react-virtual หรือ react-window
```

---

## E5: Optimistic updates สำหรับ mutation ที่ไม่ต้องการ server confirmation

สำหรับ action ที่ user คาดหวังว่าจะ "ทำทันที" (เช่น toggle status, เพิ่ม tag, mark as read):

```typescript
// ✅ CORRECT — optimistic update
const handleToggleStatus = async (id: string, newStatus: string) => {
  // 1. Update UI ทันที
  setData(prev => prev.map(item =>
    item.id === id ? { ...item, status: newStatus } : item
  ))

  try {
    await post(`/api/sales/leads/${id}/status`, { status: newStatus })
    toast.success("อัปเดตสถานะแล้ว")
  } catch {
    // 2. Revert ถ้า error
    setData(prev => prev.map(item =>
      item.id === id ? { ...item, status: item.status } : item  // revert
    ))
    toast.error("อัปเดตไม่สำเร็จ กรุณาลองใหม่")
  }
}
```

ใช้ optimistic update กับ: status toggle, checkbox, star/favorite, archive, mark as read
ห้ามใช้ optimistic update กับ: financial transactions, delete, อะไรก็ตามที่ต้อง server-side validation จริงจัง

---

## E6: UX Standards — Confirmation, Toast, Skeleton

### Confirmation dialogs (บังคับ)
ทุก destructive action ต้องมี confirmation dialog ก่อนดำเนินการ:
- Delete (ลบ, ยกเลิก, ปิด)
- Action ที่ย้อนกลับไม่ได้
- Action ที่กระทบหลายรายการพร้อมกัน

```typescript
// ✅ CORRECT
const handleDelete = async () => {
  const confirmed = await confirm({
    title: "ยืนยันการลบ",
    message: `ต้องการลบ "${item.title}" ใช่หรือไม่? ไม่สามารถย้อนกลับได้`,
    confirmLabel: "ลบ",
    cancelLabel: "ยกเลิก",
    danger: true,
  })
  if (!confirmed) return
  await deleteItem(item.id)
}
```

### Toast notifications (บังคับ)
ทุก mutation ต้องมี toast feedback:
- Success: `toast.success("บันทึกเรียบร้อย")`
- Error: `toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")`
- Loading: `toast.loading("กำลังบันทึก...")` → dismiss แล้วแสดง success/error

ห้ามปล่อยให้ user submit form โดยไม่มี feedback ใดๆ

### Skeleton loading (บังคับ)
ห้ามใช้ blank screen ขณะโหลด:
- Table: แสดง skeleton rows (เดียวกับจำนวน rows ที่คาดว่าจะมี)
- Cards: แสดง skeleton cards
- Number/KPI: แสดง placeholder สีเทา

---

## E7: Query และ Request Timeout

ทุก DB query และ HTTP request ต้องมี timeout เพื่อป้องกัน resource leak

**Backend — DB query timeout:**
```go
// ✅ CORRECT — ทุก handler ควรมี context timeout
func (h *Handler) ListData(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
    defer cancel()

    data, err := h.store.ListData(ctx)
    if err != nil {
        if errors.Is(err, context.DeadlineExceeded) {
            response.Error(w, http.StatusGatewayTimeout, "query timeout")
            return
        }
        response.InternalError(w, err)
        return
    }
    response.OK(w, data)
}
```

**Frontend — API call timeout:**
```typescript
// ✅ CORRECT — ใช้ AbortController กับ fetch ที่ใช้เวลานาน
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 15000)  // 15s

try {
  const res = await fetch(url, { signal: controller.signal })
  clearTimeout(timeoutId)
  return await res.json()
} catch (err) {
  if (err.name === 'AbortError') throw new Error('Request timeout')
  throw err
}
```

กฏ timeout:
- Simple list query: 15 วินาที
- Complex aggregation query: 30 วินาที
- Dashboard (parallel queries): 45 วินาที
- ห้ามใช้ query ที่ไม่มี timeout ใน production

---

## E8: Response Size Control

ป้องกัน response ขนาดใหญ่ที่ทำให้ browser ช้าและ bandwidth สูง

กฏ:
- List endpoints: ต้องมี LIMIT เสมอ (ดู Backend SQL Rule 6)
- Dashboard endpoints: return เฉพาะ aggregated KPIs — ห้าม return raw rows ไปคำนวณที่ frontend
- Nested data: ใช้ `?expand=true` query param เพื่อ opt-in — default ไม่ต้อง expand
- Binary/base64: ห้าม embed image/file ใน JSON response — ใช้ URL แทน

**Target response sizes:**
| Endpoint Type | Max Size |
|---|---|
| Dashboard KPIs | < 10 KB |
| List (50 rows) | < 100 KB |
| Single record detail | < 50 KB |
| Report/export | stream หรือ background job |

---

## E9: Accessibility และ UX ขั้นต่ำ

ระบบที่มีผู้ใช้หลาย 100 คนต้องใช้งานได้โดยไม่ต้องฝึก

### Navigation clarity
- ทุกหน้าต้องมี breadcrumb หรือ page title ที่ชัดเจน
- Active state ใน sidebar ต้องชัด — user รู้ว่าตัวเองอยู่ที่ไหน
- Back navigation ต้องทำงานถูกต้องเสมอ

### Form UX
- Label ทุก input field ชัดเจน (ภาษาไทย)
- Required fields มีเครื่องหมาย `*`
- Error message แสดงที่ field นั้นๆ ไม่ใช่แค่ toast
- Submit button disabled ขณะ loading — ป้องกัน double-submit

### Table UX
- Column ที่ sort ได้ต้องมี visual indicator
- ถ้า row count > 0 ต้องแสดงจำนวนทั้งหมด เช่น "แสดง 1-50 จาก 234 รายการ"
- Search/filter ต้อง debounce ≥ 300ms — ห้าม fire ทุก keystroke

### Mobile considerations
- Layout ต้องใช้งานได้บน tablet (iPad) เป็นอย่างน้อย
- Font size ≥ 14px สำหรับ body text
- Touch targets ≥ 44x44px สำหรับ buttons และ interactive elements

---

## E10: Security Headers และ API Protection

**Rate limiting awareness:**
- Frontend ต้องไม่ fire API call ซ้ำโดยไม่จำเป็น (ดู revalidateOnFocus: false)
- Search/autocomplete ต้อง debounce ≥ 300ms
- Polling interval ต้องไม่สั้นกว่า 30 วินาที สำหรับ non-critical data

**Auth boundary:**
- ทุก sensitive route ใน Next.js ต้องเช็ค session ใน `proxy.ts` หรือ Server Component
- ห้าม rely เฉพาะ frontend redirect — backend ต้อง enforce ด้วยเสมอ (ดู S3)

**Data exposure:**
- ห้าม log ข้อมูล sensitive (password, token, เลขบัตร, เลขบัญชี) ไม่ว่าใน frontend หรือ backend
- Error response ที่ส่งไปยัง client ต้องไม่มี stack trace หรือ query string ใน production

---

## E11: Performance Budget

เป้าหมาย performance ที่ทุก feature ต้องผ่านก่อน release:

| Metric | Target |
|---|---|
| Page initial load (dashboard) | < 3 วินาที บน 4G |
| List page render (50 rows) | < 1 วินาที |
| API response time (simple list) | < 500ms |
| API response time (complex aggregation) | < 2000ms |
| Time to interactive (TTI) | < 5 วินาที |

วิธีตรวจสอบ:
- Chrome DevTools Network tab — ดู response time
- React DevTools Profiler — ดู render time
- ถ้า API > 2 วินาที → ต้องเพิ่ม index หรือ optimize query ก่อน release

---

## E12: Checklist ก่อน release feature ใหม่

ทุก feature ใหม่ต้องผ่าน checklist นี้ก่อน merge:

**Performance**
- [ ] List endpoint มี pagination หรือ LIMIT ที่เหมาะสม
- [ ] ไม่มี N+1 query (ดู query plan ถ้าสงสัย)
- [ ] Dashboard handler ใช้ errgroup สำหรับ parallel queries
- [ ] API response < 500ms สำหรับ typical load

**UX/UI**
- [ ] มี Loading skeleton (ไม่ใช่ blank screen)
- [ ] มี Error state พร้อมปุ่ม retry
- [ ] มี Empty state พร้อมคำอธิบาย
- [ ] Destructive actions มี confirmation dialog
- [ ] Mutations มี toast feedback (success + error)
- [ ] Form มี validation message ที่ field

**Safety**
- [ ] ทุก endpoint ผ่าน auth middleware (S3)
- [ ] ไม่มี SQL injection risk (S5)
- [ ] ไม่มี float64 ในการคำนวณการเงิน (S1)
- [ ] Error ไม่หายเงียบ (S6)

**Code Quality**
- [ ] `go build ./...` ผ่าน
- [ ] `npx tsc --noEmit` ผ่าน
- [ ] ไม่มี `any` ที่ไม่มี comment
- [ ] Types ตรงกับ Go response ทุก field
