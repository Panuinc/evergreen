# Evergreen BC Extension — API Documentation

**Base URL**
```
https://api.businesscentral.dynamics.com/v2.0/02b9e7ae-caa9-4b54-90cf-7ffdba07084c/Production/api/evergreen/erp/v1.0
```

**Authentication:** OAuth2 Bearer Token (AAD)

**Company ID:** `a407ba9f-2151-ec11-9f09-000d3ac85269`

**Version:** 1.0.0.9 | Page IDs: 70100–70145

---

## All Endpoints

| # | Entity Set | Source Table | Fields | Nested |
|---|-----------|-------------|--------|--------|
| 1 | `items` | Item | ~100 | — |
| 2 | `salesOrders` | Sales Header (Order) | 182 | salesOrderLines |
| 3 | `salesOrderLines` | Sales Line (Order) | 173 | — |
| 4 | `salesQuotes` | Sales Header (Quote) | 182 | salesQuoteLines |
| 5 | `salesQuoteLines` | Sales Line (Quote) | 173 | — |
| 6 | `salesInvoices` | Sales Header (Invoice) | 182 | salesInvoiceLines |
| 7 | `salesInvoiceLines` | Sales Line (Invoice) | 173 | — |
| 8 | `salesCreditMemos` | Sales Header (Credit Memo) | 182 | salesCreditMemoLines |
| 9 | `salesCreditMemoLines` | Sales Line (Credit Memo) | 173 | — |
| 10 | `postedSalesInvoices` | Sales Invoice Header | 137 | postedSalesInvoiceLines |
| 11 | `postedSalesInvoiceLines` | Sales Invoice Line | 97 | — |
| 12 | `postedSalesShipments` | Sales Shipment Header | 109 | postedSalesShipmentLines |
| 13 | `postedSalesShipmentLines` | Sales Shipment Line | 99 | — |
| 14 | `postedSalesCreditMemos` | Sales Cr.Memo Header | 125 | postedSalesCreditMemoLines |
| 15 | `postedSalesCreditMemoLines` | Sales Cr.Memo Line | 99 | — |
| 16 | `purchaseOrders` | Purchase Header (Order) | 159 | purchaseOrderLines |
| 17 | `purchaseOrderLines` | Purchase Line (Order) | 184 | — |
| 18 | `purchaseInvoices` | Purchase Header (Invoice) | 159 | purchaseInvoiceLines |
| 19 | `purchaseInvoiceLines` | Purchase Line (Invoice) | 184 | — |
| 20 | `purchaseCreditMemos` | Purchase Header (Credit Memo) | 159 | purchaseCreditMemoLines |
| 21 | `purchaseCreditMemoLines` | Purchase Line (Credit Memo) | 184 | — |
| 22 | `postedPurchInvoices` | Purch. Inv. Header | 110 | postedPurchInvoiceLines |
| 23 | `postedPurchInvoiceLines` | Purch. Inv. Line | 109 | — |
| 24 | `postedPurchaseReceipts` | Purch. Rcpt. Header | 98 | postedPurchaseReceiptLines |
| 25 | `postedPurchaseReceiptLines` | Purch. Rcpt. Line | 119 | — |
| 26 | `postedPurchaseCreditMemos` | Purch. Cr. Memo Hdr. | 107 | postedPurchaseCreditMemoLines |
| 27 | `postedPurchaseCreditMemoLines` | Purch. Cr. Memo Line | 118 | — |
| 28 | `productionOrders` | Production Order | ~51 | productionOrderLines |
| 29 | `productionOrderLines` | Prod. Order Line | ~59 | productionOrderComponents |
| 30 | `productionOrderComponents` | Prod. Order Component | ~59 | — |
| 31 | `customers` | Customer | 163 | — |
| 32 | `vendors` | Vendor | 142 | — |
| 33 | `bankAccounts` | Bank Account | ~77 | — |
| 34 | `glAccounts` | G/L Account | 63 | — |
| 35 | `gLEntries` | G/L Entry | 72 | — |
| 36 | `customerLedgerEntries` | Cust. Ledger Entry | 92 | — |
| 37 | `detailedCustLedgerEntries` | Detailed Cust. Ledg. Entry | 38 | — |
| 38 | `vendorLedgerEntries` | Vendor Ledger Entry | 87 | — |
| 39 | `detailedVendorLedgerEntries` | Detailed Vendor Ledg. Entry | 38 | — |
| 40 | `bankAccountLedgerEntries` | Bank Account Ledger Entry | 47 | — |
| 41 | `valueEntries` | Value Entry | 66 | — |
| 42 | `itemLedgerEntries` | Item Ledger Entry | 73 | — |
| 43 | `fixedAssets` | Fixed Asset | ~31 | — |
| 44 | `faLedgerEntries` | FA Ledger Entry | 81 | — |
| 45 | `dimensionSetEntries` | Dimension Set Entry | 7 | — |
| 46 | `dimensionValues` | Dimension Value | 14 | — |

---

## OData Query Patterns

```
# Get all
GET /companies({companyId})/{entitySet}

# Get by SystemId
GET /companies({companyId})/{entitySet}({id})

# Expand nested lines
GET /companies({companyId})/salesOrders?$expand=salesOrderLines
GET /companies({companyId})/purchaseOrders?$expand=purchaseOrderLines
GET /companies({companyId})/postedSalesInvoices?$expand=postedSalesInvoiceLines
GET /companies({companyId})/postedPurchaseReceipts?$expand=postedPurchaseReceiptLines

# Filter
?$filter=sellToCustomerNo eq 'C001'
?$filter=postingDate ge 2024-01-01 and postingDate le 2024-12-31
?$filter=status eq 'Released'

# Select fields
?$select=no,sellToCustomerName,amount,amountIncludingVAT

# Pagination
?$top=100&$skip=0

# Combined
?$filter=status eq 'Released'&$expand=salesOrderLines&$top=50
```

---

## Sales Documents

### Unposted

| Type | Header EntitySet | Line EntitySet |
|------|-----------------|----------------|
| Order | `salesOrders` | `salesOrderLines` |
| Quote | `salesQuotes` | `salesQuoteLines` |
| Invoice | `salesInvoices` | `salesInvoiceLines` |
| Credit Memo | `salesCreditMemos` | `salesCreditMemoLines` |

```
GET /companies({companyId})/salesOrders?$expand=salesOrderLines
GET /companies({companyId})/salesQuotes?$expand=salesQuoteLines
GET /companies({companyId})/salesInvoices?$expand=salesInvoiceLines
GET /companies({companyId})/salesCreditMemos?$expand=salesCreditMemoLines
```

### Posted

| Type | Header EntitySet | Line EntitySet |
|------|-----------------|----------------|
| Invoice | `postedSalesInvoices` | `postedSalesInvoiceLines` |
| Shipment | `postedSalesShipments` | `postedSalesShipmentLines` |
| Credit Memo | `postedSalesCreditMemos` | `postedSalesCreditMemoLines` |

```
GET /companies({companyId})/postedSalesInvoices?$expand=postedSalesInvoiceLines
GET /companies({companyId})/postedSalesShipments?$expand=postedSalesShipmentLines
GET /companies({companyId})/postedSalesCreditMemos?$expand=postedSalesCreditMemoLines
```

---

## Purchase Documents

### Unposted

| Type | Header EntitySet | Line EntitySet |
|------|-----------------|----------------|
| Order | `purchaseOrders` | `purchaseOrderLines` |
| Invoice | `purchaseInvoices` | `purchaseInvoiceLines` |
| Credit Memo | `purchaseCreditMemos` | `purchaseCreditMemoLines` |

### Posted

| Type | Header EntitySet | Line EntitySet |
|------|-----------------|----------------|
| Invoice | `postedPurchInvoices` | `postedPurchInvoiceLines` |
| Receipt | `postedPurchaseReceipts` | `postedPurchaseReceiptLines` |
| Credit Memo | `postedPurchaseCreditMemos` | `postedPurchaseCreditMemoLines` |

```
GET /companies({companyId})/postedPurchInvoices?$expand=postedPurchInvoiceLines
GET /companies({companyId})/postedPurchaseReceipts?$expand=postedPurchaseReceiptLines
GET /companies({companyId})/postedPurchaseCreditMemos?$expand=postedPurchaseCreditMemoLines
```

---

## Production

```
GET /companies({companyId})/productionOrders?$expand=productionOrderLines
GET /companies({companyId})/productionOrders?$expand=productionOrderLines($expand=productionOrderComponents)
```

---

## Master Data

```
GET /companies({companyId})/customers
GET /companies({companyId})/vendors
GET /companies({companyId})/bankAccounts
GET /companies({companyId})/items
```

---

## Finance / Ledger

```
GET /companies({companyId})/glAccounts
GET /companies({companyId})/gLEntries?$filter=postingDate ge 2024-01-01
GET /companies({companyId})/customerLedgerEntries?$filter=customerNo eq 'C001'
GET /companies({companyId})/detailedCustLedgerEntries
GET /companies({companyId})/vendorLedgerEntries
GET /companies({companyId})/detailedVendorLedgerEntries
GET /companies({companyId})/bankAccountLedgerEntries
GET /companies({companyId})/valueEntries
GET /companies({companyId})/itemLedgerEntries
```

---

## Dimensions

```
# Decode dimensionSetId จาก ledger entries
GET /companies({companyId})/dimensionSetEntries?$filter=dimensionSetID eq 12345

# ดู dimension values ทั้งหมด
GET /companies({companyId})/dimensionValues
GET /companies({companyId})/dimensionValues?$filter=dimensionCode eq 'DEPARTMENT'
```

**Dimension Set Entry fields:** `dimensionSetID`, `dimensionCode`, `dimensionValueCode`, `dimensionValueID`, `dimensionName`, `dimensionValueName`, `globalDimensionNo`

**Dimension Value fields:** `dimensionCode`, `codeValue`, `nameValue`, `dimensionValueType`, `totaling`, `blockedValue`, `consolidationCode`, `indentation`, `globalDimensionNo`, `mapToICDimensionCode`, `mapToICDimensionValueCode`, `dimensionValueID`, `lastModifiedDateTimeBC`, `dimensionId`

---

## Fixed Assets

```
GET /companies({companyId})/fixedAssets
GET /companies({companyId})/faLedgerEntries?$filter=fANo eq 'FA001'
```

---

## Notes

- **id** = `SystemId` (GUID) — OData key สำหรับทุก endpoint
- **FlowFields** (Balance, Amount, Inventory ฯลฯ) ถูก CalcFields อัตโนมัติใน `OnAfterGetRecord`
- Reserved keyword renames: `type` → `lineType`, `area` → `areaCode`, `name` → `nameValue`
- ทุก endpoint เป็น read-only (`InsertAllowed/ModifyAllowed/DeleteAllowed = false`)
- Line endpoints เรียกได้ทั้งผ่าน parent (`/salesOrders({id})/salesOrderLines`) หรือ standalone
