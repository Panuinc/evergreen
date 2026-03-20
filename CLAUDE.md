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
   - Backend uses `AS` alias to return clean field names from Supabase columns.
   - Frontend uses the exact same property names as the API response.
5. When the Supabase column has a long prefix (e.g., `bcCustomerLedgerEntryCustomerNo`), the Go API MUST alias it to a clean name (e.g., `AS "customerNumber"`) and the frontend uses that clean name.
6. **Before writing any endpoint or component**, verify field name alignment:
   - Define the API response contract (what fields the frontend needs)
   - Write the Go SQL query with aliases matching that contract
   - Frontend accesses the exact same property names

### Example

```sql
-- Go store.go — compute and alias at backend
SELECT
  "bcCustomerLedgerEntryCustomerNo" AS "customerNumber",
  COALESCE(c."bcCustomerNameValue", e."bcCustomerLedgerEntryCustomerNo") AS "name",
  SUM(CASE WHEN "bcCustomerLedgerEntryRemainingAmount" != 0
    THEN "bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "balanceDue",
  SUM(CASE WHEN "bcCustomerLedgerEntryDueDate" >= CURRENT_DATE
    THEN "bcCustomerLedgerEntryRemainingAmount" ELSE 0 END) AS "currentAmount"
FROM "bcCustomerLedgerEntry" e
LEFT JOIN "bcCustomer" c ON c."bcCustomerNo" = e."bcCustomerLedgerEntryCustomerNo"
WHERE e."bcCustomerLedgerEntryOpenValue" = 'true'
GROUP BY "bcCustomerLedgerEntryCustomerNo", c."bcCustomerNameValue"
```

```javascript
// Frontend — uses the computed clean names directly, no client-side aggregation needed
const data = await get("/api/finance/agedReceivables");
data.map(r => ({ name: r.name, balanceDue: r.balanceDue }));
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

1. **ห้าม SELECT *** — ต้อง SELECT เฉพาะ column ที่ frontend ใช้ พร้อม alias ให้ clean name
2. **ทุก column ที่ใช้ใน WHERE, JOIN, GROUP BY, ORDER BY ต้องมี index** — ถ้าเขียน query ใหม่ ต้องตรวจว่ามี index แล้ว ถ้าไม่มีต้องสร้าง
3. **Query ที่มี aggregate (SUM, COUNT) ต้อง filter ให้แคบก่อน GROUP BY** — ใช้ WHERE ตัดข้อมูลที่ไม่ต้องการออกก่อน aggregate
4. **LATERAL subquery กับ json_agg ต้อง SELECT เฉพาะ column ที่ใช้** — ห้าม `to_json(l.*)` ต้อง `json_build_object('field1', l."col1", ...)`

---

# Frontend Fetching Rules (MANDATORY)

1. **ถ้า fetch หลาย endpoint ใน page เดียว ต้อง fetch แบบ parallel** — ห้าม waterfall (sequential) fetch
   - Server Component: ใช้ `Promise.all([fetch1(), fetch2()])`
   - Client Component (SWR): SWR จะ parallel อัตโนมัติถ้าไม่มี dependency ระหว่าง key
2. **ข้อมูลที่โหลดตอน page load ให้ใช้ Server Component fetch ก่อน** แล้วส่ง props ลง Client Component
3. **ใช้ client-side fetch (SWR/useEffect) เฉพาะข้อมูลที่ต้อง refresh แบบ realtime** หรือขึ้นกับ user interaction

---

# API Response Rules (MANDATORY)

1. **Endpoint ที่ return list ต้อง support pagination** — default limit 50, ใช้ query param `?limit=50&offset=0`
2. **ห้าม return nested data ถ้า frontend ไม่ได้ใช้** — ใช้ `?expand=true` เมื่อต้องการ nested relations
3. **Response field names ต้อง camelCase** ตรงกับ frontend property names (สอดคล้องกับ Data Flow Architecture Rule #4)

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
- **camelCase for all files** — `financeDashboardClient.jsx`, `signInPasswordForm.jsx`, `authContext.jsx`
- **Exception — Next.js special files:** `page.jsx`, `layout.jsx`, `error.jsx`, `loading.jsx`, `not-found.jsx`, `global-error.jsx`, `forbidden.jsx`, `providers.jsx`, `route.js`, `proxy.js`, `default.jsx`, `template.jsx` — stay lowercase as-is
- **Never use PascalCase for file names** even for component files

```
// CORRECT
src/components/layout/header.jsx
src/modules/finance/financeDashboardClient.jsx
src/contexts/authContext.jsx

// WRONG
src/components/layout/Header.jsx
src/modules/finance/FinanceDashboardClient.jsx
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

```jsx
// file: src/components/layout/header.jsx
export default function Header() {   // ← PascalCase component name (required by React)
  return <nav>...</nav>
}

// import in another file:
import Header from "@/components/layout/header"  // ← camelCase path
```
