# BC Migration — งานที่เหลือ

Full sync สำเร็จแล้ว: 853,194 records / 34 tables / 0 errors

---

## 1. อัปเดต API routes (ต้องทำก่อน deploy)

Column names เปลี่ยนจากเดิม เช่น:
- `bcCustomerExternalId` → `bcCustomerNo`
- `bcCustomerDisplayName` → `bcCustomerNameValue`
- `bcItemExternalId` → `bcItemNo`
- `bcSalesOrderExternalId` → `bcSalesOrderNoValue`

ไฟล์ที่ต้องแก้:
- `src/app/api/bc/customers/route.js`
- `src/app/api/bc/items/route.js`
- `src/app/api/bc/salesOrders/route.js`
- `src/app/api/bc/production/route.js`
- `src/app/api/bc/productionOrders/route.js`
- `src/app/api/warehouse/rfid/decode/route.js`
- `src/app/api/warehouse/rfid/assign/route.js`
- `src/app/api/warehouse/inventory/route.js`
- `src/app/api/tms/deliveryPlans/salesOrders/route.js`
- `src/app/api/tms/deliveryPlans/salesOrders/[no]/lines/route.js`
- `src/app/api/finance/bankRecon/[id]/match/route.js`
- `src/lib/agents/salesAgent.js`
- `src/lib/agents/financeAgent.js`
- `src/lib/omnichannel/aiAgent.js`

## 2. Rebuild Docker + Deploy NAS

```bash
# SSH เข้า NAS
ssh Panuwat.Ja@192.168.1.120
cd /volume1/docker/evergreen

# Pull code ใหม่ (หรือ copy files)
git pull

# Rebuild image
docker build -t evergreen-evergreen .

# Restart container
docker stop evergreen
docker rm evergreen
docker run -d --name evergreen -p 3000:3000 --env-file .env evergreen-evergreen
```

## 3. ตั้ง cron sync ทุก 5 นาที

สร้าง container ใหม่แทน `evergreen-bc-sync` เดิม:

```bash
docker run -d --name evergreen-bc-sync --restart=always alpine:3.20 \
  /bin/sh -c 'apk add --no-cache curl && while true; do \
    curl -s -H "Authorization: Bearer $CRON_SECRET" \
    "http://evergreen:3000/api/sync/bc" > /dev/null 2>&1; \
    sleep 300; \
  done'
```

หรือถ้าจะรัน full sync ครั้งแรกบน NAS:
```bash
# เข้าไปใน container
docker exec -it evergreen sh

# รัน full sync
node scripts/full-sync.mjs
```

## 4. ลบ functions เก่า

ใน `src/lib/bcClient.js`:
- ลบ `bcODataGet()`
- ลบ `bcProductionODataGet()`
- ลบ OData URL จาก `getBcUrls()`

## 5. ลบไฟล์ทดสอบ

- `scripts/run-migration.mjs` (ใช้แล้ว ไม่ต้องการอีก)
- `supabase_migration.sql` (รันแล้ว ไม่ต้องการอีก)

## 6. ทดสอบ incremental sync

หลัง deploy:
```
GET http://nas-ip:3000/api/sync/bc
```
ดูว่า incremental sync ทำงานถูกต้อง ไม่มี errors

---

## หมายเหตุ

- Docker NAS: `evergreen-bc-sync` + `evergreen-bc-sync-items` หยุดอยู่ ต้อง rm แล้วสร้างใหม่
- `evergreen-forthtrack-sync` ไม่เกี่ยว ปล่อยไว้
- ห้ามรัน `mode=full` หลังจากนี้ (RFID จะเปลี่ยน) ใช้ incremental เท่านั้น
