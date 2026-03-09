# Data Flow - EverGreen ERP

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│  │AuthContext│  │RBACContext│  │  Modules   │  │  ChatBot  │ │
│  │(Supabase)│  │(Permission│  │(hooks/view)│  │  (SSE)    │ │
│  └────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘ │
│       │              │              │               │        │
│       └──────────────┴──────┬───────┴───────────────┘        │
│                             │ apiClient (fetch)              │
└─────────────────────────────┼────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Next.js API Routes │
                    │   withAuth() guard  │
                    └──┬──────┬──────┬───┘
                       │      │      │
            ┌──────────▼┐ ┌──▼────┐ ┌▼──────────────┐
            │  Supabase  │ │  BC   │ │  OpenRouter AI │
            │ (PostgreSQL│ │(OData)│ │ (Gemini 2.5)   │
            │  + Auth)   │ │      │ │                │
            └────────────┘ └──────┘ └────────────────┘
```

---

## 1. Authentication Flow

```
User (email/password or PIN)
  ↓
supabase.auth.signInWithPassword() / verifyOtp()
  ↓
Supabase returns JWT (access_token + refresh_token)
  ↓
AuthContext stores user, starts 30-min inactivity timer
  ↓
RBACContext loads permissions via RPC: get_user_permissions()
  ↓
Redirect → /overview/dashboard
```

- **Session check**: ทุก 60 วินาที validate session
- **Auto-logout**: ไม่มี activity 30 นาที → sign out
- **Token refresh**: Supabase SSR จัดการ cookie อัตโนมัติ

---

## 2. Data Fetching Pattern (ทุก Module)

```
Page Component ("use client")
  ↓
Custom Hook (useEmployees, useBcCustomers, ...)
  ↓  useState + useEffect
Module Action (actions.js)
  ↓  get("/api/hr/employees")
apiClient.js (fetch wrapper)
  ↓  HTTP Request
API Route Handler
  ↓  withAuth() → verify session/token
Supabase Query
  ↓  .from("table").select("*")
Response JSON → Hook state → Re-render
```

**ไม่ใช้**: Server Components, Server Actions, SWR, React Query, Redux

---

## 3. CRUD Operations

| Operation  | Client              | API                  | Database                                    |
| ---------- | ------------------- | -------------------- | ------------------------------------------- |
| **Read**   | `useXxx()` hook     | `GET` + `withAuth()` | `.select("*")` + filter by `isActive`       |
| **Create** | `createXxx(data)`   | `POST` + `withAuth()`| `.insert([body]).select()`                  |
| **Update** | `updateXxx(id,data)`| `PUT` + `withAuth()` | `.update(body).eq("id", id)`                |
| **Delete** | `deleteXxx(id)`     | `DELETE`+`withAuth()`| `.update({ isActive: false })` (Soft delete)|

---

## 4. RBAC Permission Flow

```
RBACContext (mount)
  ↓
GET /api/rbac/userPermissions/[userId]
  ↓
Supabase RPC: get_user_permissions(userId)
  ↓
Returns: [{ permission: "hr:read" }, { permission: "sales:write" }, ...]
  ↓
Context provides:
  • hasPermission("hr:read") → boolean
  • hasModuleAccess("sales") → boolean
  • isSuperAdmin → bypass ทุกอย่าง

API Level:
  • withAuth() → { supabase, session, isSuperAdmin }
  • Non-admin: query.eq("isActive", true)
  • SuperAdmin: เห็นทุก record
```

---

## 5. Business Central Sync

```
Manual trigger / Cron (CRON_SECRET)
  ↓
GET /api/sync/bc?stream=1
  ↓
OAuth2 Client Credentials → BC Access Token (cached)
  ↓
Phase 1: dimensionValues ──→ bcDimensionValue
Phase 2: customers ────────→ bcCustomer         (batch 1000, 3 concurrent)
Phase 3: items ────────────→ bcItem + RFID codes
Phase 4: salesOrders ──────→ bcSalesOrder + bcSalesOrderLine
Phase 5: production ───────→ bcProductionOrder + bcItemLedgerEntry
Phase 6: cleanup stale records (if new ≥ 50% of old)
  ↓
SSE Stream → Client progress bar { phase, step, count }
```

- Retry: 3 attempts, exponential backoff, 429 respects Retry-After
- Pagination: auto-follows `@odata.nextLink`

---

## 6. Omnichannel Webhook Flow

```
Customer sends message (Facebook / LINE)
  ↓
POST /api/marketing/omnichannel/webhooks/[platform]
  ↓
Verify HMAC-SHA256 signature
  ↓
Upsert omContact (channel, externalId, displayName)
  ↓
Find/Create omConversation
  ↓
Insert omMessage (text/image)
  ↓
IF aiAutoReply enabled:
  POST /api/marketing/omnichannel/ai/reply
    ↓
    Fetch conversation history
    ↓
    OpenRouter AI generates response
    ↓
    Send reply via Facebook Graph API / LINE Messaging API
```

---

## 7. AI Chat Agent Flow (SSE Streaming)

```
User: "ยอดขายเดือนนี้เท่าไหร่"
  ↓
POST /api/chat { messages }
  ↓
Round 1: Orchestrator AI → เลือก agent (ask_sales_agent, ask_finance_agent, ...)
  ↓
Round 2: Execute agents แบบ parallel
  ├─ salesAgent → get_sales_orders, get_customers
  ├─ financeAgent → get_aged_receivables
  └─ (ทุก agent query Supabase ผ่าน tools)
  ↓
Round 3: Orchestrator สรุปผล → Stream SSE chunks
  ↓
Client ChatBot UI renders real-time
```

**Agents**: hrAgent, salesAgent, tmsAgent, financeAgent

---

## 8. State Management

```
┌─ Global (Context API) ──────────────────┐
│  AuthContext  → user, loading, signOut   │
│  RBACContext  → permissions, hasAccess   │
└──────────────────────────────────────────┘

┌─ Local (useState per hook) ─────────────┐
│  useEmployees → { data, loading }       │
│  useSalesLeads → { leads, loading }     │
│  Forms → controlled inputs via useState │
└──────────────────────────────────────────┘
```

**ไม่มี**: Redux, Zustand, global store, Server Components data fetching

---

## 9. Security Layers

| Layer           | Mechanism                                        |
| --------------- | ------------------------------------------------ |
| **Auth**        | Supabase JWT + Cookie + Bearer token             |
| **Session**     | 30-min inactivity timeout + periodic validation  |
| **API Guard**   | `withAuth()` on every route → 401/403            |
| **RBAC**        | `resource:action` permissions + superAdmin bypass |
| **Soft Delete** | Records set `isActive: false`, never hard-deleted |
| **Webhook**     | HMAC-SHA256 signature verification               |
| **Sync**        | `CRON_SECRET` bearer token required              |
| **Internal API**| `x-internal-secret` header for webhook→AI calls  |

---

## 10. Module Structure

```
src/modules/[moduleName]/
  ├─ actions.js              ← CRUD wrappers (calls apiClient)
  ├─ hooks/
  │  └─ use[Resource].js     ← React hooks (useState + useEffect)
  └─ components/
     ├─ [Resource]View.jsx   ← Display components
     └─ [Resource]Form.jsx   ← Form components

src/app/api/[module]/
  └─ [resource]/
     ├─ route.js             ← GET (list), POST (create)
     └─ [id]/route.js        ← GET (single), PUT (update), DELETE (soft)
```

---

## 11. Key Files

| Category        | Path                                      |
| --------------- | ----------------------------------------- |
| Root Layout     | `src/app/layout.jsx`                      |
| Main Layout     | `src/app/(main)/layout.jsx`               |
| Auth Context    | `src/contexts/AuthContext.jsx`            |
| RBAC Context    | `src/contexts/RBACContext.jsx`            |
| API Client      | `src/lib/apiClient.js`                    |
| Supabase Client | `src/lib/supabase/client.js`              |
| Supabase Server | `src/lib/supabase/server.js`              |
| BC Client       | `src/lib/bcClient.js`                     |
| AI Agents       | `src/lib/agents/*.js`                     |
| Auth Middleware  | `src/app/api/_lib/auth.js`                |
| Menu Config     | `src/config/menu.js`                      |

---

## สรุป

ระบบใช้ pattern เดียวกันทุก module:

**Page → Hook → Action → apiClient → API Route → withAuth() → Supabase → Response**

ข้อมูลภายนอกเข้าผ่าน 3 ช่องทาง:
- **Business Central** (sync batch via OData)
- **Facebook/LINE** (webhooks inbound)
- **OpenRouter AI** (chat agents)

ทุกอย่างเก็บลง **Supabase (PostgreSQL)** เป็น single source of truth
