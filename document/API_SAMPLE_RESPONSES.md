# Evergreen BC Extension — Sample API Responses (ทุก Endpoint)

**Base URL:** `https://api.businesscentral.dynamics.com/v2.0/{tenantId}/{environment}/api/evergreen/erp/v1.0/companies({companyId})/`

> ทุก field ด้านล่างคือ field จริงที่ API return กลับมา พร้อม data type และตัวอย่างข้อมูล 1 record
> Fields ที่เป็น FlowField/CalcField จะมีเครื่องหมาย ⚡ (ต้อง CalcFields ถึงจะมีค่า)
> Fields ที่เป็น BLOB จะมีเครื่องหมาย 💾
> Fields ที่เป็น Media จะมีเครื่องหมาย 🖼️

---

## 1. `items` — Item Master

**GET** `/items`
**Source Table:** Item | **Page ID:** 70100

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",       // Guid (SystemId)
  "no": "ITEM-1000",                                     // Code[20]
  "description": "Bicycle Chain",                         // Text[100]
  "description2": "",                                     // Text[50]
  "searchDescription": "BICYCLE CHAIN",                   // Code[100]
  "type": "Inventory",                                    // Enum (Inventory/Service/Non-Inventory)
  "blocked": false,                                       // Boolean
  "salesBlocked": false,                                  // Boolean
  "purchasingBlocked": false,                             // Boolean
  "lastDateModified": "2025-03-15",                       // Date
  "baseUnitOfMeasure": "PCS",                             // Code[10]
  "salesUnitOfMeasure": "PCS",                            // Code[10]
  "purchUnitOfMeasure": "PCS",                            // Code[10]
  "unitPrice": 250.00,                                    // Decimal
  "priceProfitCalculation": "Profit=Price-Cost",          // Enum
  "profitPct": 30.0,                                      // Decimal
  "unitCost": 175.00,                                     // Decimal
  "standardCost": 170.00,                                 // Decimal
  "lastDirectCost": 165.00,                               // Decimal
  "indirectCostPct": 5.0,                                 // Decimal
  "costingMethod": "FIFO",                                // Enum (FIFO/LIFO/Specific/Average/Standard)
  "vatBusPostingGrPrice": "",                             // Code[20]
  "genProdPostingGroup": "RETAIL",                        // Code[20]
  "vatProdPostingGroup": "VAT7",                          // Code[20]
  "inventoryPostingGroup": "RESALE",                      // Code[20]
  "taxGroupCode": "",                                     // Code[20]
  "globalDimension1Code": "SALES",                        // Code[20]
  "globalDimension2Code": "",                             // Code[20]
  "itemCategoryCode": "PARTS",                            // Code[20]
  "serviceItemGroup": "",                                 // Code[10]
  "inventory": 150.0,                                     // ⚡ Decimal (FlowField)
  "netInvoicedQty": 120.0,                                // ⚡ Decimal (FlowField)
  "qtyInTransit": 0.0,                                    // ⚡ Decimal (FlowField)
  "transOrdReceiptQty": 0.0,                              // ⚡ Decimal (FlowField)
  "transOrdShipmentQty": 0.0,                             // ⚡ Decimal (FlowField)
  "substitutesExist": false,                              // ⚡ Boolean (FlowField)
  "stockkeepingUnitExists": false,                        // ⚡ Boolean (FlowField)
  "assemblyBOM": false,                                   // ⚡ Boolean (FlowField)
  "vendorNo": "V-1001",                                   // Code[20]
  "vendorItemNo": "BC-500",                               // Text[50]
  "leadTimeCalculation": "7D",                            // DateFormula
  "purchasingCode": "",                                   // Code[10]
  "overReceiptCode": "",                                  // Code[20]
  "grossWeight": 0.5,                                     // Decimal
  "netWeight": 0.45,                                      // Decimal
  "unitsPerParcel": 0,                                    // Decimal
  "unitVolume": 0.001,                                    // Decimal
  "reorderPoint": 20.0,                                   // Decimal
  "maximumInventory": 200.0,                              // Decimal
  "reorderQuantity": 50.0,                                // Decimal
  "minimumOrderQuantity": 0.0,                            // Decimal
  "maximumOrderQuantity": 0.0,                            // Decimal
  "safetyStockQuantity": 10.0,                            // Decimal
  "orderMultiple": 0.0,                                   // Decimal
  "safetyLeadTime": "",                                   // DateFormula
  "dampenerPeriod": "",                                   // DateFormula
  "dampenerQuantity": 0.0,                                // Decimal
  "reorderingPolicy": "Fixed Reorder Qty.",               // Enum
  "includeInventory": true,                               // Boolean
  "manufacturingPolicy": "Make-to-Stock",                 // Enum
  "productionBOMNo": "",                                  // Code[20]
  "routingNo": "",                                        // Code[20]
  "scrapPct": 0.0,                                        // Decimal
  "inventoryValueZero": false,                            // Boolean
  "rolledUpMaterialCost": 0.0,                            // Decimal
  "rolledUpCapacityCost": 0.0,                            // Decimal
  "discreteOrderQuantity": 0,                             // Integer
  "itemTrackingCode": "LOTALL",                           // Code[10]
  "lotNos": "LOT-ITEM",                                   // Code[20]
  "serialNos": "",                                        // Code[20]
  "expirationCalculation": "",                            // DateFormula
  "warehouseClassCode": "",                               // Code[10]
  "specialEquipmentCode": "",                             // Code[10]
  "putAwayTemplateCode": "",                              // Code[10]
  "putAwayUnitOfMeasureCode": "",                         // Code[10]
  "costIsAdjusted": true,                                 // Boolean
  "costIsPostedToGL": true,                               // Boolean
  "lastUnitCostCalcDate": "2025-03-01",                   // Date
  "reserve": "Optional",                                  // Enum (Never/Optional/Always)
  "tariffNo": "",                                         // Code[20]
  "dutyDuePct": 0.0,                                      // Decimal
  "dutyCode": "",                                         // Code[10]
  "countryRegionPurchasedCode": "",                       // Code[10]
  "createdAt": "2024-01-15T08:30:00Z",                    // DateTime
  "lastModifiedDateTime": "2025-03-15T14:22:10Z"          // DateTime
}
```

---

## 2. `salesOrders` — Sales Order Header

**GET** `/salesOrders?$expand=salesOrderLines`
**Source Table:** Sales Header (Document Type = Order) | **Page ID:** 70101

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "documentType": "Order",                                // Enum
  "sellToCustomerNo": "C-10000",                          // Code[20]
  "noValue": "SO-1001",                                   // Code[20]
  "billToCustomerNo": "C-10000",                          // Code[20]
  "billToName": "Contoso Ltd.",                            // Text[100]
  "billToName2": "",                                       // Text[50]
  "billToAddress": "100 Day Drive",                        // Text[100]
  "billToAddress2": "",                                    // Text[50]
  "billToCity": "Bangkok",                                 // Text[30]
  "billToContact": "Mr. Smith",                            // Text[100]
  "yourReference": "PO-REF-2025",                          // Text[35]
  "shipToCode": "",                                        // Code[10]
  "shipToName": "Contoso Ltd.",                            // Text[100]
  "shipToName2": "",                                       // Text[50]
  "shipToAddress": "100 Day Drive",                        // Text[100]
  "shipToAddress2": "",                                    // Text[50]
  "shipToCity": "Bangkok",                                 // Text[30]
  "shipToContact": "Mr. Smith",                            // Text[100]
  "orderDate": "2025-03-01",                               // Date
  "postingDate": "2025-03-01",                             // Date
  "shipmentDate": "2025-03-10",                            // Date
  "postingDescription": "Order SO-1001",                   // Text[100]
  "paymentTermsCode": "NET30",                             // Code[10]
  "dueDate": "2025-03-31",                                 // Date
  "paymentDiscount": 0.0,                                  // Decimal
  "pmtDiscountDate": "0001-01-01",                         // Date
  "shipmentMethodCode": "DHL",                             // Code[10]
  "locationCode": "BLUE",                                  // Code[10]
  "shortcutDimension1Code": "SALES",                       // Code[20]
  "shortcutDimension2Code": "",                            // Code[20]
  "customerPostingGroup": "DOMESTIC",                      // Code[20]
  "currencyCode": "",                                      // Code[10]
  "currencyFactor": 0.0,                                   // Decimal
  "customerPriceGroup": "",                                // Code[10]
  "pricesIncludingVAT": false,                             // Boolean
  "invoiceDiscCode": "",                                   // Code[20]
  "customerDiscGroup": "",                                 // Code[20]
  "languageCode": "TH",                                    // Code[10]
  "formatRegion": "",                                      // Text[80]
  "salespersonCode": "JR",                                 // Code[20]
  "orderClass": "",                                        // Code[10]
  "commentValue": true,                                    // ⚡ Boolean (FlowField)
  "noPrinted": 0,                                          // Integer
  "onHold": "",                                            // Code[3]
  "appliesToDocType": " ",                                 // Enum
  "appliesToDocNo": "",                                    // Code[20]
  "balAccountNo": "",                                      // Code[20]
  "recalculateInvoiceDisc": false,                         // ⚡ Boolean (FlowField)
  "ship": true,                                            // Boolean
  "invoice": true,                                         // Boolean
  "printPostedDocuments": true,                            // Boolean
  "amountValue": 5000.00,                                  // ⚡ Decimal (FlowField)
  "amountIncludingVAT": 5350.00,                           // ⚡ Decimal (FlowField)
  "shippingNo": "",                                        // Code[20]
  "postingNo": "",                                         // Code[20]
  "lastShippingNo": "",                                    // Code[20]
  "lastPostingNo": "",                                     // Code[20]
  "prepaymentNo": "",                                      // Code[20]
  "lastPrepaymentNo": "",                                  // Code[20]
  "prepmtCrMemoNo": "",                                    // Code[20]
  "lastPrepmtCrMemoNo": "",                                // Code[20]
  "vATRegistrationNo": "TH1234567890",                     // Text[20]
  "combineShipments": false,                               // Boolean
  "registrationNumber": "",                                // Text[50]
  "reasonCode": "",                                        // Code[10]
  "genBusPostingGroup": "DOMESTIC",                        // Code[20]
  "eU3PartyTrade": false,                                  // Boolean
  "transactionType": "",                                   // Code[10]
  "transportMethod": "",                                   // Code[10]
  "vATCountryRegionCode": "",                              // Code[10]
  "sellToCustomerName": "Contoso Ltd.",                    // Text[100]
  "sellToCustomerName2": "",                               // Text[50]
  "sellToAddress": "100 Day Drive",                        // Text[100]
  "sellToAddress2": "",                                    // Text[50]
  "sellToCity": "Bangkok",                                 // Text[30]
  "sellToContact": "Mr. Smith",                            // Text[100]
  "billToPostCode": "10110",                               // Code[20]
  "billToCounty": "",                                      // Text[30]
  "billToCountryRegionCode": "TH",                         // Code[10]
  "sellToPostCode": "10110",                               // Code[20]
  "sellToCounty": "",                                      // Text[30]
  "sellToCountryRegionCode": "TH",                         // Code[10]
  "shipToPostCode": "10110",                               // Code[20]
  "shipToCounty": "",                                      // Text[30]
  "shipToCountryRegionCode": "TH",                         // Code[10]
  "balAccountType": "G/L Account",                         // Enum
  "exitPoint": "",                                         // Code[10]
  "correctionValue": false,                                // Boolean
  "documentDate": "2025-03-01",                            // Date
  "externalDocumentNo": "EXT-PO-123",                      // Code[35]
  "areaValue": "",                                         // Code[10]
  "transactionSpecification": "",                          // Code[10]
  "paymentMethodCode": "BANK",                             // Code[10]
  "shippingAgentCode": "DHL",                              // Code[10]
  "packageTrackingNo": "",                                 // Text[30]
  "noSeries": "S-ORD",                                     // Code[20]
  "postingNoSeries": "S-INV+",                             // Code[20]
  "shippingNoSeries": "S-SHPT",                            // Code[20]
  "taxAreaCode": "",                                       // Code[20]
  "taxLiable": false,                                      // Boolean
  "vATBusPostingGroup": "DOMESTIC",                        // Code[20]
  "reserve": "Optional",                                   // Enum
  "appliesToID": "",                                       // Code[50]
  "vATBaseDiscount": 0.0,                                  // Decimal
  "status": "Open",                                        // Enum (Open/Released/Pending Approval/Pending Prepayment)
  "invoiceDiscountCalculation": " ",                       // Enum
  "invoiceDiscountValue": 0.0,                             // Decimal
  "sendICDocument": false,                                 // Boolean
  "iCStatus": "New",                                       // Enum
  "sellToICPartnerCode": "",                               // Code[20]
  "billToICPartnerCode": "",                               // Code[20]
  "iCReferenceDocumentNo": "",                             // Code[20]
  "iCDirection": "Outgoing",                               // Enum
  "prepayment": 0.0,                                       // Decimal
  "prepaymentNoSeries": "",                                // Code[20]
  "compressPrepayment": true,                              // Boolean
  "prepaymentDueDate": "0001-01-01",                       // Date
  "prepmtCrMemoNoSeries": "",                              // Code[20]
  "prepmtPostingDescription": "",                          // Text[100]
  "prepmtPmtDiscountDate": "0001-01-01",                   // Date
  "prepmtPaymentTermsCode": "",                            // Code[10]
  "prepmtPaymentDiscount": 0.0,                            // Decimal
  "quoteNo": "SQ-1001",                                    // Code[20]
  "quoteValidUntilDate": "0001-01-01",                     // Date
  "quoteSentToCustomer": "0001-01-01",                     // DateTime
  "quoteAccepted": false,                                  // Boolean
  "quoteAcceptedDate": "0001-01-01",                       // Date
  "jobQueueStatus": " ",                                   // Enum
  "jobQueueEntryID": "00000000-0000-0000-0000-000000000000", // Guid
  "companyBankAccountCode": "",                            // Code[20]
  "incomingDocumentEntryNo": 0,                            // Integer
  "altVATRegistrationNo": "",                              // Text[20]
  "altGenBusPostingGroup": "",                             // Code[20]
  "altVATBusPostingGroup": "",                             // Code[20]
  "isTest": false,                                         // Boolean
  "sellToPhoneNo": "02-123-4567",                          // Text[30]
  "sellToEMail": "order@contoso.com",                      // Text[80]
  "journalTemplName": "",                                  // Code[10]
  "vATReportingDate": "2025-03-01",                        // Date
  "rcvdFromCountRegionCode": "",                           // Code[10]
  "lastEmailSentTime": "0001-01-01T00:00:00Z",            // ⚡ DateTime (FlowField)
  "lastEmailSentMessageId": "",                            // ⚡ Text (FlowField)
  "workDescription": "Deliver 20 units of bicycle chain to warehouse B", // 💾 BLOB (ต้อง CalcFields!)
  "shipToPhoneNo": "",                                     // Text[30]
  "dimensionSetID": 1234,                                  // Integer
  "paymentServiceSetID": 0,                                // Integer
  "coupledToDataverse": false,                             // ⚡ Boolean (FlowField)
  "directDebitMandateID": "",                              // Code[35]
  "invoiceDiscountAmount": 0.0,                            // ⚡ Decimal (FlowField)
  "noOfArchivedVersions": 0,                               // ⚡ Integer (FlowField)
  "docNoOccurrence": 0,                                    // Integer
  "campaignNo": "",                                        // Code[20]
  "sellToContactNo": "CT-10001",                           // Code[20]
  "billToContactNo": "CT-10001",                           // Code[20]
  "opportunityNo": "",                                     // Code[20]
  "sellToCustomerTemplCode": "",                           // Code[20]
  "billToCustomerTemplCode": "",                           // Code[20]
  "responsibilityCenter": "",                              // Code[10]
  "shippingAdvice": "Partial",                             // Enum (Partial/Complete)
  "shippedNotInvoiced": false,                             // ⚡ Boolean (FlowField)
  "completelyShipped": false,                              // ⚡ Boolean (FlowField)
  "postingFromWhseRef": 0,                                 // Integer
  "shipped": false,                                        // ⚡ Boolean (FlowField)
  "lastShipmentDate": "0001-01-01",                        // ⚡ Date (FlowField)
  "requestedDeliveryDate": "2025-03-10",                   // Date
  "promisedDeliveryDate": "0001-01-01",                    // Date
  "shippingTime": "",                                      // DateFormula
  "outboundWhseHandlingTime": "",                          // DateFormula
  "shippingAgentServiceCode": "",                          // Code[10]
  "lateOrderShipping": false,                              // ⚡ Boolean (FlowField)
  "receive": false,                                        // Boolean
  "returnReceiptNo": "",                                   // Code[20]
  "returnReceiptNoSeries": "",                             // Code[20]
  "lastReturnReceiptNo": "",                               // Code[20]
  "priceCalculationMethod": " ",                           // Enum
  "allowLineDisc": true,                                   // Boolean
  "getShipmentUsed": false,                                // Boolean
  "assignedUserID": "",                                    // Code[50]
  "createdAt": "2025-03-01T09:00:00Z",                     // DateTime
  "lastModifiedDateTime": "2025-03-01T09:15:30Z",          // DateTime

  "salesOrderLines": [
    { "...": "ดูตัวอย่าง salesOrderLines ด้านล่าง" }
  ]
}
```

---

## 3. `salesOrderLines` — Sales Order Lines

**GET** `/salesOrders({id})/salesOrderLines`
**Source Table:** Sales Line (Document Type = Order) | **Page ID:** 70102

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "documentType": "Order",                                // Enum
  "sellToCustomerNo": "C-10000",                          // Code[20]
  "documentNo": "SO-1001",                                // Code[20]
  "lineNo": 10000,                                        // Integer
  "typeValue": "Item",                                    // Enum (\" \"/G/L Account/Item/Resource/Fixed Asset/Charge (Item)/Allocation Account)
  "noValue": "ITEM-1000",                                 // Code[20]
  "locationCode": "BLUE",                                 // Code[10]
  "postingGroup": "RETAIL",                               // Code[20]
  "shipmentDate": "2025-03-10",                           // Date
  "descriptionValue": "Bicycle Chain",                    // Text[100]
  "description2": "",                                     // Text[50]
  "unitOfMeasure": "PCS",                                 // Text[50]
  "quantityValue": 20.0,                                  // Decimal
  "outstandingQuantity": 20.0,                            // Decimal
  "qtyToInvoice": 20.0,                                   // Decimal
  "qtyToShip": 20.0,                                      // Decimal
  "unitPrice": 250.00,                                    // Decimal
  "vAT": 7.0,                                             // Decimal
  "lineDiscount": 0.0,                                    // Decimal
  "lineDiscountAmount": 0.0,                              // Decimal
  "amountValue": 5000.00,                                 // Decimal
  "amountIncludingVAT": 5350.00,                          // Decimal
  "allowInvoiceDisc": true,                               // Boolean
  "grossWeight": 10.0,                                    // Decimal
  "netWeight": 9.0,                                       // Decimal
  "unitsPerParcel": 0,                                    // Decimal
  "unitVolume": 0.02,                                     // Decimal
  "applToItemEntry": 0,                                   // Integer
  "shortcutDimension1Code": "SALES",                      // Code[20]
  "shortcutDimension2Code": "",                           // Code[20]
  "customerPriceGroup": "",                               // Code[10]
  "jobNo": "",                                            // Code[20]
  "workTypeCode": "",                                     // Code[10]
  "recalculateInvoiceDisc": false,                        // Boolean
  "outstandingAmount": 5000.00,                           // Decimal
  "qtyShippedNotInvoiced": 0.0,                           // Decimal
  "shippedNotInvoiced": 0.0,                              // Decimal
  "quantityShipped": 0.0,                                 // Decimal
  "quantityInvoiced": 0.0,                                // Decimal
  "shipmentNo": "",                                       // Code[20]
  "shipmentLineNo": 0,                                    // Integer
  "profit": 30.0,                                         // Decimal
  "billToCustomerNo": "C-10000",                          // Code[20]
  "invDiscountAmount": 0.0,                               // Decimal
  "genBusPostingGroup": "DOMESTIC",                       // Code[20]
  "genProdPostingGroup": "RETAIL",                        // Code[20]
  "vATBusPostingGroup": "DOMESTIC",                       // Code[20]
  "vATProdPostingGroup": "VAT7",                          // Code[20]
  "currencyCode": "",                                     // Code[10]
  "reservedQuantity": 0.0,                                // ⚡ Decimal (FlowField)
  "vATBaseAmount": 5000.00,                               // Decimal
  "unitCost": 175.00,                                     // Decimal
  "lineAmount": 5000.00,                                  // Decimal
  "variantCode": "",                                      // Code[10]
  "unitOfMeasureCode": "PCS",                             // Code[10]
  "qtyPerUnitOfMeasure": 1.0,                             // Decimal
  "itemCategoryCode": "PARTS",                            // Code[20]
  "dimensionSetID": 1234,                                 // Integer
  "aTOWhseOutstandingQty": 0.0,                           // ⚡ Decimal (FlowField)
  "postingDate": "0001-01-01",                            // ⚡ Date (FlowField)
  "allocAccModifiedByUser": false,                        // ⚡ Boolean (FlowField)
  "substitutionAvailable": false,                         // ⚡ Boolean (FlowField)
  "whseOutstandingQty": 0.0,                              // ⚡ Decimal (FlowField)
  "qtyToAssign": 0.0,                                     // ⚡ Decimal (FlowField)
  "qtyAssigned": 0.0,                                     // ⚡ Decimal (FlowField)
  "itemChargeQtyToHandle": 0.0,                           // ⚡ Decimal (FlowField)
  "attachedDocCount": 0,                                  // ⚡ Integer (FlowField)
  "attachedLinesCount": 0,                                // ⚡ Integer (FlowField)
  "sellToCustomerName": "Contoso Ltd.",                   // ⚡ Text (FlowField)
  "createdAt": "2025-03-01T09:00:00Z",                    // DateTime
  "lastModifiedDateTime": "2025-03-01T09:15:30Z"          // DateTime
}
```

> **หมายเหตุ:** `salesQuoteLines`, `salesInvoiceLines`, `salesCreditMemoLines` ใช้ field เดียวกันทุกประการ (Sales Line table เดียวกัน แค่ filter Document Type ต่างกัน)

---

## 4-5. `salesQuotes` / `salesQuoteLines`

เหมือนกับ `salesOrders` / `salesOrderLines` ทุกประการ (ใช้ Sales Header / Sales Line table เดียวกัน)
- `documentType` จะเป็น `"Quote"` แทน `"Order"`
- `status` จะเป็น `"Open"` หรือ `"Released"`

---

## 6-7. `salesInvoices` / `salesInvoiceLines`

เหมือนกับ `salesOrders` / `salesOrderLines` ทุกประการ
- `documentType` จะเป็น `"Invoice"`

---

## 8-9. `salesCreditMemos` / `salesCreditMemoLines`

เหมือนกับ `salesOrders` / `salesOrderLines` ทุกประการ
- `documentType` จะเป็น `"Credit Memo"`

---

## 10. `postedSalesInvoices` — Posted Sales Invoice Header

**GET** `/postedSalesInvoices?$expand=postedSalesInvoiceLines`
**Source Table:** Sales Invoice Header | **Page ID:** 70110

```json
{
  "id": "d4e5f6a7-b8c9-0123-def0-234567890123",
  "sellToCustomerNo": "C-10000",                          // Code[20]
  "noValue": "PSI-1001",                                   // Code[20]
  "billToCustomerNo": "C-10000",                          // Code[20]
  "billToName": "Contoso Ltd.",                            // Text[100]
  "billToAddress": "100 Day Drive",                        // Text[100]
  "billToCity": "Bangkok",                                 // Text[30]
  "orderDate": "2025-03-01",                               // Date
  "postingDate": "2025-03-01",                             // Date
  "shipmentDate": "2025-03-10",                            // Date
  "paymentTermsCode": "NET30",                             // Code[10]
  "dueDate": "2025-03-31",                                 // Date
  "locationCode": "BLUE",                                  // Code[10]
  "currencyCode": "",                                      // Code[10]
  "sellToCustomerName": "Contoso Ltd.",                    // Text[100]
  "externalDocumentNo": "EXT-PO-123",                      // Code[35]
  "amountValue": 5000.00,                                  // ⚡ Decimal (FlowField)
  "amountIncludingVAT": 5350.00,                           // ⚡ Decimal (FlowField)
  "commentValue": false,                                   // ⚡ Boolean (FlowField)
  "closed": true,                                          // ⚡ Boolean (FlowField)
  "remainingAmount": 0.0,                                  // ⚡ Decimal (FlowField)
  "invoiceDiscountAmount": 0.0,                            // ⚡ Decimal (FlowField)
  "cancelled": false,                                      // ⚡ Boolean (FlowField)
  "corrective": false,                                     // ⚡ Boolean (FlowField)
  "reversed": false,                                       // ⚡ Boolean (FlowField)
  "workDescription": "Deliver 20 units of bicycle chain",  // 💾 BLOB (CalcFields แล้ว)
  "dimensionSetID": 1234,                                  // Integer
  "lastEmailSentTime": "0001-01-01T00:00:00Z",            // ⚡ DateTime (FlowField)
  "lastEmailSentMessageId": "",                            // ⚡ Text (FlowField)
  "coupledToDataverse": false,                             // ⚡ Boolean (FlowField)
  "createdAt": "2025-03-01T09:00:00Z",                     // DateTime
  "lastModifiedDateTime": "2025-03-01T09:15:30Z"           // DateTime
}
```

---

## 11. `postedSalesInvoiceLines`

**Source Table:** Sales Invoice Line | **Page ID:** 70111

```json
{
  "id": "e5f6a7b8-c9d0-1234-ef01-345678901234",
  "sellToCustomerNo": "C-10000",                          // Code[20]
  "documentNo": "PSI-1001",                               // Code[20]
  "lineNo": 10000,                                        // Integer
  "typeValue": "Item",                                    // Enum
  "noValue": "ITEM-1000",                                 // Code[20]
  "locationCode": "BLUE",                                 // Code[10]
  "descriptionValue": "Bicycle Chain",                    // Text[100]
  "quantityValue": 20.0,                                  // Decimal
  "unitPrice": 250.00,                                    // Decimal
  "lineDiscount": 0.0,                                    // Decimal
  "amountValue": 5000.00,                                 // Decimal
  "amountIncludingVAT": 5350.00,                          // Decimal
  "unitOfMeasureCode": "PCS",                             // Code[10]
  "dimensionSetID": 1234,                                 // Integer
  "sellToCustomerName": "Contoso Ltd.",                   // ⚡ Text (FlowField)
  "createdAt": "2025-03-01T09:00:00Z",                    // DateTime
  "lastModifiedDateTime": "2025-03-01T09:15:30Z"          // DateTime
}
```

---

## 12-13. `postedSalesShipments` / `postedSalesShipmentLines`

**Source Table:** Sales Shipment Header/Line | **Page ID:** 70122/70123

```json
{
  "id": "f6a7b8c9-d0e1-2345-f012-456789012345",
  "sellToCustomerNo": "C-10000",
  "no": "SHPT-1001",                                      // Code[20]
  "billToName": "Contoso Ltd.",
  "orderNo": "SO-1001",                                   // Code[20]
  "postingDate": "2025-03-10",
  "shipmentDate": "2025-03-10",
  "commentValue": false,                                   // ⚡ Boolean (FlowField)
  "dimensionSetID": 1234,
  "createdAt": "2025-03-10T08:00:00Z",
  "lastModifiedDateTime": "2025-03-10T08:00:00Z"
}
```

Shipment Line:
```json
{
  "id": "...",
  "documentNo": "SHPT-1001",
  "lineNo": 10000,
  "typeValue": "Item",
  "noValue": "ITEM-1000",
  "descriptionValue": "Bicycle Chain",
  "quantityValue": 20.0,
  "unitOfMeasureCode": "PCS",
  "currencyCode": "",                                      // ⚡ Code (FlowField)
  "dimensionSetID": 1234
}
```

---

## 14-15. `postedSalesCreditMemos` / `postedSalesCreditMemoLines`

**Source Table:** Sales Cr.Memo Header/Line | **Page ID:** 70124/70125

เหมือน postedSalesInvoices แต่ไม่มี `workDescription` field
- มี `paid` (⚡ Boolean FlowField), `remainingAmount`, `cancelled`, `corrective`

---

## 16. `purchaseOrders` — Purchase Order Header

**GET** `/purchaseOrders?$expand=purchaseOrderLines`
**Source Table:** Purchase Header (Document Type = Order) | **Page ID:** 70126

```json
{
  "id": "a7b8c9d0-e1f2-3456-0123-567890123456",
  "documentType": "Order",                                // Enum
  "buyFromVendorNo": "V-1001",                            // Code[20]
  "noValue": "PO-2001",                                   // Code[20]
  "payToVendorNo": "V-1001",                              // Code[20]
  "payToName": "Fabrikam Inc.",                            // Text[100]
  "orderDate": "2025-02-15",                               // Date
  "postingDate": "2025-02-15",                             // Date
  "expectedReceiptDate": "2025-03-01",                     // Date
  "paymentTermsCode": "NET30",                             // Code[10]
  "dueDate": "2025-03-17",                                 // Date
  "locationCode": "BLUE",                                  // Code[10]
  "vendorPostingGroup": "DOMESTIC",                        // Code[20]
  "currencyCode": "",                                      // Code[10]
  "currencyFactor": 0.0,                                   // Decimal
  "purchaserCode": "JR",                                   // Code[20]
  "commentValue": false,                                   // ⚡ Boolean (FlowField)
  "amountValue": 3300.00,                                  // ⚡ Decimal (FlowField)
  "amountIncludingVAT": 3531.00,                           // ⚡ Decimal (FlowField)
  "vendorOrderNo": "VEND-ORD-555",                         // Code[35]
  "vendorShipmentNo": "",                                  // Code[35]
  "vendorInvoiceNo": "",                                   // Code[35]
  "buyFromVendorName": "Fabrikam Inc.",                    // Text[100]
  "status": "Released",                                    // Enum (Open/Released/Pending Approval/Pending Prepayment)
  "invoiceDiscountAmount": 0.0,                            // ⚡ Decimal (FlowField)
  "noOfArchivedVersions": 0,                               // ⚡ Integer (FlowField)
  "partiallyInvoiced": false,                              // ⚡ Boolean (FlowField)
  "completelyReceived": false,                             // ⚡ Boolean (FlowField)
  "receivedNotInvoiced": false,                            // ⚡ Boolean (FlowField)
  "pendingApprovals": false,                               // ⚡ Boolean (FlowField)
  "dimensionSetID": 5678,                                  // Integer
  "createdAt": "2025-02-15T10:00:00Z",
  "lastModifiedDateTime": "2025-02-20T14:30:00Z"
}
```

---

## 17. `purchaseOrderLines`

**Source Table:** Purchase Line (Document Type = Order) | **Page ID:** 70127

```json
{
  "id": "b8c9d0e1-f2a3-4567-1234-678901234567",
  "documentType": "Order",
  "buyFromVendorNo": "V-1001",
  "documentNo": "PO-2001",
  "lineNo": 10000,
  "typeValue": "Item",                                    // Enum
  "noValue": "ITEM-1000",                                 // Code[20]
  "locationCode": "BLUE",
  "descriptionValue": "Bicycle Chain",                    // Text[100]
  "quantityValue": 20.0,                                  // Decimal
  "outstandingQuantity": 20.0,                            // Decimal
  "directUnitCost": 165.00,                               // Decimal
  "vAT": 7.0,                                             // Decimal
  "lineDiscount": 0.0,                                    // Decimal
  "lineAmount": 3300.00,                                  // Decimal
  "amountValue": 3300.00,                                 // Decimal
  "amountIncludingVAT": 3531.00,                          // Decimal
  "unitOfMeasureCode": "PCS",                             // Code[10]
  "qtyPerUnitOfMeasure": 1.0,                             // Decimal
  "unitCostLCY": 165.00,                                  // Decimal
  "expectedReceiptDate": "2025-03-01",                    // Date
  "quantityReceived": 0.0,                                // Decimal
  "quantityInvoiced": 0.0,                                // Decimal
  "reservedQuantity": 0.0,                                // ⚡ Decimal (FlowField)
  "allocAccModifiedByUser": false,                        // ⚡ Boolean (FlowField)
  "qtyToAssign": 0.0,                                     // ⚡ Decimal (FlowField)
  "qtyAssigned": 0.0,                                     // ⚡ Decimal (FlowField)
  "itemChargeQtyToHandle": 0.0,                           // ⚡ Decimal (FlowField)
  "attachedDocCount": 0,                                  // ⚡ Integer (FlowField)
  "attachedLinesCount": 0,                                // ⚡ Integer (FlowField)
  "buyFromVendorName": "Fabrikam Inc.",                   // ⚡ Text (FlowField)
  "dimensionSetID": 5678,
  "createdAt": "2025-02-15T10:00:00Z",
  "lastModifiedDateTime": "2025-02-15T10:05:00Z"
}
```

---

## 18-21. `purchaseInvoices/Lines`, `purchaseCreditMemos/Lines`

เหมือน `purchaseOrders/Lines` ทุกประการ (Purchase Header/Line table เดียวกัน)
- `purchaseInvoices`: documentType = `"Invoice"`
- `purchaseCreditMemos`: documentType = `"Credit Memo"`

---

## 22-23. `postedPurchInvoices` / `postedPurchInvoiceLines`

**Source Table:** Purch. Inv. Header/Line | **Page ID:** 70112/70113

```json
{
  "id": "...",
  "buyFromVendorNo": "V-1001",
  "noValue": "PPI-3001",                                   // Code[20]
  "payToName": "Fabrikam Inc.",
  "postingDate": "2025-03-01",
  "amountValue": 3300.00,                                  // ⚡ Decimal (FlowField)
  "amountIncludingVAT": 3531.00,                           // ⚡ Decimal (FlowField)
  "closed": true,                                          // ⚡ Boolean (FlowField)
  "remainingAmount": 0.0,                                  // ⚡ Decimal (FlowField)
  "invoiceDiscountAmount": 0.0,                            // ⚡ Decimal (FlowField)
  "cancelled": false,                                      // ⚡ Boolean (FlowField)
  "corrective": false,                                     // ⚡ Boolean (FlowField)
  "vendorInvoiceNo": "VEND-INV-100",                       // Code[35]
  "dimensionSetID": 5678
}
```

---

## 24-25. `postedPurchaseReceipts` / `postedPurchaseReceiptLines`

**Source Table:** Purch. Rcpt. Header/Line | **Page ID:** 70132/70133

```json
{
  "id": "...",
  "buyFromVendorNo": "V-1001",
  "no": "RCPT-4001",
  "postingDate": "2025-03-01",
  "orderNo": "PO-2001",                                   // Code[20]
  "commentValue": false,                                   // ⚡ Boolean (FlowField)
  "dimensionSetID": 5678
}
```

Receipt Line: (มี `currencyCode` เป็น ⚡ FlowField)

---

## 26-27. `postedPurchaseCreditMemos` / `postedPurchaseCreditMemoLines`

**Source Table:** Purch. Cr. Memo Hdr./Line | **Page ID:** 70134/70135

เหมือน postedPurchInvoices แต่มี `paid` แทน `closed`

---

## 28. `productionOrders` — Production Order

**GET** `/productionOrders?$expand=productionOrderLines`
**Source Table:** Production Order | **Page ID:** 70103

```json
{
  "id": "...",
  "status": "Released",                                    // Enum (Simulated/Planned/Firm Planned/Released/Finished)
  "no": "RPO-5001",                                        // Code[20]
  "description": "Assembly Lot A",                         // Text[100]
  "searchDescription": "ASSEMBLY LOT A",                   // Code[100]
  "sourceType": "Item",                                    // Enum (\" \"/Item/Family/Sales Header)
  "sourceNo": "ITEM-2000",                                 // Code[20]
  "routingNo": "RTG-001",                                  // Code[20]
  "inventoryPostingGroup": "FINISHED",                     // Code[20]
  "genProdPostingGroup": "MANUF",                          // Code[20]
  "comment": false,                                        // ⚡ Boolean (FlowField)
  "startingDate": "2025-03-05",                            // Date
  "startingTime": "08:00:00",                              // Time
  "endingDate": "2025-03-10",                              // Date
  "endingTime": "17:00:00",                                // Time
  "dueDate": "2025-03-12",                                 // Date
  "finishedDate": "0001-01-01",                            // Date
  "blocked": false,                                        // Boolean
  "locationCode": "BLUE",                                  // Code[10]
  "quantity": 100.0,                                       // Decimal
  "unitCost": 50.00,                                       // Decimal
  "costAmount": 5000.00,                                   // Decimal
  "expectedOperationCostAmt": 1500.00,                     // ⚡ Decimal (FlowField)
  "expectedComponentCostAmt": 3500.00,                     // ⚡ Decimal (FlowField)
  "actualTimeUsed": 0.0,                                   // ⚡ Decimal (FlowField)
  "allocatedCapacityNeed": 0.0,                            // ⚡ Decimal (FlowField)
  "expectedCapacityNeed": 800.0,                           // ⚡ Decimal (FlowField)
  "expectedMaterialOvhdCost": 200.00,                      // ⚡ Decimal (FlowField)
  "expectedCapacityOvhdCost": 100.00,                      // ⚡ Decimal (FlowField)
  "startingDateTime": "2025-03-05T08:00:00Z",              // DateTime
  "endingDateTime": "2025-03-10T17:00:00Z",                // DateTime
  "completelyPicked": false,                               // ⚡ Boolean (FlowField)
  "dimensionSetID": 9012,                                  // Integer
  "assignedUserID": "",                                    // Code[50]
  "createdAt": "2025-03-01T07:00:00Z",
  "lastModifiedDateTime": "2025-03-05T09:00:00Z"
}
```

---

## 29. `productionOrderLines`

**Source Table:** Prod. Order Line | **Page ID:** 70104

```json
{
  "id": "...",
  "status": "Released",
  "prodOrderNo": "RPO-5001",
  "lineNo": 10000,
  "itemNo": "ITEM-2000",
  "description": "Finished Bicycle",
  "quantity": 100.0,
  "finishedQuantity": 0.0,
  "remainingQuantity": 100.0,
  "unitCost": 50.00,
  "costAmount": 5000.00,
  "reservedQuantity": 0.0,                                // ⚡ Decimal (FlowField)
  "expectedOperationCostAmt": 1500.00,                    // ⚡ Decimal (FlowField)
  "expectedComponentCostAmt": 3500.00,                    // ⚡ Decimal (FlowField)
  "unitOfMeasureCode": "PCS",
  "dimensionSetID": 9012
}
```

---

## 30. `productionOrderComponents`

**Source Table:** Prod. Order Component | **Page ID:** 70105

```json
{
  "id": "...",
  "status": "Released",
  "prodOrderNo": "RPO-5001",
  "prodOrderLineNo": 10000,
  "lineNo": 10000,
  "itemNo": "ITEM-1000",
  "description": "Bicycle Chain",
  "unitOfMeasureCode": "PCS",
  "quantity": 1.0,
  "quantityPer": 1.0,
  "expectedQuantity": 100.0,
  "remainingQuantity": 100.0,
  "actConsumptionQty": 0.0,                               // ⚡ Decimal (FlowField)
  "flushingMethod": "Manual",                             // Enum (Manual/Forward/Backward/Pick + Forward/Pick + Backward)
  "locationCode": "BLUE",
  "unitCost": 175.00,
  "costAmount": 17500.00,
  "reservedQuantity": 0.0,                                // ⚡ Decimal (FlowField)
  "substitutionAvailable": false,                         // ⚡ Boolean (FlowField)
  "completelyPicked": false,
  "dimensionSetID": 9012
}
```

---

## 31. `customers` — Customer Master

**GET** `/customers`
**Source Table:** Customer | **Page ID:** 70136

```json
{
  "id": "...",
  "no": "C-10000",                                         // Code[20]
  "nameValue": "Contoso Ltd.",                             // Text[100]
  "searchName": "CONTOSO LTD.",                            // Code[100]
  "name2": "",                                             // Text[50]
  "address": "100 Day Drive",                              // Text[100]
  "address2": "",                                          // Text[50]
  "city": "Bangkok",                                       // Text[30]
  "contact": "Mr. Smith",                                  // Text[100]
  "phoneNo": "02-123-4567",                                // Text[30]
  "customerPostingGroup": "DOMESTIC",                      // Code[20]
  "currencyCode": "",                                      // Code[10]
  "paymentTermsCode": "NET30",                             // Code[10]
  "salespersonCode": "JR",                                 // Code[20]
  "countryRegionCode": "TH",                               // Code[10]
  "blocked": " ",                                          // Enum (\" \"/Ship/Invoice/All)
  "balance": 15000.00,                                     // ⚡ Decimal (FlowField)
  "balanceLCY": 15000.00,                                  // ⚡ Decimal (FlowField)
  "netChange": 5000.00,                                    // ⚡ Decimal (FlowField)
  "salesLCY": 120000.00,                                   // ⚡ Decimal (FlowField)
  "profitLCY": 36000.00,                                   // ⚡ Decimal (FlowField)
  "balanceDue": 5000.00,                                   // ⚡ Decimal (FlowField)
  "payments": 110000.00,                                   // ⚡ Decimal (FlowField)
  "invoiceAmounts": 125000.00,                             // ⚡ Decimal (FlowField)
  "creditLimitLCY": 500000.00,                             // Decimal
  "vatRegistrationNo": "TH1234567890",                     // Text[20]
  "genBusPostingGroup": "DOMESTIC",                        // Code[20]
  "eMail": "info@contoso.com",                             // Text[80]
  "homePage": "www.contoso.com",                           // Text[80]
  "postCode": "10110",                                     // Code[20]
  "pricesIncludingVAT": false,                             // Boolean
  "comment": true,                                         // ⚡ Boolean (FlowField)
  "image": "iVBORw0KGgoAAAANS...(base64)",                // 🖼️ Media (base64 หรือ null)
  "outstandingOrders": 5000.00,                            // ⚡ Decimal (FlowField)
  "shippedNotInvoiced": 0.0,                               // ⚡ Decimal (FlowField)
  "noOfQuotes": 2,                                         // ⚡ Integer (FlowField)
  "noOfOrders": 5,                                         // ⚡ Integer (FlowField)
  "noOfInvoices": 3,                                       // ⚡ Integer (FlowField)
  "noOfCreditMemos": 1,                                    // ⚡ Integer (FlowField)
  "noOfPstdInvoices": 48,                                  // ⚡ Integer (FlowField)
  "noOfPstdCreditMemos": 2,                                // ⚡ Integer (FlowField)
  "coupledToDataverse": false,                             // ⚡ Boolean (FlowField)
  "createdAt": "2024-01-10T08:00:00Z",
  "lastModifiedDateTime": "2025-03-15T14:22:10Z"
}
```

---

## 32. `vendors` — Vendor Master

**Source Table:** Vendor | **Page ID:** 70137

เหมือน customers แต่ field ชื่อต่าง เช่น `purchasesLCY`, `buyFromNoOfArchivedDoc` แทน `salesLCY`, `sellToNoOfArchivedDoc`
- มี `image` (🖼️ Media)
- FlowField จำนวนมาก (52 fields) ถูก CalcFields ครบ

---

## 33. `bankAccounts` — Bank Account

**Source Table:** Bank Account | **Page ID:** 70138

```json
{
  "id": "...",
  "no": "BANK-001",                                        // Code[20]
  "nameValue": "Kasikorn Bank - Main",                     // Text[100]
  "bankAccountNo": "123-4-56789-0",                        // Text[30]
  "currencyCode": "THB",                                   // Code[10]
  "balance": 1250000.00,                                   // ⚡ Decimal (FlowField)
  "balanceLCY": 1250000.00,                                // ⚡ Decimal (FlowField)
  "iBAN": "TH12 3456 7890 1234 5678",                     // Code[50]
  "sWIFTCode": "KASITHBK",                                 // Code[20]
  "bankBranchNo": "001",                                   // Text[20]
  "image": null,                                           // 🖼️ Media (null ถ้าไม่มีรูป)
  "lastStatementNo": "2025-02",                            // Code[20]
  "createdAt": "2024-01-05T08:00:00Z",
  "lastModifiedDateTime": "2025-03-01T10:00:00Z"
}
```

---

## 34. `glAccounts` — G/L Account

**Source Table:** G/L Account | **Page ID:** 70106

```json
{
  "id": "...",
  "no": "6100",                                            // Code[20]
  "nameValue": "Cost of Goods Sold",                       // Text[100]
  "accountType": "Posting",                                // Enum (Posting/Heading/Total/Begin-Total/End-Total)
  "incomeBalance": "Income Statement",                     // Enum (Income Statement/Balance Sheet)
  "directPosting": true,                                   // Boolean
  "balance": 850000.00,                                    // ⚡ Decimal (FlowField)
  "netChange": 45000.00,                                   // ⚡ Decimal (FlowField)
  "balanceAtDate": 850000.00,                              // ⚡ Decimal (FlowField)
  "debitAmount": 890000.00,                                // ⚡ Decimal (FlowField)
  "creditAmount": 40000.00,                                // ⚡ Decimal (FlowField)
  "budgetedAmount": 900000.00,                             // ⚡ Decimal (FlowField)
  "genProdPostingGroup": "RETAIL",                         // Code[20]
  "vatProdPostingGroup": "VAT7",                           // Code[20]
  "createdAt": "2024-01-01T08:00:00Z",
  "lastModifiedDateTime": "2025-03-15T08:00:00Z"
}
```

---

## 35. `gLEntries` — G/L Entry

**Source Table:** G/L Entry | **Page ID:** 70107

```json
{
  "id": "...",
  "entryNo": 125000,                                      // Integer
  "gLAccountNo": "6100",                                   // Code[20]
  "postingDate": "2025-03-01",                             // Date
  "documentType": "Invoice",                               // Enum
  "documentNo": "PSI-1001",                                // Code[20]
  "descriptionValue": "Sales Invoice PSI-1001",            // Text[100]
  "amountValue": 5000.00,                                  // Decimal
  "debitAmount": 5000.00,                                  // Decimal
  "creditAmount": 0.0,                                     // Decimal
  "sourceType": "Customer",                                // Enum
  "sourceNo": "C-10000",                                   // Code[20]
  "transactionNo": 89001,                                  // Integer
  "gLAccountName": "Cost of Goods Sold",                   // ⚡ Text (FlowField)
  "dimensionSetID": 1234,                                  // Integer
  "shortcutDimension3Code": "",                            // ⚡ Code (FlowField)
  "shortcutDimension4Code": "",                            // ⚡ Code (FlowField)
  "shortcutDimension5Code": "",                            // ⚡ Code (FlowField)
  "shortcutDimension6Code": "",                            // ⚡ Code (FlowField)
  "shortcutDimension7Code": "",                            // ⚡ Code (FlowField)
  "shortcutDimension8Code": "",                            // ⚡ Code (FlowField)
  "accountId": "00000000-0000-0000-0000-000000000000",     // ⚡ Guid (FlowField)
  "createdAt": "2025-03-01T09:15:30Z",
  "lastModifiedDateTime": "2025-03-01T09:15:30Z"
}
```

---

## 36. `customerLedgerEntries`

**Source Table:** Cust. Ledger Entry | **Page ID:** 70108

```json
{
  "id": "...",
  "entryNo": 50001,                                       // Integer
  "customerNo": "C-10000",                                // Code[20]
  "postingDate": "2025-03-01",                            // Date
  "documentType": "Invoice",                              // Enum
  "documentNo": "PSI-1001",                               // Code[20]
  "description": "Sales Invoice",                         // Text[100]
  "customerName": "Contoso Ltd.",                          // Text[100]
  "currencyCode": "",                                     // Code[10]
  "amount": 5350.00,                                      // ⚡ Decimal (FlowField)
  "remainingAmount": 0.0,                                 // ⚡ Decimal (FlowField)
  "originalAmtLCY": 5350.00,                              // ⚡ Decimal (FlowField)
  "amountLCY": 5350.00,                                   // ⚡ Decimal (FlowField)
  "open": false,                                          // Boolean
  "dueDate": "2025-03-31",                                // Date
  "debitAmount": 5350.00,                                 // ⚡ Decimal (FlowField)
  "creditAmount": 0.0,                                    // ⚡ Decimal (FlowField)
  "dimensionSetID": 1234,
  "createdAt": "2025-03-01T09:15:30Z",
  "lastModifiedDateTime": "2025-03-01T09:15:30Z"
}
```

---

## 37. `detailedCustLedgerEntries`

**Source Table:** Detailed Cust. Ledg. Entry | **Page ID:** 70140

```json
{
  "id": "...",
  "entryNo": 100001,                                      // Integer
  "custLedgerEntryNo": 50001,                             // Integer
  "entryType": "Initial Entry",                           // Enum
  "postingDate": "2025-03-01",
  "documentType": "Invoice",
  "documentNo": "PSI-1001",
  "amount": 5350.00,                                      // Decimal (ไม่ใช่ FlowField)
  "amountLCY": 5350.00,                                   // Decimal
  "customerNo": "C-10000",
  "debitAmount": 5350.00,                                 // Decimal
  "creditAmount": 0.0,                                    // Decimal
  "ledgerEntryAmount": true,                              // Boolean
  "createdAt": "2025-03-01T09:15:30Z",
  "lastModifiedDateTime": "2025-03-01T09:15:30Z"
}
```

> ⚠️ **หมายเหตุ:** Detailed entries ไม่มี FlowField เลย - ทุก field เป็น base field, ค่าจะมีทุก field

---

## 38. `vendorLedgerEntries`

**Source Table:** Vendor Ledger Entry | **Page ID:** 70109

เหมือน customerLedgerEntries แต่ field ชื่อเป็น vendor เช่น `vendorNo`, `vendorName`, `purchaseLCY`

---

## 39. `detailedVendorLedgerEntries`

**Source Table:** Detailed Vendor Ledg. Entry | **Page ID:** 70141

เหมือน detailedCustLedgerEntries แต่ field ชื่อเป็น vendor เช่น `vendorLedgerEntryNo`, `vendorNo`

---

## 40. `bankAccountLedgerEntries`

**Source Table:** Bank Account Ledger Entry | **Page ID:** 70139

```json
{
  "id": "...",
  "entryNo": 20001,                                       // Integer
  "bankAccountNo": "BANK-001",                            // Code[20]
  "postingDate": "2025-03-01",
  "documentType": "Payment",
  "documentNo": "PAY-6001",
  "description": "Payment to Vendor V-1001",
  "amount": -3531.00,                                     // Decimal
  "remainingAmount": 0.0,                                 // Decimal
  "amountLCY": -3531.00,                                  // Decimal
  "debitAmount": 0.0,                                     // Decimal
  "creditAmount": 3531.00,                                // Decimal
  "open": false,                                          // Boolean
  "statementDate": "2025-03-15",                          // ⚡ Date (FlowField)
  "checkLedgerEntries": 0,                                // ⚡ Integer (FlowField)
  "dimensionSetID": 3456,
  "createdAt": "2025-03-01T11:00:00Z",
  "lastModifiedDateTime": "2025-03-01T11:00:00Z"
}
```

---

## 41. `valueEntries`

**Source Table:** Value Entry | **Page ID:** 70114

```json
{
  "id": "...",
  "entryNo": 200001,                                      // Integer
  "itemNo": "ITEM-1000",                                  // Code[20]
  "postingDate": "2025-03-01",
  "itemLedgerEntryType": "Sale",                          // Enum
  "documentNo": "PSI-1001",
  "documentType": "Sales Invoice",
  "descriptionValue": "Bicycle Chain",
  "valuedQuantity": -20.0,                                // Decimal
  "invoicedQuantity": -20.0,                              // Decimal
  "costPerUnit": 175.00,                                  // Decimal
  "costPostedToGL": 3500.00,                              // Decimal
  "entryType": "Direct Cost",                             // Enum
  "itemDescription": "Bicycle Chain",                     // ⚡ Text (FlowField)
  "dimensionSetID": 1234,
  "createdAt": "2025-03-01T09:15:30Z",
  "lastModifiedDateTime": "2025-03-01T09:15:30Z"
}
```

---

## 42. `itemLedgerEntries`

**Source Table:** Item Ledger Entry | **Page ID:** 70115

```json
{
  "id": "...",
  "entryNo": 300001,                                      // Integer
  "itemNo": "ITEM-1000",                                  // Code[20]
  "postingDate": "2025-03-01",
  "entryType": "Sale",                                    // Enum (Purchase/Sale/Positive Adjmt./Negative Adjmt./Transfer/Consumption/Output/Assembly Consumption/Assembly Output)
  "documentNo": "PSI-1001",
  "descriptionValue": "Bicycle Chain",
  "locationCode": "BLUE",
  "quantityValue": -20.0,                                 // Decimal (ติดลบ = ขายออก)
  "remainingQuantity": 0.0,                               // Decimal
  "invoicedQuantity": -20.0,                              // Decimal
  "open": false,                                          // Boolean
  "reservedQuantity": 0.0,                                // ⚡ Decimal (FlowField)
  "unitOfMeasureCode": "PCS",
  "itemCategoryCode": "PARTS",
  "serialNo": "",                                         // Code[50]
  "lotNo": "LOT-2025-001",                                // Code[50]
  "itemDescription": "Bicycle Chain",                     // ⚡ Text (FlowField)
  "dimensionSetID": 1234,
  "createdAt": "2025-03-01T09:15:30Z",
  "lastModifiedDateTime": "2025-03-01T09:15:30Z"
}
```

---

## 43. `fixedAssets`

**Source Table:** Fixed Asset | **Page ID:** 70142

```json
{
  "id": "...",
  "no": "FA-001",                                          // Code[20]
  "description": "CNC Machine",                            // Text[100]
  "fAClassCode": "TANGIBLE",                               // Code[10]
  "fASubclassCode": "MACHINE",                             // Code[10]
  "fALocationCode": "FACTORY",                             // Code[10]
  "vendorNo": "V-2001",                                    // Code[20]
  "responsibleEmployee": "EMP-001",                        // Code[20]
  "serialNo": "SN-CNC-2024-001",                           // Text[50]
  "insured": true,                                         // ⚡ Boolean (FlowField)
  "comment": true,                                         // ⚡ Boolean (FlowField)
  "acquired": true,                                        // ⚡ Boolean (FlowField)
  "blocked": false,                                        // Boolean
  "inactive": false,                                       // Boolean
  "image": null,                                           // 🖼️ Media
  "fAPostingGroup": "MACHINE",                             // Code[20]
  "createdAt": "2024-06-01T08:00:00Z",
  "lastModifiedDateTime": "2025-01-15T10:00:00Z"
}
```

---

## 44. `faLedgerEntries`

**Source Table:** FA Ledger Entry | **Page ID:** 70143

```json
{
  "id": "...",
  "entryNo": 5001,                                        // Integer
  "fANo": "FA-001",                                       // Code[20]
  "fAPostingDate": "2024-06-01",                          // Date
  "postingDate": "2024-06-01",
  "documentNo": "FA-ACQ-001",
  "fAPostingType": "Acquisition Cost",                    // Enum
  "amount": 2500000.00,                                   // Decimal
  "debitAmount": 2500000.00,                              // Decimal
  "creditAmount": 0.0,                                    // Decimal
  "depreciationBookCode": "COMPANY",                      // Code[10]
  "noOfDepreciationDays": 0,                              // Integer
  "dimensionSetID": 7890,
  "createdAt": "2024-06-01T08:00:00Z",
  "lastModifiedDateTime": "2024-06-01T08:00:00Z"
}
```

---

## 45. `dimensionSetEntries`

**GET** `/dimensionSetEntries?$filter=dimensionSetID eq 1234`
**Source Table:** Dimension Set Entry | **Page ID:** 70144

```json
{
  "id": "...",
  "dimensionSetID": 1234,                                 // Integer
  "dimensionCode": "DEPARTMENT",                          // Code[20]
  "dimensionValueCode": "SALES",                          // Code[20]
  "dimensionValueID": 5,                                  // Integer
  "dimensionName": "Department",                          // ⚡ Text (FlowField)
  "dimensionValueName": "Sales Department",               // ⚡ Text (FlowField)
  "globalDimensionNo": 1,                                 // Integer
  "createdAt": "2025-03-01T09:00:00Z",
  "lastModifiedDateTime": "2025-03-01T09:00:00Z"
}
```

---

## 46. `dimensionValues`

**GET** `/dimensionValues?$filter=dimensionCode eq 'DEPARTMENT'`
**Source Table:** Dimension Value | **Page ID:** 70145

```json
{
  "id": "...",
  "dimensionCode": "DEPARTMENT",                          // Code[20]
  "codeValue": "SALES",                                   // Code[20]
  "nameValue": "Sales Department",                        // Text[50]
  "dimensionValueType": "Standard",                       // Enum (Standard/Heading/Total/Begin-Total/End-Total)
  "totaling": "",                                         // Text[250]
  "blockedValue": false,                                  // Boolean
  "consolidationCode": "",                                // Code[20]
  "indentation": 0,                                       // Integer
  "globalDimensionNo": 1,                                 // Integer
  "mapToICDimensionCode": "",                             // Code[20]
  "mapToICDimensionValueCode": "",                        // Code[20]
  "dimensionValueID": 5,                                  // Integer
  "lastModifiedDateTimeBC": "2024-01-01T08:00:00Z",      // DateTime
  "dimensionId": "00000000-0000-0000-0000-000000000000",  // Guid
  "createdAt": "2024-01-01T08:00:00Z",
  "lastModifiedDateTime": "2025-01-01T08:00:00Z"
}
```

---

## สรุปปัญหาที่แก้ไขแล้ว

### ปัญหาที่ 1: `workDescription` (BLOB) ไม่ได้ CalcFields — แก้ไขแล้ว ✅

| ไฟล์ | สถานะ |
|---|---|
| SalesOrderAPI.Page.al | ✅ เพิ่ม `"Work Description"` ใน CalcFields |
| SalesInvoiceAPI.Page.al | ✅ เพิ่ม `"Work Description"` ใน CalcFields |
| SalesCreditMemoAPI.Page.al | ✅ เพิ่ม `"Work Description"` ใน CalcFields |
| SalesQuoteAPI.Page.al | ✅ เพิ่ม `"Work Description"` ใน CalcFields |
| PostedSalesInvoiceAPI.Page.al | ✅ เพิ่ม `"Work Description"` ใน CalcFields |

### ปัญหาที่ 2: `image` (Media) อาจ return null — ปกติ ⚠️

Customer, Vendor, Bank Account, Fixed Asset มี field `image` เป็น Media type
- ถ้า record มีรูปภาพ → return base64 string
- ถ้าไม่มีรูปภาพ → return `null` (พฤติกรรมปกติ ไม่ใช่ bug)

### Fields ที่อาจดูเหมือน "ไม่มีข้อมูล" แต่เป็นเรื่องปกติ

| สาเหตุ | ตัวอย่าง |
|---|---|
| Table ว่าง (ยังไม่มี records) | postedSalesCreditMemos return `[]` ถ้ายังไม่เคย post credit memo |
| Field ค่าเป็น default/ว่าง | `currencyCode: ""` หมายถึงใช้ LCY (local currency) |
| DateFormula fields | `leadTimeCalculation: ""` แปลว่ายังไม่ได้ตั้งค่า |
| Enum default เป็นช่องว่าง | `documentType: " "` เป็นค่า default ของบาง enum |
| Date ค่า 0001-01-01 | `pmtDiscountDate: "0001-01-01"` = ไม่ได้กำหนด |
