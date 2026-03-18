# BC API Field Selection

Sync จาก BC Custom API → Supabase
- ✅ = เอา (ใช้ทำ Report/Analytics)
แสดงเฉพาะ fields ที่เลือก ✅

**Base URL:** `https://api.businesscentral.dynamics.com/v2.0/{tenantId}/Production/api/evergreen/erp/v1.0/companies({companyId})`

---

## 1. `dimensionValues` — ใช้สร้าง dimMap (ไม่เก็บลง Supabase)

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | dimensionCode | แยกประเภทมิติ (DEPARTMENT, PROJECT, CAR...) |
| ✅ | codeValue | รหัสมิติ |
| ✅ | nameValue | ชื่อมิติ (ใช้แสดงผล) |

---

## 2. `customers` — 162 fields → เลือก 20

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | no | PK — รหัสลูกค้า |
| ✅ | nameValue | ชื่อลูกค้า |
| ✅ | address | ที่อยู่ |
| ✅ | address2 | ที่อยู่ (ต่อ) |
| ✅ | city | เมือง |
| ✅ | postCode | รหัสไปรษณีย์ |
| ✅ | contact | ผู้ติดต่อ |
| ✅ | phoneNo | เบอร์โทร |
| ✅ | eMail | อีเมล |
| ✅ | salespersonCode | group ตามพนักงานขาย |
| ✅ | customerPostingGroup | group ตามประเภทลูกค้า (CTD, EXP...) |
| ✅ | paymentTermsCode | เงื่อนไขการชำระ (CASH, 30D...) |
| ✅ | globalDimension1Code | มิติ 1 (แผนก) |
| ✅ | globalDimension2Code | มิติ 2 (โครงการ) |
| ✅ | creditLimitLCY | วงเงินเครดิต |
| ✅ | balanceLCY | ยอดคงเหลือ |
| ✅ | balanceDueLCY | ยอดค้างชำระ |
| ✅ | outstandingOrders | ยอด SO ค้าง |
| ✅ | shippedNotInvoiced | ส่งแล้วยังไม่ออก invoice |
| ✅ | blocked | สถานะ block |
| ✅ | vATRegistrationNo | เลขผู้เสียภาษี |
| ✅ | paymentMethodCode | วิธีชำระเงิน (BANK, CASH...) |
| ✅ | genBusPostingGroup | DOMESTIC / EXPORT — แยกในประเทศ/ต่างประเทศ |
| ✅ | salesLCY | ยอดขายสะสม — จัดอันดับลูกค้า |
| ✅ | profitLCY | กำไรสะสม — วิเคราะห์ profitability |
| ✅ | mobilePhoneNo | เบอร์มือถือ |
| ✅ | countryRegionCode | ประเทศ (TH, ...) |
| ✅ | outstandingInvoices | ยอด invoice ค้าง |
| ✅ | createdAt | วันที่สร้าง (ใช้เป็นเงื่อนไข sync) |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด (ใช้ sync เฉพาะที่เปลี่ยน) |

---

## 3. `items` — 85 fields → เลือก 14

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | no | PK — รหัสสินค้า |
| ✅ | description | ชื่อสินค้า |
| ✅ | description2 | ชื่อเพิ่มเติม |
| ✅ | type | ประเภท (Inventory, Service) |
| ✅ | blocked | สถานะ block |
| ✅ | baseUnitOfMeasure | หน่วยวัด |
| ✅ | unitPrice | ราคาขาย |
| ✅ | unitCost | ต้นทุน |
| ✅ | genProdPostingGroup | group สินค้า (FG, RM, SP...) |
| ✅ | itemCategoryCode | หมวดหมู่สินค้า |
| ✅ | inventory | จำนวนคงเหลือ |
| ✅ | globalDimension1Code | มิติ 1 |
| ✅ | globalDimension2Code | มิติ 2 |
| ✅ | vendorNo | ผู้ขายหลัก |
| ✅ | standardCost | ต้นทุนมาตรฐาน — เทียบ variance กับ unitCost |
| ✅ | costingMethod | วิธีคิดต้นทุน (FIFO, Average, Standard) |
| ✅ | lastDirectCost | ต้นทุนซื้อล่าสุด |
| ✅ | inventoryPostingGroup | group posting (FG, RM, SP...) |
| ✅ | grossWeight | น้ำหนักรวม |
| ✅ | netWeight | น้ำหนักสุทธิ |
| ✅ | productionBOMNo | สูตรผลิต — เชื่อม production |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 4. `salesOrders` — 181 fields → เลือก 25

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | noValue | PK — เลข SO |
| ✅ | sellToCustomerNo | รหัสลูกค้า |
| ✅ | sellToCustomerName | ชื่อลูกค้า |
| ✅ | sellToAddress | ที่อยู่ลูกค้า |
| ✅ | sellToAddress2 | ที่อยู่ (ต่อ) |
| ✅ | sellToCity | เมือง |
| ✅ | sellToPostCode | รหัสไปรษณีย์ |
| ✅ | shipToName | ชื่อผู้รับ |
| ✅ | shipToAddress | ที่อยู่จัดส่ง |
| ✅ | shipToAddress2 | ที่อยู่จัดส่ง (ต่อ) |
| ✅ | shipToCity | เมืองจัดส่ง |
| ✅ | shipToPostCode | รหัสไปรษณีย์จัดส่ง |
| ✅ | orderDate | วันที่สั่ง |
| ✅ | dueDate | วันครบกำหนด |
| ✅ | status | สถานะ (Open, Released) |
| ✅ | completelyShipped | ส่งครบแล้วหรือยัง |
| ✅ | salespersonCode | group ตามพนักงานขาย |
| ✅ | externalDocumentNo | เลขอ้างอิง/ใบเสนอราคา |
| ✅ | locationCode | คลังสินค้า |
| ✅ | shortcutDimension1Code | มิติ 1 (แผนก) |
| ✅ | shortcutDimension2Code | มิติ 2 (โครงการ) |
| ✅ | amountValue | ยอดรวม |
| ✅ | amountIncludingVAT | ยอดรวม VAT |
| ✅ | assignedUserID | ผู้รับผิดชอบ |
| ✅ | requestedDeliveryDate | วันที่ต้องการส่ง |
| ✅ | paymentTermsCode | เงื่อนไขชำระ (CASH, 30D...) |
| ✅ | paymentMethodCode | วิธีจ่าย (BANK, CASH...) |
| ✅ | currencyCode | สกุลเงิน (ว่าง = THB) |
| ✅ | quoteNo | เลขใบเสนอราคาต้นทาง |
| ✅ | invoiceDiscountAmount | ส่วนลด invoice |
| ✅ | postingDate | วันที่ลงบัญชี |
| ✅ | documentDate | วันที่เอกสาร |
| ✅ | shipmentMethodCode | วิธีจัดส่ง (FOB, CIF...) |
| ✅ | shippingAgentCode | บริษัทขนส่ง |
| ✅ | lastShipmentDate | วันที่ส่งของล่าสุด — ดู lead time |
| ✅ | promisedDeliveryDate | วันที่สัญญาส่ง — วัด on-time delivery |
| ✅ | sellToPhoneNo | เบอร์โทรลูกค้า |
| ✅ | sellToEMail | อีเมลลูกค้า |
| ✅ | noSeries | เลข series — แยกสาขา/ช่องทาง |
| ✅ | currencyFactor | อัตราแลกเปลี่ยน |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 5. `salesOrderLines` — 173 fields → เลือก 17

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | documentNo | เลข SO (FK) |
| ✅ | lineNo | ลำดับบรรทัด |
| ✅ | typeValue | ประเภท (Item, Resource...) |
| ✅ | noValue | รหัสสินค้า |
| ✅ | descriptionValue | ชื่อสินค้า |
| ✅ | quantityValue | จำนวนสั่ง |
| ✅ | outstandingQuantity | จำนวนค้างส่ง |
| ✅ | quantityShipped | จำนวนส่งแล้ว |
| ✅ | unitPrice | ราคาต่อหน่วย |
| ✅ | lineDiscount | ส่วนลด % |
| ✅ | lineDiscountAmount | ส่วนลดจำนวนเงิน |
| ✅ | amountValue | ยอดหลังลด |
| ✅ | amountIncludingVAT | ยอดรวม VAT |
| ✅ | unitOfMeasureCode | หน่วย |
| ✅ | locationCode | คลังสินค้า |
| ✅ | shortcutDimension1Code | มิติ 1 |
| ✅ | shortcutDimension2Code | มิติ 2 |
| ✅ | unitCost | ต้นทุนต่อหน่วย — คำนวณ margin |
| ✅ | quantityInvoiced | จำนวนออก invoice แล้ว |
| ✅ | profit | กำไร % ต่อบรรทัด |
| ✅ | variantCode | รหัส variant สินค้า |
| ✅ | itemCategoryCode | หมวดหมู่สินค้า |
| ✅ | genProdPostingGroup | group ประเภทสินค้า (FG, RM, SP) |
| ✅ | shipmentDate | วันที่จัดส่ง |
| ✅ | outstandingAmount | ยอดเงินค้างส่ง |
| ✅ | invDiscountAmount | ส่วนลดรายบรรทัด |
| ✅ | plannedDeliveryDate | วันที่วางแผนส่ง |
| ✅ | plannedShipmentDate | วันที่วางแผนจัดส่ง |
| ✅ | description2 | ชื่อเพิ่มเติม / spec |
| ✅ | vAT | % VAT (7, 0) |
| ✅ | lineAmount | ยอดก่อนลด (qty × unitPrice) |
| ✅ | qtyToShip | จำนวนที่เตรียมจะส่ง |
| ✅ | qtyToInvoice | จำนวนที่เตรียมจะออก invoice |
| ✅ | dropShipment | ส่งตรงจาก vendor → ลูกค้า |
| ✅ | binCode | bin location ในคลัง |
| ✅ | completelyShipped | ส่งครบแล้วหรือยัง (per line) |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 6. `productionOrders` — 54 fields → เลือก 18

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | no | PK — เลข RPD |
| ✅ | status | สถานะ (Simulated, Planned, Firm Planned, Released, Finished) |
| ✅ | description | รายละเอียด |
| ✅ | description2 | รายละเอียดเพิ่มเติม |
| ✅ | sourceNo | Item ที่ผลิต |
| ✅ | routingNo | Routing |
| ✅ | quantity | จำนวนผลิต |
| ✅ | shortcutDimension1Code | มิติ 1 (แผนก) |
| ✅ | shortcutDimension2Code | มิติ 2 (โครงการ) |
| ✅ | locationCode | คลัง |
| ✅ | dueDate | วันครบกำหนด |
| ✅ | finishedDate | วันเสร็จ |
| ✅ | startingDateTime | เริ่มผลิต |
| ✅ | endingDateTime | สิ้นสุดผลิต |
| ✅ | assignedUserID | ผู้รับผิดชอบ |
| ✅ | searchDescription | ค้นหา |
| ✅ | costAmount | ต้นทุนรวม |
| ✅ | unitCost | ต้นทุนต่อหน่วย |
| ✅ | sourceType | ประเภท source (Item) |
| ✅ | binCode | bin location |
| ✅ | creationDate | วันที่สร้าง PO ใน BC |
| ✅ | expectedOperationCostAmt | ต้นทุนดำเนินการคาดการณ์ |
| ✅ | expectedComponentCostAmt | ต้นทุนวัตถุดิบคาดการณ์ |
| ✅ | actualTimeUsed | เวลาใช้จริง (นาที) |
| ✅ | completelyPicked | หยิบวัตถุดิบครบแล้วหรือยัง |
| ✅ | documentPutAwayStatus | สถานะ put away |
| ✅ | plannedOrderNo | เลข Planned Order ต้นทาง |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 7. `productionOrderLines` — 62 fields → เลือก 14

Nested ใน productionOrders via `$expand=productionOrderLines`

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | status | สถานะ |
| ✅ | prodOrderNo | เลข RPD (FK) |
| ✅ | lineNo | ลำดับ |
| ✅ | itemNo | รหัสสินค้า |
| ✅ | description | ชื่อ |
| ✅ | description2 | ชื่อเพิ่มเติม |
| ✅ | quantity | จำนวนสั่งผลิต |
| ✅ | finishedQuantity | จำนวนผลิตเสร็จ |
| ✅ | remainingQuantity | จำนวนคงเหลือ |
| ✅ | unitOfMeasureCode | หน่วย |
| ✅ | locationCode | คลัง |
| ✅ | shortcutDimension1Code | มิติ 1 |
| ✅ | shortcutDimension2Code | มิติ 2 |
| ✅ | dueDate | วันครบกำหนด |
| ✅ | unitCost | ต้นทุนต่อหน่วย |
| ✅ | costAmount | ต้นทุนรวม |
| ✅ | scrap | จำนวนของเสีย |
| ✅ | routingNo | Routing |
| ✅ | productionBOMNo | สูตรผลิต |
| ✅ | variantCode | variant |
| ✅ | binCode | bin location |
| ✅ | startingDateTime | เริ่มผลิต |
| ✅ | endingDateTime | สิ้นสุดผลิต |
| ✅ | putAwayStatus | สถานะ put away |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 8. `itemLedgerEntries` — 76 fields → เลือก 18

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | entryNo | PK |
| ✅ | itemNo | รหัสสินค้า |
| ✅ | postingDate | วันที่ลง |
| ✅ | entryType | ประเภท (Consumption, Output, Sale, Purchase...) |
| ✅ | documentNo | เลขเอกสาร |
| ✅ | descriptionValue | รายละเอียด |
| ✅ | locationCode | คลัง |
| ✅ | quantityValue | จำนวน |
| ✅ | remainingQuantity | จำนวนคงเหลือ |
| ✅ | invoicedQuantity | จำนวนออก invoice |
| ✅ | unitOfMeasureCode | หน่วย |
| ✅ | globalDimension1Code | มิติ 1 (แผนก) |
| ✅ | globalDimension2Code | มิติ 2 (โครงการ) |
| ✅ | openValue | เปิด/ปิด |
| ✅ | orderType | ประเภทคำสั่ง (Production, Sales...) |
| ✅ | orderNo | เลขคำสั่ง |
| ✅ | orderLineNo | บรรทัดคำสั่ง |
| ✅ | itemDescription | ชื่อสินค้า (จาก Item master) |
| ✅ | documentDate | วันที่เอกสาร |
| ✅ | documentType | ประเภทเอกสาร |
| ✅ | completelyInvoiced | invoice ครบแล้วหรือยัง |
| ✅ | variantCode | variant สินค้า |
| ✅ | serialNo | serial number |
| ✅ | lotNo | lot number |
| ✅ | expirationDate | วันหมดอายุ |
| ✅ | itemCategoryCode | หมวดหมู่สินค้า |
| ✅ | sourceNo | รหัส source |
| ✅ | documentLineNo | บรรทัดเอกสาร |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 9. `postedSalesInvoices` — 139 fields → เลือก 30

Invoice ที่ post แล้ว — รายได้จริง, ต้นทุนจริง, กำไรจริง

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | noValue | PK — เลข Invoice (IV2603-075) |
| ✅ | sellToCustomerNo | รหัสลูกค้า |
| ✅ | sellToCustomerName | ชื่อลูกค้า |
| ✅ | sellToAddress | ที่อยู่ลูกค้า |
| ✅ | sellToAddress2 | ที่อยู่ (ต่อ) |
| ✅ | sellToCity | เมือง |
| ✅ | sellToPostCode | รหัสไปรษณีย์ |
| ✅ | orderNo | เลข SO ต้นทาง — เชื่อมกลับ salesOrders |
| ✅ | orderDate | วันที่สั่ง |
| ✅ | postingDate | วันที่ลงบัญชี |
| ✅ | documentDate | วันที่เอกสาร |
| ✅ | dueDate | วันครบกำหนดชำระ |
| ✅ | amountValue | ยอดรวม (ไม่รวม VAT) |
| ✅ | amountIncludingVAT | ยอดรวม VAT |
| ✅ | salespersonCode | พนักงานขาย |
| ✅ | shortcutDimension1Code | มิติ 1 (แผนก) |
| ✅ | shortcutDimension2Code | มิติ 2 (โครงการ) |
| ✅ | locationCode | คลัง |
| ✅ | currencyCode | สกุลเงิน |
| ✅ | currencyFactor | อัตราแลกเปลี่ยน |
| ✅ | paymentTermsCode | เงื่อนไขชำระ |
| ✅ | paymentMethodCode | วิธีจ่าย |
| ✅ | externalDocumentNo | เลขอ้างอิง |
| ✅ | genBusPostingGroup | DOMESTIC/EXPORT |
| ✅ | customerPostingGroup | ประเภทลูกค้า |
| ✅ | remainingAmount | ยอดค้างชำระ |
| ✅ | closedValue | ปิดแล้วหรือยัง |
| ✅ | invoiceDiscountAmount | ส่วนลด |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 10. `postedSalesInvoiceLines` — 100 fields → เลือก 22

Nested ใน postedSalesInvoices via `$expand=postedSalesInvoiceLines`

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | documentNo | เลข Invoice (FK) |
| ✅ | lineNo | ลำดับ |
| ✅ | typeValue | ประเภท (Item, Resource...) |
| ✅ | noValue | รหัสสินค้า |
| ✅ | descriptionValue | ชื่อสินค้า |
| ✅ | description2 | ชื่อเพิ่มเติม |
| ✅ | quantityValue | จำนวน |
| ✅ | unitPrice | ราคาต่อหน่วย |
| ✅ | unitCost | ต้นทุนต่อหน่วย — คำนวณ margin |
| ✅ | amountValue | ยอดหลังลด |
| ✅ | amountIncludingVAT | ยอดรวม VAT |
| ✅ | lineDiscount | ส่วนลด % |
| ✅ | lineDiscountAmount | ส่วนลดจำนวนเงิน |
| ✅ | unitOfMeasureCode | หน่วย |
| ✅ | locationCode | คลัง |
| ✅ | shortcutDimension1Code | มิติ 1 |
| ✅ | shortcutDimension2Code | มิติ 2 |
| ✅ | genProdPostingGroup | group ประเภทสินค้า (FG, RM, SP) |
| ✅ | itemCategoryCode | หมวดหมู่สินค้า |
| ✅ | variantCode | variant |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 11. `salesInvoices` — 181 fields → เลือก 25

Invoice ที่ยังไม่ post — เหมือน salesOrders structure

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | noValue | PK — เลข Invoice draft |
| ✅ | sellToCustomerNo | รหัสลูกค้า |
| ✅ | sellToCustomerName | ชื่อลูกค้า |
| ✅ | sellToAddress | ที่อยู่ |
| ✅ | sellToAddress2 | ที่อยู่ (ต่อ) |
| ✅ | sellToCity | เมือง |
| ✅ | sellToPostCode | รหัสไปรษณีย์ |
| ✅ | orderDate | วันที่สั่ง |
| ✅ | postingDate | วันที่ลงบัญชี |
| ✅ | documentDate | วันที่เอกสาร |
| ✅ | dueDate | วันครบกำหนด |
| ✅ | amountValue | ยอดรวม |
| ✅ | amountIncludingVAT | ยอดรวม VAT |
| ✅ | salespersonCode | พนักงานขาย |
| ✅ | shortcutDimension1Code | มิติ 1 |
| ✅ | shortcutDimension2Code | มิติ 2 |
| ✅ | locationCode | คลัง |
| ✅ | currencyCode | สกุลเงิน |
| ✅ | paymentTermsCode | เงื่อนไขชำระ |
| ✅ | paymentMethodCode | วิธีจ่าย |
| ✅ | externalDocumentNo | เลขอ้างอิง |
| ✅ | status | สถานะ (Open, Released) |
| ✅ | invoiceDiscountAmount | ส่วนลด |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 11b. `salesInvoiceLines` — nested ใน salesInvoices → เลือก 20

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | documentNo | เลข Invoice (FK) |
| ✅ | lineNo | ลำดับ |
| ✅ | typeValue | ประเภท |
| ✅ | noValue | รหัสสินค้า |
| ✅ | descriptionValue | ชื่อสินค้า |
| ✅ | description2 | ชื่อเพิ่มเติม |
| ✅ | quantityValue | จำนวน |
| ✅ | unitPrice | ราคาต่อหน่วย |
| ✅ | unitCost | ต้นทุนต่อหน่วย |
| ✅ | amountValue | ยอดหลังลด |
| ✅ | amountIncludingVAT | ยอดรวม VAT |
| ✅ | lineDiscount | ส่วนลด % |
| ✅ | lineDiscountAmount | ส่วนลดจำนวนเงิน |
| ✅ | unitOfMeasureCode | หน่วย |
| ✅ | locationCode | คลัง |
| ✅ | shortcutDimension1Code | มิติ 1 |
| ✅ | shortcutDimension2Code | มิติ 2 |
| ✅ | genProdPostingGroup | group สินค้า (FG, RM, SP) |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 12. `valueEntries` — 69 fields → เลือก 25

ต้นทุนจริง per transaction — ทดแทน cost fields ที่ ILE ไม่มี

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | entryNo | PK |
| ✅ | itemNo | รหัสสินค้า |
| ✅ | postingDate | วันที่ลง |
| ✅ | documentNo | เลขเอกสาร |
| ✅ | documentType | ประเภทเอกสาร (Sales Shipment, Purchase Invoice...) |
| ✅ | descriptionValue | รายละเอียด |
| ✅ | locationCode | คลัง |
| ✅ | valuedQuantity | จำนวนที่คิดมูลค่า |
| ✅ | invoicedQuantity | จำนวนออก invoice |
| ✅ | costPerUnit | ต้นทุนต่อหน่วย |
| ✅ | itemLedgerEntryNo | เชื่อม ILE |
| ✅ | itemLedgerEntryType | ประเภท (Sale, Purchase, Output, Consumption...) |
| ✅ | entryType | Direct Cost, Revaluation, Variance... |
| ✅ | salespersPurchCode | พนักงานขาย/จัดซื้อ |
| ✅ | discountAmount | ส่วนลด |
| ✅ | globalDimension1Code | มิติ 1 |
| ✅ | globalDimension2Code | มิติ 2 |
| ✅ | sourceType | ประเภท source (Customer, Vendor...) |
| ✅ | sourceNo | รหัส source |
| ✅ | genProdPostingGroup | group สินค้า |
| ✅ | orderType | ประเภทคำสั่ง |
| ✅ | orderNo | เลขคำสั่ง |
| ✅ | expectedCost | ต้นทุนคาดการณ์หรือจริง |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 13. `customerLedgerEntries` — 92 fields → เลือก 25

AR tracking — invoice แล้วแต่ยังไม่จ่าย, aging analysis

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | entryNo | PK |
| ✅ | customerNo | รหัสลูกค้า |
| ✅ | customerName | ชื่อลูกค้า |
| ✅ | postingDate | วันที่ลง |
| ✅ | documentType | ประเภท (Invoice, Payment, Credit Memo...) |
| ✅ | documentNo | เลขเอกสาร |
| ✅ | description | รายละเอียด |
| ✅ | amount | ยอด |
| ✅ | amountLCY | ยอด (THB) |
| ✅ | remainingAmount | ยอดค้างชำระ |
| ✅ | remainingAmtLCY | ยอดค้างชำระ (THB) |
| ✅ | dueDate | วันครบกำหนด — ใช้ทำ aging |
| ✅ | openValue | เปิด/ปิด — filter เฉพาะค้าง |
| ✅ | salesLCY | ยอดขาย |
| ✅ | profitLCY | กำไร |
| ✅ | salespersonCode | พนักงานขาย |
| ✅ | globalDimension1Code | มิติ 1 |
| ✅ | globalDimension2Code | มิติ 2 |
| ✅ | customerPostingGroup | ประเภทลูกค้า |
| ✅ | sellToCustomerNo | รหัสลูกค้า (sell-to) |
| ✅ | currencyCode | สกุลเงิน |
| ✅ | documentDate | วันที่เอกสาร |
| ✅ | externalDocumentNo | เลขอ้างอิง |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 14. `vendors` — 141 fields → เลือก 22

Master data เจ้าหนี้/ผู้ขาย

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | no | PK — รหัสเจ้าหนี้ |
| ✅ | nameValue | ชื่อเจ้าหนี้ |
| ✅ | address | ที่อยู่ |
| ✅ | address2 | ที่อยู่ (ต่อ) |
| ✅ | city | เมือง |
| ✅ | postCode | รหัสไปรษณีย์ |
| ✅ | contact | ผู้ติดต่อ |
| ✅ | phoneNo | เบอร์โทร |
| ✅ | eMail | อีเมล |
| ✅ | mobilePhoneNo | เบอร์มือถือ |
| ✅ | vendorPostingGroup | ประเภทเจ้าหนี้ (VTD, EMP...) |
| ✅ | paymentTermsCode | เงื่อนไขชำระ |
| ✅ | paymentMethodCode | วิธีจ่าย |
| ✅ | purchaserCode | ผู้จัดซื้อ |
| ✅ | globalDimension1Code | มิติ 1 |
| ✅ | globalDimension2Code | มิติ 2 |
| ✅ | balanceLCY | ยอดคงเหลือ |
| ✅ | balanceDueLCY | ยอดค้างจ่าย |
| ✅ | vATRegistrationNo | เลขผู้เสียภาษี |
| ✅ | genBusPostingGroup | DOMESTIC/FOREIGN |
| ✅ | blocked | สถานะ block |
| ✅ | countryRegionCode | ประเทศ |
| ✅ | outstandingOrders | PO ค้าง |
| ✅ | outstandingInvoices | Invoice ค้าง |
| ✅ | purchasesLCY | ยอดซื้อสะสม |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 15. `vendorLedgerEntries` — 87 fields → เลือก 22

AP tracking — เจ้าหนี้ค้างจ่าย, aging analysis

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | entryNo | PK |
| ✅ | vendorNo | รหัสเจ้าหนี้ |
| ✅ | vendorName | ชื่อเจ้าหนี้ |
| ✅ | postingDate | วันที่ลง |
| ✅ | documentType | ประเภท (Invoice, Payment, Credit Memo...) |
| ✅ | documentNo | เลขเอกสาร |
| ✅ | description | รายละเอียด |
| ✅ | amount | ยอด |
| ✅ | amountLCY | ยอด (THB) |
| ✅ | remainingAmount | ยอดค้างจ่าย |
| ✅ | remainingAmtLCY | ยอดค้างจ่าย (THB) |
| ✅ | dueDate | วันครบกำหนด — ใช้ทำ aging |
| ✅ | openValue | เปิด/ปิด — filter เฉพาะค้าง |
| ✅ | purchaseLCY | ยอดซื้อ |
| ✅ | purchaserCode | ผู้จัดซื้อ |
| ✅ | globalDimension1Code | มิติ 1 |
| ✅ | globalDimension2Code | มิติ 2 |
| ✅ | vendorPostingGroup | ประเภทเจ้าหนี้ |
| ✅ | buyFromVendorNo | รหัสเจ้าหนี้ (buy-from) |
| ✅ | currencyCode | สกุลเงิน |
| ✅ | documentDate | วันที่เอกสาร |
| ✅ | externalDocumentNo | เลขอ้างอิง (invoice จาก vendor) |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 16. `gLEntries` — 74 fields → เลือก 22

รายการบัญชีแยกประเภท — ทำ P&L, งบการเงิน

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | entryNo | PK |
| ✅ | gLAccountNo | รหัสบัญชี |
| ✅ | gLAccountName | ชื่อบัญชี |
| ✅ | postingDate | วันที่ลง |
| ✅ | documentType | ประเภท (Invoice, Payment...) |
| ✅ | documentNo | เลขเอกสาร |
| ✅ | descriptionValue | รายละเอียด |
| ✅ | amountValue | ยอด |
| ✅ | debitAmount | เดบิต |
| ✅ | creditAmount | เครดิต |
| ✅ | globalDimension1Code | มิติ 1 |
| ✅ | globalDimension2Code | มิติ 2 |
| ✅ | sourceType | ประเภท source (Customer, Vendor, Bank...) |
| ✅ | sourceNo | รหัส source |
| ✅ | genPostingType | ประเภท posting (Sale, Purchase) |
| ✅ | genBusPostingGroup | DOMESTIC/FOREIGN |
| ✅ | genProdPostingGroup | FG/RM/SP |
| ✅ | documentDate | วันที่เอกสาร |
| ✅ | externalDocumentNo | เลขอ้างอิง |
| ✅ | vATAmount | ยอด VAT |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 17. `glAccounts` — 66 fields → เลือก 12

ผังบัญชี (Chart of Accounts) — ใช้ decode GL account

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | no | PK — รหัสบัญชี |
| ✅ | nameValue | ชื่อบัญชี |
| ✅ | accountType | ประเภท (Posting, Heading, Total, Begin/End-Total) |
| ✅ | accountCategory | หมวด (Assets, Liabilities, Equity, Income, Expense) |
| ✅ | incomeBalance | Income Statement / Balance Sheet |
| ✅ | debitCredit | Debit / Credit / Both |
| ✅ | balance | ยอดคงเหลือ |
| ✅ | netChange | ยอดเปลี่ยนแปลง |
| ✅ | blocked | สถานะ block |
| ✅ | directPosting | post ได้โดยตรงหรือไม่ |
| ✅ | indentation | ระดับ indent (สำหรับ tree structure) |
| ✅ | totaling | สูตรรวม |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 18. `bankAccountLedgerEntries` — 50 fields → เลือก 18

เคลื่อนไหวธนาคาร — bank reconciliation

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | entryNo | PK |
| ✅ | bankAccountNo | รหัสบัญชีธนาคาร |
| ✅ | postingDate | วันที่ลง |
| ✅ | documentType | ประเภท (Payment, Refund...) |
| ✅ | documentNo | เลขเอกสาร |
| ✅ | description | รายละเอียด |
| ✅ | amount | ยอด |
| ✅ | remainingAmount | ยอดคงเหลือ |
| ✅ | amountLCY | ยอด (THB) |
| ✅ | debitAmount | เดบิต |
| ✅ | creditAmount | เครดิต |
| ✅ | globalDimension1Code | มิติ 1 |
| ✅ | globalDimension2Code | มิติ 2 |
| ✅ | openValue | เปิด/ปิด |
| ✅ | currencyCode | สกุลเงิน |
| ✅ | documentDate | วันที่เอกสาร |
| ✅ | externalDocumentNo | เลขอ้างอิง |
| ✅ | statementStatus | สถานะ reconciliation |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 19. `detailedCustLedgerEntries` — 41 fields → เลือก 16

รายละเอียด AR — payment applied, partial payment

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | entryNo | PK |
| ✅ | custLedgerEntryNo | FK — เชื่อม customerLedgerEntries |
| ✅ | entryType | ประเภท (Initial Entry, Application...) |
| ✅ | postingDate | วันที่ลง |
| ✅ | documentType | ประเภทเอกสาร |
| ✅ | documentNo | เลขเอกสาร |
| ✅ | amount | ยอด |
| ✅ | amountLCY | ยอด (THB) |
| ✅ | customerNo | รหัสลูกค้า |
| ✅ | currencyCode | สกุลเงิน |
| ✅ | debitAmount | เดบิต |
| ✅ | creditAmount | เครดิต |
| ✅ | initialEntryDueDate | วันครบกำหนดเดิม |
| ✅ | initialEntryGlobalDim1 | มิติ 1 |
| ✅ | initialEntryGlobalDim2 | มิติ 2 |
| ✅ | initialDocumentType | ประเภทเอกสารเดิม |
| ✅ | appliedCustLedgerEntryNo | entry ที่ apply กัน |
| ✅ | unapplied | ถูก unapply หรือไม่ |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 20. `detailedVendorLedgerEntries` — 41 fields → เลือก 16

รายละเอียด AP — payment applied, partial payment

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | entryNo | PK |
| ✅ | vendorLedgerEntryNo | FK — เชื่อม vendorLedgerEntries |
| ✅ | entryType | ประเภท (Initial Entry, Application...) |
| ✅ | postingDate | วันที่ลง |
| ✅ | documentType | ประเภทเอกสาร |
| ✅ | documentNo | เลขเอกสาร |
| ✅ | amount | ยอด |
| ✅ | amountLCY | ยอด (THB) |
| ✅ | vendorNo | รหัสเจ้าหนี้ |
| ✅ | currencyCode | สกุลเงิน |
| ✅ | debitAmount | เดบิต |
| ✅ | creditAmount | เครดิต |
| ✅ | initialEntryDueDate | วันครบกำหนดเดิม |
| ✅ | initialEntryGlobalDim1 | มิติ 1 |
| ✅ | initialEntryGlobalDim2 | มิติ 2 |
| ✅ | initialDocumentType | ประเภทเอกสารเดิม |
| ✅ | appliedVendLedgerEntryNo | entry ที่ apply กัน |
| ✅ | unapplied | ถูก unapply หรือไม่ |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 21. `purchaseOrders` — 160 fields → เลือก 28

ใบสั่งซื้อ — PO ค้างรับ, ต้นทุนจัดซื้อ

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | noValue | PK — เลข PO |
| ✅ | buyFromVendorNo | รหัสเจ้าหนี้ |
| ✅ | buyFromVendorName | ชื่อเจ้าหนี้ |
| ✅ | buyFromAddress | ที่อยู่ |
| ✅ | buyFromAddress2 | ที่อยู่ (ต่อ) |
| ✅ | buyFromCity | เมือง |
| ✅ | buyFromPostCode | รหัสไปรษณีย์ |
| ✅ | orderDate | วันที่สั่ง |
| ✅ | postingDate | วันที่ลงบัญชี |
| ✅ | expectedReceiptDate | วันที่คาดว่าจะรับ |
| ✅ | dueDate | วันครบกำหนด |
| ✅ | documentDate | วันที่เอกสาร |
| ✅ | amountValue | ยอดรวม |
| ✅ | amountIncludingVAT | ยอดรวม VAT |
| ✅ | purchaserCode | ผู้จัดซื้อ |
| ✅ | shortcutDimension1Code | มิติ 1 |
| ✅ | shortcutDimension2Code | มิติ 2 |
| ✅ | locationCode | คลัง |
| ✅ | currencyCode | สกุลเงิน |
| ✅ | currencyFactor | อัตราแลกเปลี่ยน |
| ✅ | paymentTermsCode | เงื่อนไขชำระ |
| ✅ | paymentMethodCode | วิธีจ่าย |
| ✅ | vendorInvoiceNo | เลข invoice จาก vendor |
| ✅ | vendorOrderNo | เลข PO จาก vendor |
| ✅ | status | สถานะ (Open, Released) |
| ✅ | completelyReceived | รับครบแล้วหรือยัง |
| ✅ | invoiceDiscountAmount | ส่วนลด |
| ✅ | assignedUserID | ผู้รับผิดชอบ |
| ✅ | genBusPostingGroup | DOMESTIC/FOREIGN |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 22. `purchaseOrderLines` — nested ใน purchaseOrders → เลือก 22

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | documentNo | เลข PO (FK) |
| ✅ | lineNo | ลำดับ |
| ✅ | typeValue | ประเภท (Item, G/L Account...) |
| ✅ | noValue | รหัสสินค้า |
| ✅ | descriptionValue | ชื่อสินค้า |
| ✅ | description2 | ชื่อเพิ่มเติม |
| ✅ | quantityValue | จำนวนสั่ง |
| ✅ | outstandingQuantity | จำนวนค้างรับ |
| ✅ | quantityReceived | จำนวนรับแล้ว |
| ✅ | quantityInvoiced | จำนวนออก invoice แล้ว |
| ✅ | directUnitCost | ราคาต่อหน่วย |
| ✅ | amountValue | ยอด |
| ✅ | amountIncludingVAT | ยอดรวม VAT |
| ✅ | lineDiscount | ส่วนลด % |
| ✅ | unitOfMeasureCode | หน่วย |
| ✅ | locationCode | คลัง |
| ✅ | shortcutDimension1Code | มิติ 1 |
| ✅ | shortcutDimension2Code | มิติ 2 |
| ✅ | genProdPostingGroup | group สินค้า |
| ✅ | itemCategoryCode | หมวดหมู่ |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 23. `postedPurchInvoices` — 114 fields → เลือก 25

ใบซื้อที่ post แล้ว — ต้นทุนซื้อจริง

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | noValue | PK — เลข Invoice |
| ✅ | buyFromVendorNo | รหัสเจ้าหนี้ |
| ✅ | buyFromVendorName | ชื่อเจ้าหนี้ |
| ✅ | orderNo | เลข PO ต้นทาง |
| ✅ | orderDate | วันที่สั่ง |
| ✅ | postingDate | วันที่ลงบัญชี |
| ✅ | documentDate | วันที่เอกสาร |
| ✅ | dueDate | วันครบกำหนด |
| ✅ | amountValue | ยอดรวม |
| ✅ | amountIncludingVAT | ยอดรวม VAT |
| ✅ | purchaserCode | ผู้จัดซื้อ |
| ✅ | shortcutDimension1Code | มิติ 1 |
| ✅ | shortcutDimension2Code | มิติ 2 |
| ✅ | locationCode | คลัง |
| ✅ | currencyCode | สกุลเงิน |
| ✅ | currencyFactor | อัตราแลกเปลี่ยน |
| ✅ | paymentTermsCode | เงื่อนไขชำระ |
| ✅ | paymentMethodCode | วิธีจ่าย |
| ✅ | vendorInvoiceNo | เลข invoice จาก vendor |
| ✅ | vendorOrderNo | เลข PO จาก vendor |
| ✅ | genBusPostingGroup | DOMESTIC/FOREIGN |
| ✅ | remainingAmount | ยอดค้างจ่าย |
| ✅ | closedValue | ปิดแล้วหรือยัง |
| ✅ | invoiceDiscountAmount | ส่วนลด |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 24. `postedPurchInvoiceLines` — nested ใน postedPurchInvoices → เลือก 20

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | documentNo | เลข Invoice (FK) |
| ✅ | lineNo | ลำดับ |
| ✅ | typeValue | ประเภท |
| ✅ | noValue | รหัสสินค้า |
| ✅ | descriptionValue | ชื่อสินค้า |
| ✅ | description2 | ชื่อเพิ่มเติม |
| ✅ | quantityValue | จำนวน |
| ✅ | directUnitCost | ราคาต่อหน่วย |
| ✅ | amountValue | ยอด |
| ✅ | amountIncludingVAT | ยอดรวม VAT |
| ✅ | lineDiscount | ส่วนลด % |
| ✅ | unitOfMeasureCode | หน่วย |
| ✅ | locationCode | คลัง |
| ✅ | shortcutDimension1Code | มิติ 1 |
| ✅ | shortcutDimension2Code | มิติ 2 |
| ✅ | genProdPostingGroup | group สินค้า |
| ✅ | itemCategoryCode | หมวดหมู่ |
| ✅ | variantCode | variant |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 25. `postedSalesShipments` — 110 fields → เลือก 20

ใบส่งของ — track การจัดส่ง

**หมายเหตุ:** entity นี้ใช้ `no` ไม่ใช่ `noValue`

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | no | PK — เลขใบส่งของ |
| ✅ | sellToCustomerNo | รหัสลูกค้า |
| ✅ | sellToCustomerName | ชื่อลูกค้า |
| ✅ | orderNo | เลข SO ต้นทาง |
| ✅ | orderDate | วันที่สั่ง |
| ✅ | postingDate | วันที่ลง |
| ✅ | shipmentDate | วันที่ส่ง |
| ✅ | documentDate | วันที่เอกสาร |
| ✅ | salespersonCode | พนักงานขาย |
| ✅ | shortcutDimension1Code | มิติ 1 |
| ✅ | shortcutDimension2Code | มิติ 2 |
| ✅ | locationCode | คลัง |
| ✅ | currencyCode | สกุลเงิน |
| ✅ | externalDocumentNo | เลขอ้างอิง |
| ✅ | shipmentMethodCode | วิธีจัดส่ง |
| ✅ | shippingAgentCode | บริษัทขนส่ง |
| ✅ | packageTrackingNo | tracking number |
| ✅ | requestedDeliveryDate | วันที่ต้องการส่ง |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 25b. `postedSalesShipmentLines` — nested ใน postedSalesShipments → เลือก 16

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | documentNo | เลขใบส่งของ (FK) |
| ✅ | lineNo | ลำดับ |
| ✅ | typeValue | ประเภท |
| ✅ | noValue | รหัสสินค้า |
| ✅ | descriptionValue | ชื่อสินค้า |
| ✅ | description2 | ชื่อเพิ่มเติม |
| ✅ | quantityValue | จำนวนส่ง |
| ✅ | unitOfMeasureCode | หน่วย |
| ✅ | locationCode | คลัง |
| ✅ | shortcutDimension1Code | มิติ 1 |
| ✅ | shortcutDimension2Code | มิติ 2 |
| ✅ | genProdPostingGroup | group สินค้า |
| ✅ | itemCategoryCode | หมวดหมู่ |
| ✅ | variantCode | variant |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 26. `postedSalesCreditMemos` — 126 fields → เลือก 22

ใบลดหนี้ — สินค้าคืน, ยอดลดหนี้

**หมายเหตุ:** entity นี้ใช้ `no` ไม่ใช่ `noValue`

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | no | PK — เลขใบลดหนี้ |
| ✅ | sellToCustomerNo | รหัสลูกค้า |
| ✅ | sellToCustomerName | ชื่อลูกค้า |
| ✅ | postingDate | วันที่ลง |
| ✅ | documentDate | วันที่เอกสาร |
| ✅ | dueDate | วันครบกำหนด |
| ✅ | amount | ยอดรวม |
| ✅ | amountIncludingVAT | ยอดรวม VAT |
| ✅ | salespersonCode | พนักงานขาย |
| ✅ | shortcutDimension1Code | มิติ 1 |
| ✅ | shortcutDimension2Code | มิติ 2 |
| ✅ | locationCode | คลัง |
| ✅ | currencyCode | สกุลเงิน |
| ✅ | currencyFactor | อัตราแลกเปลี่ยน |
| ✅ | externalDocumentNo | เลขอ้างอิง |
| ✅ | genBusPostingGroup | DOMESTIC/FOREIGN |
| ✅ | remainingAmount | ยอดคงเหลือ |
| ✅ | paid | จ่ายแล้วหรือยัง |
| ✅ | cancelled | ยกเลิกหรือไม่ |
| ✅ | corrective | แก้ไขหรือไม่ |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 26b. `postedSalesCreditMemoLines` — nested ใน postedSalesCreditMemos → เลือก 18

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | documentNo | เลขใบลดหนี้ (FK) |
| ✅ | lineNo | ลำดับ |
| ✅ | typeValue | ประเภท |
| ✅ | noValue | รหัสสินค้า |
| ✅ | descriptionValue | ชื่อสินค้า |
| ✅ | description2 | ชื่อเพิ่มเติม |
| ✅ | quantityValue | จำนวนคืน |
| ✅ | unitPrice | ราคาต่อหน่วย |
| ✅ | unitCost | ต้นทุนต่อหน่วย |
| ✅ | amountValue | ยอด |
| ✅ | amountIncludingVAT | ยอดรวม VAT |
| ✅ | lineDiscount | ส่วนลด % |
| ✅ | unitOfMeasureCode | หน่วย |
| ✅ | locationCode | คลัง |
| ✅ | shortcutDimension1Code | มิติ 1 |
| ✅ | shortcutDimension2Code | มิติ 2 |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 27. `salesQuotes` — 183 fields → เลือก 22

ใบเสนอราคา — วิเคราะห์ conversion rate (quote → order)

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | noValue | PK — เลขใบเสนอราคา |
| ✅ | sellToCustomerNo | รหัสลูกค้า |
| ✅ | sellToCustomerName | ชื่อลูกค้า |
| ✅ | orderDate | วันที่ |
| ✅ | dueDate | วันครบกำหนด |
| ✅ | documentDate | วันที่เอกสาร |
| ✅ | amountValue | ยอดรวม |
| ✅ | amountIncludingVAT | ยอดรวม VAT |
| ✅ | salespersonCode | พนักงานขาย |
| ✅ | shortcutDimension1Code | มิติ 1 |
| ✅ | shortcutDimension2Code | มิติ 2 |
| ✅ | locationCode | คลัง |
| ✅ | currencyCode | สกุลเงิน |
| ✅ | externalDocumentNo | เลขอ้างอิง |
| ✅ | status | สถานะ |
| ✅ | quoteValidUntilDate | วันหมดอายุใบเสนอราคา |
| ✅ | quoteAccepted | ลูกค้ายอมรับแล้วหรือยัง |
| ✅ | quoteAcceptedDate | วันที่ยอมรับ |
| ✅ | opportunityNo | เลข opportunity (CRM) |
| ✅ | assignedUserID | ผู้รับผิดชอบ |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 28. `fixedAssets` — 34 fields → เลือก 18

สินทรัพย์ถาวร

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | no | PK — รหัสสินทรัพย์ |
| ✅ | description | ชื่อ |
| ✅ | description2 | ชื่อเพิ่มเติม |
| ✅ | fAClassCode | ประเภทสินทรัพย์ |
| ✅ | fASubclassCode | ประเภทย่อย |
| ✅ | globalDimension1Code | มิติ 1 |
| ✅ | globalDimension2Code | มิติ 2 |
| ✅ | locationCode | สถานที่ |
| ✅ | fALocationCode | สถานที่ FA |
| ✅ | vendorNo | ผู้ขาย |
| ✅ | responsibleEmployee | ผู้รับผิดชอบ |
| ✅ | serialNo | serial number |
| ✅ | warrantyDate | วันหมดประกัน |
| ✅ | acquired | ได้มาแล้วหรือยัง |
| ✅ | inactive | ไม่ใช้งานหรือไม่ |
| ✅ | blocked | สถานะ block |
| ✅ | fAPostingGroup | group posting |
| ✅ | lastDateModified | วันที่แก้ไขล่าสุด |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด (system) |

---

## 29. `faLedgerEntries` — 84 fields → เลือก 18

รายการเคลื่อนไหวสินทรัพย์ถาวร — ค่าเสื่อม, ซื้อ, ขาย

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | entryNo | PK |
| ✅ | fANo | รหัสสินทรัพย์ |
| ✅ | fAPostingDate | วันที่ FA |
| ✅ | postingDate | วันที่ลงบัญชี |
| ✅ | documentType | ประเภทเอกสาร |
| ✅ | documentNo | เลขเอกสาร |
| ✅ | description | รายละเอียด |
| ✅ | fAPostingType | ประเภท (Acquisition, Depreciation, Disposal...) |
| ✅ | amount | ยอด |
| ✅ | debitAmount | เดบิต |
| ✅ | creditAmount | เครดิต |
| ✅ | depreciationBookCode | สมุดค่าเสื่อม |
| ✅ | globalDimension1Code | มิติ 1 |
| ✅ | globalDimension2Code | มิติ 2 |
| ✅ | noOfDepreciationDays | จำนวนวันค่าเสื่อม |
| ✅ | fAClassCode | ประเภทสินทรัพย์ |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 30. `bankAccounts` — 80 fields → เลือก 14

Master data ธนาคาร

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | no | PK — รหัสบัญชีธนาคาร |
| ✅ | nameValue | ชื่อบัญชี |
| ✅ | bankAccountNo | เลขบัญชีธนาคาร |
| ✅ | bankBranchNo | สาขา |
| ✅ | currencyCode | สกุลเงิน |
| ✅ | balance | ยอดคงเหลือ |
| ✅ | balanceLCY | ยอดคงเหลือ (THB) |
| ✅ | iBAN | IBAN |
| ✅ | sWIFTCode | SWIFT code |
| ✅ | globalDimension1Code | มิติ 1 |
| ✅ | globalDimension2Code | มิติ 2 |
| ✅ | blocked | สถานะ block |
| ✅ | createdAt | วันที่สร้าง |
| ✅ | lastModifiedDateTime | วันที่แก้ไขล่าสุด |

---

## 31. `dimensionSetEntries` — 10 fields → เลือก 8

Lookup มิติ 3-8 จาก dimensionSetID

| | Field | ทำไมถึงเลือก |
|---|---|---|
| ✅ | dimensionSetID | FK — เชื่อมกับทุก entity ที่มี dimensionSetID |
| ✅ | dimensionCode | รหัสมิติ (DEPARTMENT, PROJECT, CAR...) |
| ✅ | dimensionValueCode | รหัสค่ามิติ |
| ✅ | dimensionValueID | ID ค่ามิติ |
| ✅ | dimensionName | ชื่อมิติ |
| ✅ | dimensionValueName | ชื่อค่ามิติ |
| ✅ | globalDimensionNo | ลำดับมิติ (1-8) |
| ✅ | createdAt | วันที่สร้าง |

---

## สรุปจำนวน fields ที่เลือก

| Entity | ทั้งหมด | เลือก | ลดลง |
|---|---|---|---|
| dimensionValues | 17 | 3 | 82% |
| customers | 162 | 30 | 81% |
| items | 85 | 23 | 73% |
| salesOrders | 181 | 43 | 76% |
| salesOrderLines | 173 | 38 | 78% |
| productionOrders | 54 | 29 | 46% |
| productionOrderLines | 62 | 27 | 56% |
| itemLedgerEntries | 76 | 32 | 58% |
| **postedSalesInvoices** | **139** | **30** | **78%** |
| **postedSalesInvoiceLines** | **100** | **22** | **78%** |
| **salesInvoices** | **181** | **25** | **86%** |
| **valueEntries** | **69** | **25** | **64%** |
| **customerLedgerEntries** | **92** | **25** | **73%** |
| **vendors** | **141** | **27** | **81%** |
| **vendorLedgerEntries** | **87** | **24** | **72%** |
| **gLEntries** | **74** | **22** | **70%** |
| **glAccounts** | **66** | **14** | **79%** |
| **bankAccountLedgerEntries** | **50** | **20** | **60%** |
| **detailedCustLedgerEntries** | **41** | **20** | **51%** |
| **detailedVendorLedgerEntries** | **41** | **20** | **51%** |
| **purchaseOrders** | **160** | **31** | **81%** |
| **purchaseOrderLines** | **184** | **22** | **88%** |
| **postedPurchInvoices** | **114** | **26** | **77%** |
| **postedPurchInvoiceLines** | **112** | **20** | **82%** |
| **postedSalesShipments** | **110** | **20** | **82%** |
| **postedSalesCreditMemos** | **126** | **22** | **83%** |
| **salesQuotes** | **183** | **22** | **88%** |
| **fixedAssets** | **34** | **20** | **41%** |
| **faLedgerEntries** | **84** | **18** | **79%** |
| **bankAccounts** | **80** | **14** | **83%** |
| **dimensionSetEntries** | **10** | **8** | **20%** |
| **รวม** | **3088** | **723** | **77%** |

## Report ที่ทำได้จาก fields ที่เลือก

### ขาย (Sales)
- **ยอดขายจริง (Invoiced)** ตาม salesperson / มิติ 1 / มิติ 2 / ลูกค้า / สินค้า / เดือน
- **ยอดขาย SO** (ordered) vs **ยอดจริง** (invoiced) — เปรียบเทียบ pipeline
- **ต้นทุน + กำไร** per item, per project, per customer
- **On-time delivery** — เทียบ requestedDeliveryDate vs lastShipmentDate

### ลูกหนี้ (AR)
- **AR Aging** ยอดค้างรับตามอายุหนี้ (dueDate vs today)
- **Payment tracking** — invoice ค้างเก็บเงิน, partial payment
- **Outstanding** SO ค้างส่ง, Invoice ค้าง post, ค้างชำระ

### เจ้าหนี้ (AP)
- **AP Aging** ยอดค้างจ่ายตามอายุหนี้
- **Payment tracking** — invoice ค้างจ่าย, partial payment
- **Vendor analysis** ยอดซื้อ/ค้างจ่ายตาม vendor

### การเงิน/บัญชี (Finance)
- **P&L** งบกำไรขาดทุน จาก GL entries
- **งบดุล** จาก GL accounts + entries
- **Bank reconciliation** เคลื่อนไหวธนาคาร
- **GL analysis** ตามบัญชี / มิติ / เดือน

### จัดซื้อ (Purchase)
- **ยอดซื้อจริง** ตาม vendor / item / project / เดือน
- **PO outstanding** ค้างรับสินค้า
- **Vendor performance** lead time, on-time delivery

### การผลิต (Production)
- **Production cost** ตามแผนก / สถานะ / ต้นทุน
- **Inventory movement** consumption vs output ตาม location / dimension

### สินทรัพย์ถาวร (Fixed Assets)
- **FA register** สินทรัพย์ทั้งหมด ตามประเภท / สถานที่
- **ค่าเสื่อมราคา** ตามเดือน / ประเภท

### อื่นๆ
- **Quote → Order conversion** วิเคราะห์ pipeline
- **Credit Memo analysis** สินค้าคืน / ลดหนี้
- **Shipment tracking** ตาม shipping agent / method
- **Multi-dimension analysis** ผ่าน dimensionSetEntries (มิติ 3-8)

## Custom Fields ที่ API ใหม่ไม่มี

| Entity | Field เดิม | ผลกระทบ |
|---|---|---|
| productionOrders | `BWK_Remaining_Consumption` | ต้องคำนวณเองหรือเพิ่มใน extension |
| itemLedgerEntries | `BWK_Create_By` | หาว่าใครสร้าง entry ไม่ได้ |
| itemLedgerEntries | `BWK_Bin_Code` | หา bin location ไม่ได้ |
| itemLedgerEntries | `Cost_Amount_Expected/Actual` | ✅ แก้แล้ว — ใช้ valueEntries แทน |
