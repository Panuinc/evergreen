# Evergreen — วิธี Run Project

## Prerequisites

- Node.js >= 22
- Go >= 1.26
- Git

---

## 1. Clone & Install

```bash
git clone https://github.com/Panuinc/evergreen.git
cd evergreen

# Frontend dependencies
npm install

# Backend dependencies
cd evergreen-api
go mod download
cd ..
```

---

## 2. ตั้งค่า Environment Variables

### Frontend: `.env.local` (วางที่ root ของ project)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Business Central
BC_AUTH_URL=
BC_CLIENT_ID=
BC_CLIENT_SECRET=
BC_SCOPE=
BC_TENANT_ID=
BC_ENVIRONMENT=

# AI
OPENROUTER_API_KEY=

# Messaging
LINE_CHANNEL_SECRET=
FACEBOOK_WEBHOOK_VERIFY_TOKEN=
FACEBOOK_APP_SECRET=

# App
NEXT_PUBLIC_APP_URL=
INTERNAL_API_SECRET=
CRON_SECRET=

# GPS Tracking
FORTHTRACK_LOGIN_URL=
FORTHTRACK_API_BASE=
FORTHTRACK_CLIENT_ID=
FORTHTRACK_CLIENT_SECRET=
FORTHTRACK_USERNAME=
FORTHTRACK_PASSWORD=
```

### Backend: `evergreen-api/.env` (วางใน folder evergreen-api)

ใช้ key เดียวกันกับ `.env.local` (copy ทั้งไฟล์ได้เลย)

> ไฟล์ .env ไม่อยู่ใน git — ต้อง copy จากเครื่องเดิมมาเอง

---

## 3. Run Development

เปิด 2 terminal:

### Terminal 1 — Go Backend (port 8080)

```bash
cd evergreen-api
go run cmd/server/main.go
```

หรือใช้ Makefile:

```bash
cd evergreen-api
make run
```

### Terminal 2 — Next.js Frontend (port 3000)

```bash
npm run dev
```

เปิดเว็บที่ http://localhost:3000

---

## 4. คำสั่งที่ใช้บ่อย

| คำสั่ง | ที่ไหน | ทำอะไร |
|---|---|---|
| `npm run dev` | root | Run Next.js dev server |
| `npm run build` | root | Build production |
| `npm run lint` | root | ESLint check |
| `make run` | evergreen-api/ | Build + Run Go server |
| `make test` | evergreen-api/ | Run Go tests |
| `make lint` | evergreen-api/ | Run Go linter |

---

## 5. เปลี่ยนเครื่องทำงาน

```bash
# เครื่องใหม่
git pull
npm install
cd evergreen-api && go mod download && cd ..

# copy .env.local และ evergreen-api/.env จากเครื่องเดิม
# แล้ว run ตามข้อ 3
```
