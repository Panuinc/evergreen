# Evergreen NAS Deploy Guide

## ข้อมูล NAS

- IP: `192.168.1.120`
- User: `Panuwat.Ja`
- Password: `**(ดูใน 1Password / ถามแอดมิน)**`
- Project Path: `/volume1/docker/evergreen`
- App URL: `http://192.168.1.120:3000`
- Domain: `https://evergreen.chhindustry.com`

---

## ครั้งแรก (Initial Setup)

### ขั้นตอนที่ 1 — SSH เข้า NAS

เปิด Terminal (Windows: PowerShell / Mac: Terminal) แล้วพิมพ์:

```bash
ssh Panuwat.Ja@192.168.1.120
```

ใส่ password: `**(ดูใน 1Password / ถามแอดมิน)**`

---

### ขั้นตอนที่ 2 — เข้า project directory

```bash
cd /volume1/docker/evergreen
```

---

### ขั้นตอนที่ 3 — ดาวน์โหลด code จาก GitHub

```bash
curl -L https://github.com/Panuinc/evergreen/archive/refs/heads/main.tar.gz | tar xz --strip-components=1
```

---

### ขั้นตอนที่ 4 — สร้าง .env.local (ครั้งแรกเท่านั้น)

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=<ขอจากแอดมิน>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<ขอจากแอดมิน>
SUPABASE_SERVICE_ROLE_KEY=<ขอจากแอดมิน>
BC_AUTH_URL=<ขอจากแอดมิน>
BC_CLIENT_ID=<ขอจากแอดมิน>
BC_CLIENT_SECRET=<ขอจากแอดมิน>
BC_SCOPE=https://api.businesscentral.dynamics.com/.default
BC_TENANT_ID=<ขอจากแอดมิน>
BC_ENVIRONMENT=production
OPENROUTER_API_KEY=<ขอจากแอดมิน>
FACEBOOK_WEBHOOK_VERIFY_TOKEN=<ขอจากแอดมิน>
LINE_CHANNEL_SECRET=<ขอจากแอดมิน>
INTERNAL_API_SECRET=<ขอจากแอดมิน>
NEXT_PUBLIC_APP_URL=https://evergreen.chhindustry.com
CRON_SECRET=<ขอจากแอดมิน>
EOF
```

---

### ขั้นตอนที่ 5 — Build และ Start

```bash
sudo docker compose up -d --build
```

ใส่ password: `**(ดูใน 1Password / ถามแอดมิน)**`

รอประมาณ 5-10 นาที (ครั้งแรกจะนานหน่อย)

---

### ขั้นตอนที่ 6 — ตรวจสอบว่าทำงานได้

```bash
sudo docker compose ps
```

ต้องเห็น 2 containers:

| Container            | Status  | หน้าที่                    |
| -------------------- | ------- | -------------------------- |
| evergreen            | Running | Next.js App (port 3000)    |
| evergreen-bc-sync    | Running | Sync BC ทุก 1 ชม.         |

ดู logs:

```bash
sudo docker logs evergreen --tail 30
sudo docker logs evergreen-bc-sync --tail 10
```

เปิด browser ไปที่ `http://192.168.1.120:3000` ตรวจสอบว่าเข้าได้

---

## Deploy ครั้งถัดไป (Update Code)

ทุกครั้งที่แก้ code แล้ว push ไป GitHub ให้ทำแค่ 4 ขั้นตอน:

### 1. SSH เข้า NAS

```bash
ssh Panuwat.Ja@192.168.1.120
```

### 2. เข้า project directory

```bash
cd /volume1/docker/evergreen
```

### 3. ดาวน์โหลด code ใหม่

```bash
curl -L https://github.com/Panuinc/evergreen/archive/refs/heads/main.tar.gz | tar xz --strip-components=1
```

### 4. Build และ Restart

```bash
sudo docker compose up -d --build
```

จบ! รอ build สักพัก แล้วเข้าเว็บได้เลย

---

## คำสั่งที่ใช้บ่อย

```bash
# ดู status ทุก container
sudo docker compose ps

# ดู logs ของ app
sudo docker logs evergreen --tail 50

# ดู logs ของ BC sync
sudo docker logs evergreen-bc-sync --tail 20

# Restart ทั้งหมด
sudo docker compose restart

# Stop ทั้งหมด
sudo docker compose down

# ดู disk usage ของ Docker
sudo docker system df
```
