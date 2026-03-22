# Evergreen — Optimization & Audit Plan

> วันที่ทำ audit: 2026-03-22
> สถานะ: Round 1–3 เสร็จแล้ว (commits ba29346, 05f1721, 2aad333)
> เอกสารนี้ครอบคลุม **ทุก layer** — SQL → Go → Next.js

---

## สรุปสิ่งที่ทำแล้ว (Completed)

| Commit | งานที่ทำ |
|--------|----------|
| `ba29346` | Auth cache eviction · RBAC N+1 fix · Production dashboard parallel · ILE date filter · TMS/Finance pagination |
| `05f1721` | HR/Sales/Warehouse dashboard parallel · BC table LIMITs (5k/30k/500) |
| `2aad333` | Marketing Analytics 14 queries parallel · IT Dashboard parallel · Marketing/Finance store LIMITs |

---

## Round 4 — Backend SQL: Missing LIMITs

ยังมี queries ที่ไม่มี LIMIT และอาจ scan ทั้ง table

### 4.1 Production store — queries ไม่มี LIMIT

**ไฟล์**: `evergreen-api/internal/production/store.go`

| Function | Table | ปัญหา | LIMIT ที่แนะนำ |
|----------|-------|-------|---------------|
| `GetProductionOrders` | `bcProductionOrder` | ไม่มี LIMIT | `LIMIT 2000` |
| `GetConsumptionCosts` | `bcItemLedgerEntry` | ไม่มี LIMIT (bc table ใหญ่) | `LIMIT 5000` |
| `GetSalesPriceMap` | `bcSalesPrice` | ไม่มี LIMIT | `LIMIT 10000` |
| `GetDimensionNames` | `bcDimension` | ไม่มี LIMIT | `LIMIT 1000` |
| `ListCores` | `bcItem` (filtered) | ไม่มี LIMIT | `LIMIT 5000` |
| `ListFrames` | `bcItem` (filtered) | ไม่มี LIMIT | `LIMIT 5000` |
| `FgCoverage` | `bcItem` JOIN `bcProductionOrder` | ไม่มี LIMIT | `LIMIT 3000` |

**วิธีแก้**: เพิ่ม `LIMIT n` ก่อน closing `` ` `` ของแต่ละ query

---

### 4.2 Omnichannel store — queries ไม่มี LIMIT

**ไฟล์**: `evergreen-api/internal/marketing/omnichannel/store.go`

| Function/Query | Table | ปัญหา | LIMIT ที่แนะนำ |
|----------------|-------|-------|---------------|
| `ListConversations` | `mktConversation` | ไม่มี LIMIT | `LIMIT 500` |
| `ListQuotations` | `mktQuotation` | ไม่มี LIMIT | `LIMIT 500` |
| `ListPromotions` | `mktPromotion` | ไม่มี LIMIT | `LIMIT 200` |
| `ListRelatedProducts` | `mktRelatedProduct` | ไม่มี LIMIT | `LIMIT 500` |
| `ListStockItems` | `bcItem` | ไม่มี LIMIT (bc ใหญ่!) | `LIMIT 10000` |
| `ListProductInfo` | `mktProductInfo` | ไม่มี LIMIT | `LIMIT 5000` |

---

### 4.3 Sales store — List queries ไม่มี LIMIT

**ไฟล์**: `evergreen-api/internal/sales/store.go`

| Function | Table | LIMIT ที่แนะนำ |
|----------|-------|---------------|
| `ListLeads` | `salesLead` | `LIMIT 500` |
| `ListContacts` | `salesContact` | `LIMIT 1000` |
| `ListOpportunities` | `salesOpportunity` | `LIMIT 500` |
| `ListAccounts` | `salesAccount` | `LIMIT 1000` |
| `ListActivities` | `salesActivity` | `LIMIT 500` |

---

### 4.4 HR store — ไม่มี LIMIT

**ไฟล์**: `evergreen-api/internal/hr/store.go`

| Function | Table | LIMIT ที่แนะนำ |
|----------|-------|---------------|
| `ListEmployees` | `hrEmployee` | `LIMIT 2000` |
| `ListAllEmployees` | `hrEmployee` | `LIMIT 2000` |
| `ListDivisions` | `hrDivision` | `LIMIT 200` |
| `ListDepartments` | `hrDepartment` | `LIMIT 200` |
| `ListPositions` | `hrPosition` | `LIMIT 200` |

---

## Round 5 — Frontend: SWR Config ที่ขาดหาย

SWR ที่ไม่มี `revalidateOnFocus: false` จะ refetch ทุกครั้งที่ user กลับมาที่ tab → API load ไม่จำเป็น

### 5.1 Files ที่ต้องเพิ่ม SWR options

**Pattern ที่ถูก:**
```typescript
const { data, isLoading, mutate } = useSWR<T>(key, fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60_000,  // 1 นาที (ปรับตาม use case)
});
```

| ไฟล์ | line | SWR call | สิ่งที่ขาด |
|------|------|----------|-----------|
| `src/modules/sales/bciProjectsClient.tsx` | 10 | `useSWR<BciProject[]>(...)` | `revalidateOnFocus: false`, `dedupingInterval` |
| `src/modules/tms/deliveriesClient.tsx` | 67 | `useSWR<TmsDelivery[]>(...)` | `revalidateOnFocus: false` |
| `src/modules/tms/deliveriesClient.tsx` | 68 | `useSWR<TmsShipment[]>(...)` | `revalidateOnFocus: false` |
| `src/modules/tms/shipmentsClient.tsx` | 98 | `useSWR<TmsShipment[]>(...)` | `revalidateOnFocus: false` |
| `src/modules/tms/shipmentsClient.tsx` | 99 | `useSWR<TmsVehicle[]>(...)` | `revalidateOnFocus: false` |
| `src/modules/tms/shipmentsClient.tsx` | 100 | `useSWR<unknown[]>(...)` (hr/employees) | `revalidateOnFocus: false` |
| `src/modules/production/bomClient.tsx` | 1195 | `useSWR("/api/production/frames", ...)` | `revalidateOnFocus: false` |
| `src/modules/production/bomClient.tsx` | 1199 | `useSWR("/api/production/cores", ...)` | `revalidateOnFocus: false` |
| `src/modules/production/components/fgCoverageView.tsx` | 61 | `useSWR(...)` | `revalidateOnFocus: false` |
| `src/modules/marketing/salesOrderDetailClient.tsx` | 18 | `useSWR<{order, customerPhone}>(...)` | `revalidateOnFocus: false` |
| `src/modules/marketing/omnichannelQuotationEditorClient.tsx` | 21 | `useSWR<MktQuotation>(...)` | `revalidateOnFocus: false` |

**หมายเหตุ**: `trackingClient.tsx` มี `refreshInterval: 30000` อยู่แล้ว (GPS tracking ต้อง poll) แต่ควรเพิ่ม `revalidateOnFocus: false` ด้วย เพื่อป้องกัน double-fetch ตอนกลับมาที่ tab

---

### 5.2 Type Safety — `unknown[]` ใน shipmentsClient

**ไฟล์**: `src/modules/tms/shipmentsClient.tsx` line 100
```typescript
// ❌ ปัจจุบัน
const { data: employeesData } = useSWR<unknown[]>("/api/hr/employees", employeeFetcher);

// ✅ ควรเป็น — import HrEmployee จาก hr types
const { data: employeesData } = useSWR<HrEmployee[]>("/api/hr/employees", employeeFetcher, {
  revalidateOnFocus: false,
});
```

---

## Round 6 — Backend: Computation ย้ายจาก Frontend → Backend

### 6.1 Collections — Merge aged receivables + follow-ups ที่ backend

**ปัญหา**: `src/modules/finance/collectionsClient.tsx` lines 60–91 ทำ client-side merge ระหว่าง `agedReceivables` กับ `followUps` ใน `useMemo`

```typescript
// ❌ ปัจจุบัน — merge ใน frontend
const merged = useMemo(() => {
  return agedReceivables.map(ar => {
    const followUp = followUps.find(f => f.customerNo === ar.customerNo);
    return { ...ar, followUp };
  });
}, [agedReceivables, followUps]);
```

**วิธีแก้**:
1. เพิ่ม endpoint ใหม่ `GET /api/finance/collections` ใน Go
2. Go handler ทำ LEFT JOIN `bcCustomerLedgerEntry` + `financeCollection` ใน SQL เดียว
3. Frontend fetch endpoint เดียว ไม่ต้อง merge เอง

**ไฟล์ที่ต้องแก้**:
- `evergreen-api/internal/finance/store.go` — เพิ่ม `ListCollections()` with JOIN
- `evergreen-api/internal/finance/handler.go` — เพิ่ม `Collections()` handler
- `evergreen-api/internal/finance/routes.go` — เพิ่ม route
- `src/modules/finance/collectionsClient.tsx` — เปลี่ยนเป็น single fetch, ลบ useMemo merge

---

### 6.2 Finance Dashboard — ย้าย GL computation ไป backend

**ปัญหา**: `src/modules/finance/financeDashboardClient.tsx` (1,088 lines) มี `useMemo` หลายชั้นที่ทำ:
- GL account mapping
- PnL calculation
- COGS override aggregation
- Budget vs actual comparison

ทั้งหมดนี้คำนวณใน browser ทุกครั้งที่ render — ช้า และ error-prone

**วิธีแก้**:
1. เพิ่ม endpoint `GET /api/finance/dashboard/summary` ที่ return aggregated KPIs พร้อมใช้
2. Backend ทำ SQL aggregation: `SUM`, `GROUP BY gl_account_category`, period filter
3. Frontend รับ computed data ตรงๆ ไม่ต้อง transform

---

## Round 7 — Architecture: Component Splitting

### 7.1 bomClient.tsx (1,578 lines) → แยกออกเป็น sub-components

**ปัญหา**: Component เดียวมีทั้ง:
- BOM list + search/filter logic
- BOM form (create/edit)
- BOM detail modal
- Frames/Cores management
- 2x useSWR calls

**วิธีแก้**: แยกเป็น
```
src/modules/production/
├── bomClient.tsx          ← state orchestration เท่านั้น (~150 lines)
├── components/
│   ├── bomView.tsx        ← DataTable + filters
│   ├── bomForm.tsx        ← Create/Edit form
│   ├── bomDetail.tsx      ← Detail modal
│   └── bomFramesCores.tsx ← Frames/Cores management
```

---

## Round 8 — Database: Missing Indexes

ต้องตรวจสอบใน Supabase Dashboard ว่า columns ที่ใช้บ่อยมี index แล้วหรือยัง

### Columns ที่น่าจะขาด index (based on queries found):

| Table | Column | ใช้ใน |
|-------|--------|-------|
| `bcItemLedgerEntry` | `bcItemLedgerEntryPostingDate` | WHERE date filter (production store) |
| `bcItemLedgerEntry` | `bcItemLedgerEntryEntryType` | WHERE clause |
| `bcCustomerLedgerEntry` | `bcCustomerLedgerEntryOpenValue` | WHERE clause (agedReceivables) |
| `bcVendorLedgerEntry` | `bcVendorLedgerEntryOpenValue` | WHERE clause (agedPayables) |
| `mktConversation` | `mktConversationLastMessageAt` | ORDER BY |
| `mktMessage` | `mktMessageConversationId` + `mktMessageCreatedAt` | WHERE + ORDER BY |
| `salesLead` | `salesLeadCreatedAt` | ORDER BY |
| `salesOpportunity` | `salesOpportunityStage` | GROUP BY |
| `tmsShipment` | `tmsShipmentCreatedAt` | ORDER BY |
| `tmsDelivery` | `tmsDeliveryCreatedAt` | ORDER BY |

**วิธีตรวจ**: รัน query นี้ใน Supabase SQL Editor:
```sql
SELECT
  schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN (
  'bcItemLedgerEntry', 'bcCustomerLedgerEntry', 'bcVendorLedgerEntry',
  'mktConversation', 'mktMessage', 'salesLead', 'tmsShipment', 'tmsDelivery'
)
ORDER BY tablename, indexname;
```

**Migration pattern**:
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bcile_posting_date
  ON "bcItemLedgerEntry" ("bcItemLedgerEntryPostingDate");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bcile_entry_type
  ON "bcItemLedgerEntry" ("bcItemLedgerEntryEntryType");
```
> ใช้ `CONCURRENTLY` เพื่อไม่ lock table ระหว่าง create

---

## Round 9 — Go: Connection Pool Tuning

**ไฟล์**: `evergreen-api/cmd/server/main.go` หรือ `pkg/db/`

ตรวจสอบ `pgxpool.Config`:

```go
// ควรตั้ง ถ้ายังไม่ได้ตั้ง
poolConfig.MaxConns = 20              // default 4 — เพิ่มสำหรับ concurrent requests
poolConfig.MinConns = 5               // keep warm connections
poolConfig.MaxConnIdleTime = 30 * time.Minute
poolConfig.HealthCheckPeriod = 1 * time.Minute
```

---

## Round 10 — Frontend: Server Component Caching

`src/lib/api.server.ts` รองรับ `revalidate` param แล้ว แต่ยังไม่ได้ใช้ใน pages ที่ข้อมูลเปลี่ยนช้า

### Pages ที่ควร revalidate:

| Page | Endpoint | Recommended revalidate |
|------|----------|----------------------|
| `hr/employees/page.tsx` | `/api/hr/employees` | `3600` (1 ชม.) |
| `hr/divisions/page.tsx` | `/api/hr/divisions` | `86400` (1 วัน) |
| `hr/departments/page.tsx` | `/api/hr/departments` | `86400` |
| `hr/positions/page.tsx` | `/api/hr/positions` | `86400` |
| `bc/customers/page.tsx` | `/api/bc/customers` | `1800` (30 นาที) |
| `bc/items/page.tsx` | `/api/bc/items` | `1800` |

**วิธีใช้** (ใน page.tsx):
```typescript
const data = await api("/api/hr/divisions", undefined, { revalidate: 86400 });
```

---

## สรุปรวม — Priority Matrix

### 🔴 High (ทำก่อน — impact สูง, ง่าย)
| # | งาน | ไฟล์ | เวลาประมาณ |
|---|-----|------|------------|
| 4.1 | LIMIT ใน production store (7 queries) | production/store.go | 15 นาที |
| 4.3 | LIMIT ใน sales store (5 queries) | sales/store.go | 10 นาที |
| 4.4 | LIMIT ใน HR store (5 queries) | hr/store.go | 10 นาที |
| 5.1 | SWR revalidateOnFocus ใน 11 ไฟล์ | หลายไฟล์ | 20 นาที |
| 5.2 | แก้ `unknown[]` → `HrEmployee[]` | shipmentsClient.tsx | 5 นาที |

### 🟡 Medium (ทำหลัง — impact สูง, ซับซ้อนกว่า)
| # | งาน | ไฟล์ | เวลาประมาณ |
|---|-----|------|------------|
| 4.2 | LIMIT ใน omnichannel store (6 queries) | omnichannel/store.go | 15 นาที |
| 6.1 | ย้าย collections merge → backend endpoint | finance/store+handler+routes + collectionsClient | 45 นาที |
| 8 | สร้าง indexes ใน Supabase | SQL migration | 20 นาที |
| 9 | Tune pgxpool connection config | db package | 10 นาที |
| 10 | Server Component caching ใน slow pages | 6 page files | 15 นาที |

### 🟢 Low (ทำทีหลัง — quality improvement)
| # | งาน | ไฟล์ | เวลาประมาณ |
|---|-----|------|------------|
| 6.2 | ย้าย finance dashboard computation → backend | finance store+handler + dashboard client | 2-3 ชม. |
| 7.1 | Split bomClient.tsx (1,578 lines) | production module | 2 ชม. |

---

## Checklist ก่อน Commit แต่ละ Round

```bash
# Backend
cd evergreen-api && go build ./...

# Frontend
cd evergreen && npx tsc --noEmit
```

---

## หมายเหตุ — สิ่งที่ไม่ต้องแก้

- `trackingClient.tsx` — `refreshInterval: 30000` ถูกต้องสำหรับ GPS (เพิ่มแค่ revalidateOnFocus: false)
- `rbac/store.go` — `SELECT * FROM get_user_permissions(...)` เป็น PostgreSQL function call ไม่ใช่ SELECT * จาก table ตรงๆ ปกติดี
- `omnichannelClient.tsx` — Realtime subscription ผ่าน Supabase channel (`supabase.channel(...)`) ถูกต้อง ไม่ใช่ direct data query
- `analyticsClient.tsx` — มี SWR config ครบแล้ว (`revalidateOnFocus: false` ใน options)
- `salesReportsClient.tsx` — มี `revalidateOnFocus: false` ใน options แล้ว
