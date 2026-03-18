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
| 1 | `items` | Item | 85 | — |
| 2 | `salesOrders` | Sales Header (Order) | 181 | salesOrderLines |
| 3 | `salesOrderLines` | Sales Line (Order) | 173 | — |
| 4 | `salesQuotes` | Sales Header (Quote) | 181 | salesQuoteLines |
| 5 | `salesQuoteLines` | Sales Line (Quote) | 173 | — |
| 6 | `salesInvoices` | Sales Header (Invoice) | 181 | salesInvoiceLines |
| 7 | `salesInvoiceLines` | Sales Line (Invoice) | 173 | — |
| 8 | `salesCreditMemos` | Sales Header (Credit Memo) | 181 | salesCreditMemoLines |
| 9 | `salesCreditMemoLines` | Sales Line (Credit Memo) | 173 | — |
| 10 | `postedSalesInvoices` | Sales Invoice Header | 139 | postedSalesInvoiceLines |
| 11 | `postedSalesInvoiceLines` | Sales Invoice Line | 100 | — |
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
| 22 | `postedPurchInvoices` | Purch. Inv. Header | 113 | postedPurchInvoiceLines |
| 23 | `postedPurchInvoiceLines` | Purch. Inv. Line | 112 | — |
| 24 | `postedPurchaseReceipts` | Purch. Rcpt. Header | 98 | postedPurchaseReceiptLines |
| 25 | `postedPurchaseReceiptLines` | Purch. Rcpt. Line | 119 | — |
| 26 | `postedPurchaseCreditMemos` | Purch. Cr. Memo Hdr. | 107 | postedPurchaseCreditMemoLines |
| 27 | `postedPurchaseCreditMemoLines` | Purch. Cr. Memo Line | 118 | — |
| 28 | `productionOrders` | Production Order | 54 | productionOrderLines |
| 29 | `productionOrderLines` | Prod. Order Line | 62 | productionOrderComponents |
| 30 | `productionOrderComponents` | Prod. Order Component | 62 | — |
| 31 | `customers` | Customer | 162 | — |
| 32 | `vendors` | Vendor | 141 | — |
| 33 | `bankAccounts` | Bank Account | 80 | — |
| 34 | `glAccounts` | G/L Account | 66 | — |
| 35 | `gLEntries` | G/L Entry | 74 | — |
| 36 | `customerLedgerEntries` | Cust. Ledger Entry | 92 | — |
| 37 | `detailedCustLedgerEntries` | Detailed Cust. Ledg. Entry | 41 | — |
| 38 | `vendorLedgerEntries` | Vendor Ledger Entry | 87 | — |
| 39 | `detailedVendorLedgerEntries` | Detailed Vendor Ledg. Entry | 41 | — |
| 40 | `bankAccountLedgerEntries` | Bank Account Ledger Entry | 50 | — |
| 41 | `valueEntries` | Value Entry | 69 | — |
| 42 | `itemLedgerEntries` | Item Ledger Entry | 76 | — |
| 43 | `fixedAssets` | Fixed Asset | 34 | — |
| 44 | `faLedgerEntries` | FA Ledger Entry | 84 | — |
| 45 | `dimensionSetEntries` | Dimension Set Entry | 10 | — |
| 46 | `dimensionValues` | Dimension Value | 17 | — |

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

---

## Fixed Assets

```
GET /companies({companyId})/fixedAssets
GET /companies({companyId})/faLedgerEntries?$filter=fANo eq 'FA001'
```

---

## Complete Field Listings

ด้านล่างนี้คือรายชื่อ field ทั้งหมดของแต่ละ endpoint (ใช้ชื่อ camelCase ที่ส่งผ่าน API)

### `items`

**Source Table:** Item | **Fields:** 85

```
id, no, description, description2, searchDescription, type, blocked, salesBlocked, purchasingBlocked, lastDateModified, baseUnitOfMeasure, salesUnitOfMeasure, purchUnitOfMeasure, unitPrice, priceProfitCalculation, profitPct, unitCost, standardCost, lastDirectCost, indirectCostPct, costingMethod, vatBusPostingGrPrice, genProdPostingGroup, vatProdPostingGroup, inventoryPostingGroup, taxGroupCode, globalDimension1Code, globalDimension2Code, itemCategoryCode, serviceItemGroup, inventory, netInvoicedQty, qtyInTransit, transOrdReceiptQty, transOrdShipmentQty, substitutesExist, stockkeepingUnitExists, assemblyBOM, vendorNo, vendorItemNo, leadTimeCalculation, purchasingCode, overReceiptCode, grossWeight, netWeight, unitsPerParcel, unitVolume, reorderPoint, maximumInventory, reorderQuantity, minimumOrderQuantity, maximumOrderQuantity, safetyStockQuantity, orderMultiple, safetyLeadTime, dampenerPeriod, dampenerQuantity, reorderingPolicy, includeInventory, manufacturingPolicy, productionBOMNo, routingNo, scrapPct, inventoryValueZero, rolledUpMaterialCost, rolledUpCapacityCost, discreteOrderQuantity, itemTrackingCode, lotNos, serialNos, expirationCalculation, warehouseClassCode, specialEquipmentCode, putAwayTemplateCode, putAwayUnitOfMeasureCode, costIsAdjusted, costIsPostedToGL, lastUnitCostCalcDate, reserve, tariffNo, dutyDuePct, dutyCode, countryRegionPurchasedCode, createdAt, lastModifiedDateTime
```

### `salesOrders`

**Source Table:** Sales Header (Order) | **Fields:** 181 | **Nested:** salesOrderLines

```
id, documentType, sellToCustomerNo, noValue, billToCustomerNo, billToName, billToName2, billToAddress, billToAddress2, billToCity, billToContact, yourReference, shipToCode, shipToName, shipToName2, shipToAddress, shipToAddress2, shipToCity, shipToContact, orderDate, postingDate, shipmentDate, postingDescription, paymentTermsCode, dueDate, paymentDiscount, pmtDiscountDate, shipmentMethodCode, locationCode, shortcutDimension1Code, shortcutDimension2Code, customerPostingGroup, currencyCode, currencyFactor, customerPriceGroup, pricesIncludingVAT, invoiceDiscCode, customerDiscGroup, languageCode, formatRegion, salespersonCode, orderClass, commentValue, noPrinted, onHold, appliesToDocType, appliesToDocNo, balAccountNo, recalculateInvoiceDisc, ship, invoice, printPostedDocuments, amountValue, amountIncludingVAT, shippingNo, postingNo, lastShippingNo, lastPostingNo, prepaymentNo, lastPrepaymentNo, prepmtCrMemoNo, lastPrepmtCrMemoNo, vATRegistrationNo, combineShipments, registrationNumber, reasonCode, genBusPostingGroup, eU3PartyTrade, transactionType, transportMethod, vATCountryRegionCode, sellToCustomerName, sellToCustomerName2, sellToAddress, sellToAddress2, sellToCity, sellToContact, billToPostCode, billToCounty, billToCountryRegionCode, sellToPostCode, sellToCounty, sellToCountryRegionCode, shipToPostCode, shipToCounty, shipToCountryRegionCode, balAccountType, exitPoint, correctionValue, documentDate, externalDocumentNo, areaValue, transactionSpecification, paymentMethodCode, shippingAgentCode, packageTrackingNo, noSeries, postingNoSeries, shippingNoSeries, taxAreaCode, taxLiable, vATBusPostingGroup, reserve, appliesToID, vATBaseDiscount, status, invoiceDiscountCalculation, invoiceDiscountValue, sendICDocument, iCStatus, sellToICPartnerCode, billToICPartnerCode, iCReferenceDocumentNo, iCDirection, prepayment, prepaymentNoSeries, compressPrepayment, prepaymentDueDate, prepmtCrMemoNoSeries, prepmtPostingDescription, prepmtPmtDiscountDate, prepmtPaymentTermsCode, prepmtPaymentDiscount, quoteNo, quoteValidUntilDate, quoteSentToCustomer, quoteAccepted, quoteAcceptedDate, jobQueueStatus, jobQueueEntryID, companyBankAccountCode, incomingDocumentEntryNo, altVATRegistrationNo, altGenBusPostingGroup, altVATBusPostingGroup, isTest, sellToPhoneNo, sellToEMail, journalTemplName, vATReportingDate, rcvdFromCountRegionCode, lastEmailSentTime, lastEmailSentMessageId, workDescription, shipToPhoneNo, dimensionSetID, paymentServiceSetID, coupledToDataverse, directDebitMandateID, invoiceDiscountAmount, noOfArchivedVersions, docNoOccurrence, campaignNo, sellToContactNo, billToContactNo, opportunityNo, sellToCustomerTemplCode, billToCustomerTemplCode, responsibilityCenter, shippingAdvice, shippedNotInvoiced, completelyShipped, postingFromWhseRef, shipped, lastShipmentDate, requestedDeliveryDate, promisedDeliveryDate, shippingTime, outboundWhseHandlingTime, shippingAgentServiceCode, lateOrderShipping, receive, returnReceiptNo, returnReceiptNoSeries, lastReturnReceiptNo, priceCalculationMethod, allowLineDisc, getShipmentUsed, assignedUserID, createdAt, lastModifiedDateTime
```

### `salesOrderLines`

**Source Table:** Sales Line (Order) | **Fields:** 173

```
id, documentType, sellToCustomerNo, documentNo, lineNo, typeValue, noValue, locationCode, postingGroup, shipmentDate, descriptionValue, description2, unitOfMeasure, quantityValue, outstandingQuantity, qtyToInvoice, qtyToShip, unitPrice, vAT, lineDiscount, lineDiscountAmount, amountValue, amountIncludingVAT, allowInvoiceDisc, grossWeight, netWeight, unitsPerParcel, unitVolume, applToItemEntry, shortcutDimension1Code, shortcutDimension2Code, customerPriceGroup, jobNo, workTypeCode, recalculateInvoiceDisc, outstandingAmount, qtyShippedNotInvoiced, shippedNotInvoiced, quantityShipped, quantityInvoiced, shipmentNo, shipmentLineNo, profit, billToCustomerNo, invDiscountAmount, purchaseOrderNo, purchOrderLineNo, dropShipment, genBusPostingGroup, genProdPostingGroup, vATCalculationType, transactionType, transportMethod, attachedToLineNo, exitPoint, areaValue, transactionSpecification, taxCategory, taxAreaCode, taxLiable, taxGroupCode, vATClauseCode, vATBusPostingGroup, vATProdPostingGroup, currencyCode, reservedQuantity, reserve, blanketOrderNo, blanketOrderLineNo, vATBaseAmount, unitCost, systemCreatedEntry, lineAmount, vATDifference, invDiscAmountToInvoice, vATIdentifier, iCPartnerRefType, iCPartnerReference, prepayment, prepmtLineAmount, prepmtAmtInv, prepmtAmtInclVAT, prepaymentAmount, prepmtVATBaseAmt, prepaymentVAT, prepmtVATCalcType, prepaymentVATIdentifier, prepaymentTaxAreaCode, prepaymentTaxLiable, prepaymentTaxGroupCode, prepmtAmtToDeduct, prepmtAmtDeducted, prepaymentLine, prepmtAmountInvInclVAT, iCPartnerCode, prepaymentVATDifference, prepmtVATDiffToDeduct, prepmtVATDiffDeducted, iCItemReferenceNo, pmtDiscountAmount, prepmtPmtDiscountAmount, lineDiscountCalculation, dimensionSetID, qtyToAssembleToOrder, aTOWhseOutstandingQty, jobTaskNo, jobContractEntryNo, postingDate, deferralCode, returnsDeferralStartDate, selectedAllocAccountNo, allocAccModifiedByUser, allocationAccountNo, variantCode, binCode, qtyPerUnitOfMeasure, planned, qtyRoundingPrecision, unitOfMeasureCode, fAPostingDate, depreciationBookCode, deprUntilFAPostingDate, duplicateInDepreciationBook, useDuplicationList, responsibilityCenter, outOfStockSubstitution, substitutionAvailable, originallyOrderedNo, originallyOrderedVarCode, itemCategoryCode, nonstock, purchasingCode, specialOrder, specialOrderPurchaseNo, specialOrderPurchLineNo, itemReferenceNo, itemReferenceUnitOfMeasure, itemReferenceType, itemReferenceTypeNo, whseOutstandingQty, completelyShipped, requestedDeliveryDate, promisedDeliveryDate, shippingTime, outboundWhseHandlingTime, plannedDeliveryDate, plannedShipmentDate, shippingAgentCode, shippingAgentServiceCode, allowItemChargeAssignment, qtyToAssign, qtyAssigned, returnQtyToReceive, returnQtyRcdNotInvd, returnRcdNotInvd, returnQtyReceived, applFromItemEntry, itemChargeQtyToHandle, bOMItemNo, returnReceiptNo, returnReceiptLineNo, returnReasonCode, copiedFromPostedDoc, priceCalculationMethod, allowLineDisc, customerDiscGroup, subtype, priceDescription, attachedDocCount, attachedLinesCount, sellToCustomerName, createdAt, lastModifiedDateTime
```

### `salesQuotes`

**Source Table:** Sales Header (Quote) | **Fields:** 181 | **Nested:** salesQuoteLines

```
id, documentType, sellToCustomerNo, noValue, billToCustomerNo, billToName, billToName2, billToAddress, billToAddress2, billToCity, billToContact, yourReference, shipToCode, shipToName, shipToName2, shipToAddress, shipToAddress2, shipToCity, shipToContact, orderDate, postingDate, shipmentDate, postingDescription, paymentTermsCode, dueDate, paymentDiscount, pmtDiscountDate, shipmentMethodCode, locationCode, shortcutDimension1Code, shortcutDimension2Code, customerPostingGroup, currencyCode, currencyFactor, customerPriceGroup, pricesIncludingVAT, invoiceDiscCode, customerDiscGroup, languageCode, formatRegion, salespersonCode, orderClass, commentValue, noPrinted, onHold, appliesToDocType, appliesToDocNo, balAccountNo, recalculateInvoiceDisc, ship, invoice, printPostedDocuments, amountValue, amountIncludingVAT, shippingNo, postingNo, lastShippingNo, lastPostingNo, prepaymentNo, lastPrepaymentNo, prepmtCrMemoNo, lastPrepmtCrMemoNo, vATRegistrationNo, combineShipments, registrationNumber, reasonCode, genBusPostingGroup, eU3PartyTrade, transactionType, transportMethod, vATCountryRegionCode, sellToCustomerName, sellToCustomerName2, sellToAddress, sellToAddress2, sellToCity, sellToContact, billToPostCode, billToCounty, billToCountryRegionCode, sellToPostCode, sellToCounty, sellToCountryRegionCode, shipToPostCode, shipToCounty, shipToCountryRegionCode, balAccountType, exitPoint, correctionValue, documentDate, externalDocumentNo, areaValue, transactionSpecification, paymentMethodCode, shippingAgentCode, packageTrackingNo, noSeries, postingNoSeries, shippingNoSeries, taxAreaCode, taxLiable, vATBusPostingGroup, reserve, appliesToID, vATBaseDiscount, status, invoiceDiscountCalculation, invoiceDiscountValue, sendICDocument, iCStatus, sellToICPartnerCode, billToICPartnerCode, iCReferenceDocumentNo, iCDirection, prepayment, prepaymentNoSeries, compressPrepayment, prepaymentDueDate, prepmtCrMemoNoSeries, prepmtPostingDescription, prepmtPmtDiscountDate, prepmtPaymentTermsCode, prepmtPaymentDiscount, quoteNo, quoteValidUntilDate, quoteSentToCustomer, quoteAccepted, quoteAcceptedDate, jobQueueStatus, jobQueueEntryID, companyBankAccountCode, incomingDocumentEntryNo, altVATRegistrationNo, altGenBusPostingGroup, altVATBusPostingGroup, isTest, sellToPhoneNo, sellToEMail, journalTemplName, vATReportingDate, rcvdFromCountRegionCode, lastEmailSentTime, lastEmailSentMessageId, workDescription, shipToPhoneNo, dimensionSetID, paymentServiceSetID, coupledToDataverse, directDebitMandateID, invoiceDiscountAmount, noOfArchivedVersions, docNoOccurrence, campaignNo, sellToContactNo, billToContactNo, opportunityNo, sellToCustomerTemplCode, billToCustomerTemplCode, responsibilityCenter, shippingAdvice, shippedNotInvoiced, completelyShipped, postingFromWhseRef, shipped, lastShipmentDate, requestedDeliveryDate, promisedDeliveryDate, shippingTime, outboundWhseHandlingTime, shippingAgentServiceCode, lateOrderShipping, receive, returnReceiptNo, returnReceiptNoSeries, lastReturnReceiptNo, priceCalculationMethod, allowLineDisc, getShipmentUsed, assignedUserID, createdAt, lastModifiedDateTime
```

### `salesQuoteLines`

**Source Table:** Sales Line (Quote) | **Fields:** 173

```
id, documentType, sellToCustomerNo, documentNo, lineNo, typeValue, noValue, locationCode, postingGroup, shipmentDate, descriptionValue, description2, unitOfMeasure, quantityValue, outstandingQuantity, qtyToInvoice, qtyToShip, unitPrice, vAT, lineDiscount, lineDiscountAmount, amountValue, amountIncludingVAT, allowInvoiceDisc, grossWeight, netWeight, unitsPerParcel, unitVolume, applToItemEntry, shortcutDimension1Code, shortcutDimension2Code, customerPriceGroup, jobNo, workTypeCode, recalculateInvoiceDisc, outstandingAmount, qtyShippedNotInvoiced, shippedNotInvoiced, quantityShipped, quantityInvoiced, shipmentNo, shipmentLineNo, profit, billToCustomerNo, invDiscountAmount, purchaseOrderNo, purchOrderLineNo, dropShipment, genBusPostingGroup, genProdPostingGroup, vATCalculationType, transactionType, transportMethod, attachedToLineNo, exitPoint, areaValue, transactionSpecification, taxCategory, taxAreaCode, taxLiable, taxGroupCode, vATClauseCode, vATBusPostingGroup, vATProdPostingGroup, currencyCode, reservedQuantity, reserve, blanketOrderNo, blanketOrderLineNo, vATBaseAmount, unitCost, systemCreatedEntry, lineAmount, vATDifference, invDiscAmountToInvoice, vATIdentifier, iCPartnerRefType, iCPartnerReference, prepayment, prepmtLineAmount, prepmtAmtInv, prepmtAmtInclVAT, prepaymentAmount, prepmtVATBaseAmt, prepaymentVAT, prepmtVATCalcType, prepaymentVATIdentifier, prepaymentTaxAreaCode, prepaymentTaxLiable, prepaymentTaxGroupCode, prepmtAmtToDeduct, prepmtAmtDeducted, prepaymentLine, prepmtAmountInvInclVAT, iCPartnerCode, prepaymentVATDifference, prepmtVATDiffToDeduct, prepmtVATDiffDeducted, iCItemReferenceNo, pmtDiscountAmount, prepmtPmtDiscountAmount, lineDiscountCalculation, dimensionSetID, qtyToAssembleToOrder, aTOWhseOutstandingQty, jobTaskNo, jobContractEntryNo, postingDate, deferralCode, returnsDeferralStartDate, selectedAllocAccountNo, allocAccModifiedByUser, allocationAccountNo, variantCode, binCode, qtyPerUnitOfMeasure, planned, qtyRoundingPrecision, unitOfMeasureCode, fAPostingDate, depreciationBookCode, deprUntilFAPostingDate, duplicateInDepreciationBook, useDuplicationList, responsibilityCenter, outOfStockSubstitution, substitutionAvailable, originallyOrderedNo, originallyOrderedVarCode, itemCategoryCode, nonstock, purchasingCode, specialOrder, specialOrderPurchaseNo, specialOrderPurchLineNo, itemReferenceNo, itemReferenceUnitOfMeasure, itemReferenceType, itemReferenceTypeNo, whseOutstandingQty, completelyShipped, requestedDeliveryDate, promisedDeliveryDate, shippingTime, outboundWhseHandlingTime, plannedDeliveryDate, plannedShipmentDate, shippingAgentCode, shippingAgentServiceCode, allowItemChargeAssignment, qtyToAssign, qtyAssigned, returnQtyToReceive, returnQtyRcdNotInvd, returnRcdNotInvd, returnQtyReceived, applFromItemEntry, itemChargeQtyToHandle, bOMItemNo, returnReceiptNo, returnReceiptLineNo, returnReasonCode, copiedFromPostedDoc, priceCalculationMethod, allowLineDisc, customerDiscGroup, subtype, priceDescription, attachedDocCount, attachedLinesCount, sellToCustomerName, createdAt, lastModifiedDateTime
```

### `salesInvoices`

**Source Table:** Sales Header (Invoice) | **Fields:** 181 | **Nested:** salesInvoiceLines

```
id, documentType, sellToCustomerNo, noValue, billToCustomerNo, billToName, billToName2, billToAddress, billToAddress2, billToCity, billToContact, yourReference, shipToCode, shipToName, shipToName2, shipToAddress, shipToAddress2, shipToCity, shipToContact, orderDate, postingDate, shipmentDate, postingDescription, paymentTermsCode, dueDate, paymentDiscount, pmtDiscountDate, shipmentMethodCode, locationCode, shortcutDimension1Code, shortcutDimension2Code, customerPostingGroup, currencyCode, currencyFactor, customerPriceGroup, pricesIncludingVAT, invoiceDiscCode, customerDiscGroup, languageCode, formatRegion, salespersonCode, orderClass, commentValue, noPrinted, onHold, appliesToDocType, appliesToDocNo, balAccountNo, recalculateInvoiceDisc, ship, invoice, printPostedDocuments, amountValue, amountIncludingVAT, shippingNo, postingNo, lastShippingNo, lastPostingNo, prepaymentNo, lastPrepaymentNo, prepmtCrMemoNo, lastPrepmtCrMemoNo, vATRegistrationNo, combineShipments, registrationNumber, reasonCode, genBusPostingGroup, eU3PartyTrade, transactionType, transportMethod, vATCountryRegionCode, sellToCustomerName, sellToCustomerName2, sellToAddress, sellToAddress2, sellToCity, sellToContact, billToPostCode, billToCounty, billToCountryRegionCode, sellToPostCode, sellToCounty, sellToCountryRegionCode, shipToPostCode, shipToCounty, shipToCountryRegionCode, balAccountType, exitPoint, correctionValue, documentDate, externalDocumentNo, areaValue, transactionSpecification, paymentMethodCode, shippingAgentCode, packageTrackingNo, noSeries, postingNoSeries, shippingNoSeries, taxAreaCode, taxLiable, vATBusPostingGroup, reserve, appliesToID, vATBaseDiscount, status, invoiceDiscountCalculation, invoiceDiscountValue, sendICDocument, iCStatus, sellToICPartnerCode, billToICPartnerCode, iCReferenceDocumentNo, iCDirection, prepayment, prepaymentNoSeries, compressPrepayment, prepaymentDueDate, prepmtCrMemoNoSeries, prepmtPostingDescription, prepmtPmtDiscountDate, prepmtPaymentTermsCode, prepmtPaymentDiscount, quoteNo, quoteValidUntilDate, quoteSentToCustomer, quoteAccepted, quoteAcceptedDate, jobQueueStatus, jobQueueEntryID, companyBankAccountCode, incomingDocumentEntryNo, altVATRegistrationNo, altGenBusPostingGroup, altVATBusPostingGroup, isTest, sellToPhoneNo, sellToEMail, journalTemplName, vATReportingDate, rcvdFromCountRegionCode, lastEmailSentTime, lastEmailSentMessageId, workDescription, shipToPhoneNo, dimensionSetID, paymentServiceSetID, coupledToDataverse, directDebitMandateID, invoiceDiscountAmount, noOfArchivedVersions, docNoOccurrence, campaignNo, sellToContactNo, billToContactNo, opportunityNo, sellToCustomerTemplCode, billToCustomerTemplCode, responsibilityCenter, shippingAdvice, shippedNotInvoiced, completelyShipped, postingFromWhseRef, shipped, lastShipmentDate, requestedDeliveryDate, promisedDeliveryDate, shippingTime, outboundWhseHandlingTime, shippingAgentServiceCode, lateOrderShipping, receive, returnReceiptNo, returnReceiptNoSeries, lastReturnReceiptNo, priceCalculationMethod, allowLineDisc, getShipmentUsed, assignedUserID, createdAt, lastModifiedDateTime
```

### `salesInvoiceLines`

**Source Table:** Sales Line (Invoice) | **Fields:** 173

```
id, documentType, sellToCustomerNo, documentNo, lineNo, typeValue, noValue, locationCode, postingGroup, shipmentDate, descriptionValue, description2, unitOfMeasure, quantityValue, outstandingQuantity, qtyToInvoice, qtyToShip, unitPrice, vAT, lineDiscount, lineDiscountAmount, amountValue, amountIncludingVAT, allowInvoiceDisc, grossWeight, netWeight, unitsPerParcel, unitVolume, applToItemEntry, shortcutDimension1Code, shortcutDimension2Code, customerPriceGroup, jobNo, workTypeCode, recalculateInvoiceDisc, outstandingAmount, qtyShippedNotInvoiced, shippedNotInvoiced, quantityShipped, quantityInvoiced, shipmentNo, shipmentLineNo, profit, billToCustomerNo, invDiscountAmount, purchaseOrderNo, purchOrderLineNo, dropShipment, genBusPostingGroup, genProdPostingGroup, vATCalculationType, transactionType, transportMethod, attachedToLineNo, exitPoint, areaValue, transactionSpecification, taxCategory, taxAreaCode, taxLiable, taxGroupCode, vATClauseCode, vATBusPostingGroup, vATProdPostingGroup, currencyCode, reservedQuantity, reserve, blanketOrderNo, blanketOrderLineNo, vATBaseAmount, unitCost, systemCreatedEntry, lineAmount, vATDifference, invDiscAmountToInvoice, vATIdentifier, iCPartnerRefType, iCPartnerReference, prepayment, prepmtLineAmount, prepmtAmtInv, prepmtAmtInclVAT, prepaymentAmount, prepmtVATBaseAmt, prepaymentVAT, prepmtVATCalcType, prepaymentVATIdentifier, prepaymentTaxAreaCode, prepaymentTaxLiable, prepaymentTaxGroupCode, prepmtAmtToDeduct, prepmtAmtDeducted, prepaymentLine, prepmtAmountInvInclVAT, iCPartnerCode, prepaymentVATDifference, prepmtVATDiffToDeduct, prepmtVATDiffDeducted, iCItemReferenceNo, pmtDiscountAmount, prepmtPmtDiscountAmount, lineDiscountCalculation, dimensionSetID, qtyToAssembleToOrder, aTOWhseOutstandingQty, jobTaskNo, jobContractEntryNo, postingDate, deferralCode, returnsDeferralStartDate, selectedAllocAccountNo, allocAccModifiedByUser, allocationAccountNo, variantCode, binCode, qtyPerUnitOfMeasure, planned, qtyRoundingPrecision, unitOfMeasureCode, fAPostingDate, depreciationBookCode, deprUntilFAPostingDate, duplicateInDepreciationBook, useDuplicationList, responsibilityCenter, outOfStockSubstitution, substitutionAvailable, originallyOrderedNo, originallyOrderedVarCode, itemCategoryCode, nonstock, purchasingCode, specialOrder, specialOrderPurchaseNo, specialOrderPurchLineNo, itemReferenceNo, itemReferenceUnitOfMeasure, itemReferenceType, itemReferenceTypeNo, whseOutstandingQty, completelyShipped, requestedDeliveryDate, promisedDeliveryDate, shippingTime, outboundWhseHandlingTime, plannedDeliveryDate, plannedShipmentDate, shippingAgentCode, shippingAgentServiceCode, allowItemChargeAssignment, qtyToAssign, qtyAssigned, returnQtyToReceive, returnQtyRcdNotInvd, returnRcdNotInvd, returnQtyReceived, applFromItemEntry, itemChargeQtyToHandle, bOMItemNo, returnReceiptNo, returnReceiptLineNo, returnReasonCode, copiedFromPostedDoc, priceCalculationMethod, allowLineDisc, customerDiscGroup, subtype, priceDescription, attachedDocCount, attachedLinesCount, sellToCustomerName, createdAt, lastModifiedDateTime
```

### `salesCreditMemos`

**Source Table:** Sales Header (Credit Memo) | **Fields:** 181 | **Nested:** salesCreditMemoLines

```
id, documentType, sellToCustomerNo, noValue, billToCustomerNo, billToName, billToName2, billToAddress, billToAddress2, billToCity, billToContact, yourReference, shipToCode, shipToName, shipToName2, shipToAddress, shipToAddress2, shipToCity, shipToContact, orderDate, postingDate, shipmentDate, postingDescription, paymentTermsCode, dueDate, paymentDiscount, pmtDiscountDate, shipmentMethodCode, locationCode, shortcutDimension1Code, shortcutDimension2Code, customerPostingGroup, currencyCode, currencyFactor, customerPriceGroup, pricesIncludingVAT, invoiceDiscCode, customerDiscGroup, languageCode, formatRegion, salespersonCode, orderClass, commentValue, noPrinted, onHold, appliesToDocType, appliesToDocNo, balAccountNo, recalculateInvoiceDisc, ship, invoice, printPostedDocuments, amountValue, amountIncludingVAT, shippingNo, postingNo, lastShippingNo, lastPostingNo, prepaymentNo, lastPrepaymentNo, prepmtCrMemoNo, lastPrepmtCrMemoNo, vATRegistrationNo, combineShipments, registrationNumber, reasonCode, genBusPostingGroup, eU3PartyTrade, transactionType, transportMethod, vATCountryRegionCode, sellToCustomerName, sellToCustomerName2, sellToAddress, sellToAddress2, sellToCity, sellToContact, billToPostCode, billToCounty, billToCountryRegionCode, sellToPostCode, sellToCounty, sellToCountryRegionCode, shipToPostCode, shipToCounty, shipToCountryRegionCode, balAccountType, exitPoint, correctionValue, documentDate, externalDocumentNo, areaValue, transactionSpecification, paymentMethodCode, shippingAgentCode, packageTrackingNo, noSeries, postingNoSeries, shippingNoSeries, taxAreaCode, taxLiable, vATBusPostingGroup, reserve, appliesToID, vATBaseDiscount, status, invoiceDiscountCalculation, invoiceDiscountValue, sendICDocument, iCStatus, sellToICPartnerCode, billToICPartnerCode, iCReferenceDocumentNo, iCDirection, prepayment, prepaymentNoSeries, compressPrepayment, prepaymentDueDate, prepmtCrMemoNoSeries, prepmtPostingDescription, prepmtPmtDiscountDate, prepmtPaymentTermsCode, prepmtPaymentDiscount, quoteNo, quoteValidUntilDate, quoteSentToCustomer, quoteAccepted, quoteAcceptedDate, jobQueueStatus, jobQueueEntryID, companyBankAccountCode, incomingDocumentEntryNo, altVATRegistrationNo, altGenBusPostingGroup, altVATBusPostingGroup, isTest, sellToPhoneNo, sellToEMail, journalTemplName, vATReportingDate, rcvdFromCountRegionCode, lastEmailSentTime, lastEmailSentMessageId, workDescription, shipToPhoneNo, dimensionSetID, paymentServiceSetID, coupledToDataverse, directDebitMandateID, invoiceDiscountAmount, noOfArchivedVersions, docNoOccurrence, campaignNo, sellToContactNo, billToContactNo, opportunityNo, sellToCustomerTemplCode, billToCustomerTemplCode, responsibilityCenter, shippingAdvice, shippedNotInvoiced, completelyShipped, postingFromWhseRef, shipped, lastShipmentDate, requestedDeliveryDate, promisedDeliveryDate, shippingTime, outboundWhseHandlingTime, shippingAgentServiceCode, lateOrderShipping, receive, returnReceiptNo, returnReceiptNoSeries, lastReturnReceiptNo, priceCalculationMethod, allowLineDisc, getShipmentUsed, assignedUserID, createdAt, lastModifiedDateTime
```

### `salesCreditMemoLines`

**Source Table:** Sales Line (Credit Memo) | **Fields:** 173

```
id, documentType, sellToCustomerNo, documentNo, lineNo, typeValue, noValue, locationCode, postingGroup, shipmentDate, descriptionValue, description2, unitOfMeasure, quantityValue, outstandingQuantity, qtyToInvoice, qtyToShip, unitPrice, vAT, lineDiscount, lineDiscountAmount, amountValue, amountIncludingVAT, allowInvoiceDisc, grossWeight, netWeight, unitsPerParcel, unitVolume, applToItemEntry, shortcutDimension1Code, shortcutDimension2Code, customerPriceGroup, jobNo, workTypeCode, recalculateInvoiceDisc, outstandingAmount, qtyShippedNotInvoiced, shippedNotInvoiced, quantityShipped, quantityInvoiced, shipmentNo, shipmentLineNo, profit, billToCustomerNo, invDiscountAmount, purchaseOrderNo, purchOrderLineNo, dropShipment, genBusPostingGroup, genProdPostingGroup, vATCalculationType, transactionType, transportMethod, attachedToLineNo, exitPoint, areaValue, transactionSpecification, taxCategory, taxAreaCode, taxLiable, taxGroupCode, vATClauseCode, vATBusPostingGroup, vATProdPostingGroup, currencyCode, reservedQuantity, reserve, blanketOrderNo, blanketOrderLineNo, vATBaseAmount, unitCost, systemCreatedEntry, lineAmount, vATDifference, invDiscAmountToInvoice, vATIdentifier, iCPartnerRefType, iCPartnerReference, prepayment, prepmtLineAmount, prepmtAmtInv, prepmtAmtInclVAT, prepaymentAmount, prepmtVATBaseAmt, prepaymentVAT, prepmtVATCalcType, prepaymentVATIdentifier, prepaymentTaxAreaCode, prepaymentTaxLiable, prepaymentTaxGroupCode, prepmtAmtToDeduct, prepmtAmtDeducted, prepaymentLine, prepmtAmountInvInclVAT, iCPartnerCode, prepaymentVATDifference, prepmtVATDiffToDeduct, prepmtVATDiffDeducted, iCItemReferenceNo, pmtDiscountAmount, prepmtPmtDiscountAmount, lineDiscountCalculation, dimensionSetID, qtyToAssembleToOrder, aTOWhseOutstandingQty, jobTaskNo, jobContractEntryNo, postingDate, deferralCode, returnsDeferralStartDate, selectedAllocAccountNo, allocAccModifiedByUser, allocationAccountNo, variantCode, binCode, qtyPerUnitOfMeasure, planned, qtyRoundingPrecision, unitOfMeasureCode, fAPostingDate, depreciationBookCode, deprUntilFAPostingDate, duplicateInDepreciationBook, useDuplicationList, responsibilityCenter, outOfStockSubstitution, substitutionAvailable, originallyOrderedNo, originallyOrderedVarCode, itemCategoryCode, nonstock, purchasingCode, specialOrder, specialOrderPurchaseNo, specialOrderPurchLineNo, itemReferenceNo, itemReferenceUnitOfMeasure, itemReferenceType, itemReferenceTypeNo, whseOutstandingQty, completelyShipped, requestedDeliveryDate, promisedDeliveryDate, shippingTime, outboundWhseHandlingTime, plannedDeliveryDate, plannedShipmentDate, shippingAgentCode, shippingAgentServiceCode, allowItemChargeAssignment, qtyToAssign, qtyAssigned, returnQtyToReceive, returnQtyRcdNotInvd, returnRcdNotInvd, returnQtyReceived, applFromItemEntry, itemChargeQtyToHandle, bOMItemNo, returnReceiptNo, returnReceiptLineNo, returnReasonCode, copiedFromPostedDoc, priceCalculationMethod, allowLineDisc, customerDiscGroup, subtype, priceDescription, attachedDocCount, attachedLinesCount, sellToCustomerName, createdAt, lastModifiedDateTime
```

### `postedSalesInvoices`

**Source Table:** Sales Invoice Header | **Fields:** 139 | **Nested:** postedSalesInvoiceLines

```
id, sellToCustomerNo, noValue, billToCustomerNo, billToName, billToName2, billToAddress, billToAddress2, billToCity, billToContact, yourReference, shipToCode, shipToName, shipToName2, shipToAddress, shipToAddress2, shipToCity, shipToContact, orderDate, postingDate, shipmentDate, postingDescription, paymentTermsCode, dueDate, paymentDiscount, pmtDiscountDate, shipmentMethodCode, locationCode, shortcutDimension1Code, shortcutDimension2Code, customerPostingGroup, currencyCode, currencyFactor, customerPriceGroup, pricesIncludingVAT, invoiceDiscCode, customerDiscGroup, languageCode, formatRegion, salespersonCode, orderNo, commentValue, noPrinted, onHold, appliesToDocType, appliesToDocNo, balAccountNo, amountValue, amountIncludingVAT, vATRegistrationNo, registrationNumber, reasonCode, genBusPostingGroup, eU3PartyTrade, transactionType, transportMethod, vATCountryRegionCode, sellToCustomerName, sellToCustomerName2, sellToAddress, sellToAddress2, sellToCity, sellToContact, billToPostCode, billToCounty, billToCountryRegionCode, sellToPostCode, sellToCounty, sellToCountryRegionCode, shipToPostCode, shipToCounty, shipToCountryRegionCode, balAccountType, exitPoint, correctionValue, documentDate, externalDocumentNo, areaValue, transactionSpecification, paymentMethodCode, shippingAgentCode, packageTrackingNo, preAssignedNoSeries, noSeries, orderNoSeries, preAssignedNo, userID, sourceCode, taxAreaCode, taxLiable, vATBusPostingGroup, vATBaseDiscount, invoiceDiscountCalculation, invoiceDiscountValue, prepaymentNoSeries, prepaymentInvoice, prepaymentOrderNo, quoteNo, companyBankAccountCode, altVATRegistrationNo, altGenBusPostingGroup, altVATBusPostingGroup, sellToPhoneNo, sellToEMail, vATReportingDate, paymentReference, lastEmailSentTime, lastEmailSentMessageId, workDescription, shipToPhoneNo, dimensionSetID, paymentServiceSetID, documentExchangeIdentifier, documentExchangeStatus, docExchOriginalIdentifier, coupledToDataverse, directDebitMandateID, closedValue, remainingAmount, custLedgerEntryNo, invoiceDiscountAmount, cancelled, corrective, reversedValue, disputeStatus, promisedPayDate, campaignNo, sellToContactNo, billToContactNo, opportunityNo, responsibilityCenter, shippingAgentServiceCode, priceCalculationMethod, allowLineDisc, getShipmentUsed, draftInvoiceSystemId, disputeStatusId, createdAt, lastModifiedDateTime
```

### `postedSalesInvoiceLines`

**Source Table:** Sales Invoice Line | **Fields:** 100

```
id, sellToCustomerNo, documentNo, lineNo, typeValue, noValue, locationCode, postingGroup, shipmentDate, descriptionValue, description2, unitOfMeasure, quantityValue, unitPrice, vAT, lineDiscount, lineDiscountAmount, amountValue, amountIncludingVAT, allowInvoiceDisc, grossWeight, netWeight, unitsPerParcel, unitVolume, applToItemEntry, shortcutDimension1Code, shortcutDimension2Code, customerPriceGroup, jobNo, workTypeCode, shipmentNo, shipmentLineNo, orderNo, orderLineNo, billToCustomerNo, invDiscountAmount, dropShipment, genBusPostingGroup, genProdPostingGroup, vATCalculationType, transactionType, transportMethod, attachedToLineNo, exitPoint, areaValue, transactionSpecification, taxCategory, taxAreaCode, taxLiable, taxGroupCode, vATClauseCode, vATBusPostingGroup, vATProdPostingGroup, blanketOrderNo, blanketOrderLineNo, vATBaseAmount, unitCost, systemCreatedEntry, lineAmount, vATDifference, vATIdentifier, iCPartnerRefType, iCPartnerReference, prepaymentLine, iCPartnerCode, postingDate, iCItemReferenceNo, pmtDiscountAmount, lineDiscountCalculation, dimensionSetID, jobTaskNo, jobContractEntryNo, deferralCode, allocationAccountNo, variantCode, binCode, qtyPerUnitOfMeasure, unitOfMeasureCode, fAPostingDate, depreciationBookCode, deprUntilFAPostingDate, duplicateInDepreciationBook, useDuplicationList, responsibilityCenter, itemCategoryCode, nonstock, purchasingCode, itemReferenceNo, itemReferenceUnitOfMeasure, itemReferenceType, itemReferenceTypeNo, applFromItemEntry, returnReasonCode, priceCalculationMethod, allowLineDisc, customerDiscGroup, priceDescription, sellToCustomerName, createdAt, lastModifiedDateTime
```

### `postedSalesShipments`

**Source Table:** Sales Shipment Header | **Fields:** 109 | **Nested:** postedSalesShipmentLines

```
id, sellToCustomerNo, no, billToCustomerNo, billToName, billToName2, billToAddress, billToAddress2, billToCity, billToContact, yourReference, shipToCode, shipToName, shipToName2, shipToAddress, shipToAddress2, shipToCity, shipToContact, orderDate, postingDate, shipmentDate, postingDescription, paymentTermsCode, dueDate, paymentDiscount, pmtDiscountDate, shipmentMethodCode, locationCode, shortcutDimension1Code, shortcutDimension2Code, customerPostingGroup, currencyCode, currencyFactor, customerPriceGroup, pricesIncludingVAT, invoiceDiscCode, customerDiscGroup, languageCode, formatRegion, salespersonCode, orderNo, comment, noPrinted, onHold, appliesToDocType, appliesToDocNo, balAccountNo, vATRegistrationNo, reasonCode, genBusPostingGroup, eU3PartyTrade, transactionType, transportMethod, vATCountryRegionCode, sellToCustomerName, sellToCustomerName2, sellToAddress, sellToAddress2, sellToCity, sellToContact, billToPostCode, billToCounty, billToCountryRegionCode, sellToPostCode, sellToCounty, sellToCountryRegionCode, shipToPostCode, shipToCounty, shipToCountryRegionCode, balAccountType, exitPoint, correction, documentDate, externalDocumentNo, areaValue, transactionSpecification, paymentMethodCode, shippingAgentCode, packageTrackingNo, noSeries, orderNoSeries, userID, sourceCode, taxAreaCode, taxLiable, vATBusPostingGroup, vATBaseDiscount, quoteNo, companyBankAccountCode, sellToPhoneNo, sellToEMail, shipToPhoneNo, dimensionSetID, campaignNo, sellToContactNo, billToContactNo, opportunityNo, responsibilityCenter, requestedDeliveryDate, promisedDeliveryDate, shippingTime, outboundWhseHandlingTime, shippingAgentServiceCode, priceCalculationMethod, allowLineDisc, customerId, billToCustomerId, createdAt, lastModifiedDateTime
```

### `postedSalesShipmentLines`

**Source Table:** Sales Shipment Line | **Fields:** 99

```
id, sellToCustomerNo, documentNo, lineNo, typeValue, no, locationCode, postingGroup, shipmentDate, description, description2, unitOfMeasure, quantity, unitPrice, unitCostLCY, vAT, lineDiscount, allowInvoiceDisc, grossWeight, netWeight, unitsPerParcel, unitVolume, applToItemEntry, itemShptEntryNo, shortcutDimension1Code, shortcutDimension2Code, customerPriceGroup, jobNo, workTypeCode, qtyShippedNotInvoiced, quantityInvoiced, orderNo, orderLineNo, billToCustomerNo, purchaseOrderNo, purchOrderLineNo, dropShipment, genBusPostingGroup, genProdPostingGroup, vATCalculationType, transactionType, transportMethod, attachedToLineNo, exitPoint, areaValue, transactionSpecification, taxAreaCode, taxLiable, taxGroupCode, vATBusPostingGroup, vATProdPostingGroup, currencyCode, blanketOrderNo, blanketOrderLineNo, vATBaseAmount, unitCost, iCPartnerRefType, iCPartnerReference, postingDate, iCItemReferenceNo, dimensionSetID, authorizedForCreditCard, jobTaskNo, jobContractEntryNo, variantCode, binCode, qtyPerUnitOfMeasure, unitOfMeasureCode, quantityBase, qtyInvoicedBase, fAPostingDate, depreciationBookCode, deprUntilFAPostingDate, duplicateInDepreciationBook, useDuplicationList, responsibilityCenter, itemCategoryCode, nonstock, purchasingCode, itemReferenceNo, itemReferenceUnitOfMeasure, itemReferenceType, itemReferenceTypeNo, requestedDeliveryDate, promisedDeliveryDate, shippingTime, outboundWhseHandlingTime, plannedDeliveryDate, plannedShipmentDate, applFromItemEntry, itemChargeBaseAmount, correction, returnReasonCode, priceCalculationMethod, allowLineDisc, customerDiscGroup, documentId, createdAt, lastModifiedDateTime
```

### `postedSalesCreditMemos`

**Source Table:** Sales Cr.Memo Header | **Fields:** 125 | **Nested:** postedSalesCreditMemoLines

```
id, sellToCustomerNo, no, billToCustomerNo, billToName, billToName2, billToAddress, billToAddress2, billToCity, billToContact, yourReference, shipToCode, shipToName, shipToName2, shipToAddress, shipToAddress2, shipToCity, shipToContact, postingDate, shipmentDate, postingDescription, paymentTermsCode, dueDate, paymentDiscount, pmtDiscountDate, shipmentMethodCode, locationCode, shortcutDimension1Code, shortcutDimension2Code, customerPostingGroup, currencyCode, currencyFactor, customerPriceGroup, pricesIncludingVAT, invoiceDiscCode, customerDiscGroup, languageCode, formatRegion, salespersonCode, comment, noPrinted, onHold, appliesToDocType, appliesToDocNo, balAccountNo, amount, amountIncludingVAT, vATRegistrationNo, registrationNumber, reasonCode, genBusPostingGroup, eU3PartyTrade, transactionType, transportMethod, vATCountryRegionCode, sellToCustomerName, sellToCustomerName2, sellToAddress, sellToAddress2, sellToCity, sellToContact, billToPostCode, billToCounty, billToCountryRegionCode, sellToPostCode, sellToCounty, sellToCountryRegionCode, shipToPostCode, shipToCounty, shipToCountryRegionCode, balAccountType, exitPoint, correction, documentDate, externalDocumentNo, areaValue, transactionSpecification, paymentMethodCode, shippingAgentCode, packageTrackingNo, preAssignedNoSeries, noSeries, preAssignedNo, userID, sourceCode, taxAreaCode, taxLiable, vATBusPostingGroup, vATBaseDiscount, prepmtCrMemoNoSeries, prepaymentCreditMemo, prepaymentOrderNo, companyBankAccountCode, altVATRegistrationNo, altGenBusPostingGroup, altVATBusPostingGroup, sellToPhoneNo, sellToEMail, vATReportingDate, rcvdFromCountRegionCode, shipToPhoneNo, dimensionSetID, documentExchangeIdentifier, documentExchangeStatus, docExchOriginalIdentifier, paid, remainingAmount, custLedgerEntryNo, invoiceDiscountAmount, cancelled, corrective, campaignNo, sellToContactNo, billToContactNo, opportunityNo, responsibilityCenter, shippingAgentServiceCode, returnOrderNo, returnOrderNoSeries, priceCalculationMethod, allowLineDisc, getReturnReceiptUsed, draftCrMemoSystemId, createdAt, lastModifiedDateTime
```

### `postedSalesCreditMemoLines`

**Source Table:** Sales Cr.Memo Line | **Fields:** 99

```
id, sellToCustomerNo, documentNo, lineNo, typeValue, no, locationCode, postingGroup, shipmentDate, description, description2, unitOfMeasure, quantity, unitPrice, unitCostLCY, vAT, lineDiscount, lineDiscountAmount, amount, amountIncludingVAT, allowInvoiceDisc, grossWeight, netWeight, unitsPerParcel, unitVolume, applToItemEntry, shortcutDimension1Code, shortcutDimension2Code, customerPriceGroup, jobNo, workTypeCode, orderNo, orderLineNo, billToCustomerNo, invDiscountAmount, genBusPostingGroup, genProdPostingGroup, vATCalculationType, transactionType, transportMethod, attachedToLineNo, exitPoint, areaValue, transactionSpecification, taxCategory, taxAreaCode, taxLiable, taxGroupCode, vATClauseCode, vATBusPostingGroup, vATProdPostingGroup, blanketOrderNo, blanketOrderLineNo, vATBaseAmount, unitCost, systemCreatedEntry, lineAmount, vATDifference, vATIdentifier, iCPartnerRefType, iCPartnerReference, prepaymentLine, iCPartnerCode, postingDate, iCItemReferenceNo, pmtDiscountAmount, lineDiscountCalculation, dimensionSetID, jobTaskNo, jobContractEntryNo, deferralCode, variantCode, binCode, qtyPerUnitOfMeasure, unitOfMeasureCode, quantityBase, fAPostingDate, depreciationBookCode, deprUntilFAPostingDate, duplicateInDepreciationBook, useDuplicationList, responsibilityCenter, itemCategoryCode, nonstock, purchasingCode, itemReferenceNo, itemReferenceUnitOfMeasure, itemReferenceType, itemReferenceTypeNo, applFromItemEntry, returnReceiptNo, returnReceiptLineNo, returnReasonCode, priceCalculationMethod, allowLineDisc, customerDiscGroup, sellToCustomerName, createdAt, lastModifiedDateTime
```

### `purchaseOrders`

**Source Table:** Purchase Header (Order) | **Fields:** 159 | **Nested:** purchaseOrderLines

```
id, documentType, buyFromVendorNo, noValue, payToVendorNo, payToName, payToName2, payToAddress, payToAddress2, payToCity, payToContact, yourReference, shipToCode, shipToName, shipToName2, shipToAddress, shipToAddress2, shipToCity, shipToContact, orderDate, postingDate, expectedReceiptDate, postingDescription, paymentTermsCode, dueDate, paymentDiscount, pmtDiscountDate, shipmentMethodCode, locationCode, shortcutDimension1Code, shortcutDimension2Code, vendorPostingGroup, currencyCode, currencyFactor, pricesIncludingVAT, invoiceDiscCode, languageCode, formatRegion, purchaserCode, orderClass, commentValue, noPrinted, onHold, appliesToDocType, appliesToDocNo, balAccountNo, recalculateInvoiceDisc, receive, invoice, printPostedDocuments, amountValue, amountIncludingVAT, receivingNo, postingNo, lastReceivingNo, lastPostingNo, vendorOrderNo, vendorShipmentNo, vendorInvoiceNo, vendorCrMemoNo, vATRegistrationNo, sellToCustomerNo, reasonCode, genBusPostingGroup, transactionType, transportMethod, vATCountryRegionCode, buyFromVendorName, buyFromVendorName2, buyFromAddress, buyFromAddress2, buyFromCity, buyFromContact, payToPostCode, payToCounty, payToCountryRegionCode, buyFromPostCode, buyFromCounty, buyFromCountryRegionCode, shipToPostCode, shipToCounty, shipToCountryRegionCode, balAccountType, orderAddressCode, entryPoint, correctionValue, documentDate, areaValue, transactionSpecification, paymentMethodCode, noSeries, postingNoSeries, receivingNoSeries, taxAreaCode, taxLiable, vATBusPostingGroup, appliesToID, vATBaseDiscount, status, invoiceDiscountCalculation, invoiceDiscountValue, sendICDocument, iCStatus, buyFromICPartnerCode, payToICPartnerCode, iCReferenceDocumentNo, iCDirection, prepaymentNo, lastPrepaymentNo, prepmtCrMemoNo, lastPrepmtCrMemoNo, prepayment, prepaymentNoSeries, compressPrepayment, prepaymentDueDate, prepmtCrMemoNoSeries, prepmtPostingDescription, prepmtPmtDiscountDate, prepmtPaymentTermsCode, prepmtPaymentDiscount, quoteNo, jobQueueStatus, jobQueueEntryID, incomingDocumentEntryNo, creditorNo, paymentReference, invoiceReceivedDate, journalTemplName, vATReportingDate, shipToPhoneNo, dimensionSetID, remitToCode, invoiceDiscountAmount, noOfArchivedVersions, docNoOccurrence, campaignNo, buyFromContactNo, payToContactNo, responsibilityCenter, partiallyInvoiced, completelyReceived, postingFromWhseRef, receivedNotInvoiced, requestedReceiptDate, promisedReceiptDate, leadTimeCalculation, inboundWhseHandlingTime, vendorAuthorizationNo, returnShipmentNo, returnShipmentNoSeries, ship, lastReturnShipmentNo, priceCalculationMethod, assignedUserID, pendingApprovals, docAmountInclVAT, docAmountVAT, createdAt, lastModifiedDateTime
```

### `purchaseOrderLines`

**Source Table:** Purchase Line (Order) | **Fields:** 184

```
id, documentType, buyFromVendorNo, documentNo, lineNo, typeValue, noValue, locationCode, postingGroup, expectedReceiptDate, descriptionValue, description2, unitOfMeasure, quantityValue, outstandingQuantity, qtyToInvoice, qtyToReceive, directUnitCost, vAT, lineDiscount, lineDiscountAmount, amountValue, amountIncludingVAT, allowInvoiceDisc, grossWeight, netWeight, unitsPerParcel, unitVolume, applToItemEntry, shortcutDimension1Code, shortcutDimension2Code, jobNo, indirectCost, recalculateInvoiceDisc, outstandingAmount, qtyRcdNotInvoiced, amtRcdNotInvoiced, quantityReceived, quantityInvoiced, receiptNo, receiptLineNo, orderNo, orderLineNo, profit, payToVendorNo, invDiscountAmount, vendorItemNo, salesOrderNo, salesOrderLineNo, dropShipment, genBusPostingGroup, genProdPostingGroup, vATCalculationType, transactionType, transportMethod, attachedToLineNo, entryPoint, areaValue, transactionSpecification, taxAreaCode, taxLiable, taxGroupCode, useTax, vATBusPostingGroup, vATProdPostingGroup, currencyCode, reservedQuantity, blanketOrderNo, blanketOrderLineNo, vATBaseAmount, unitCost, systemCreatedEntry, lineAmount, vATDifference, invDiscAmountToInvoice, vATIdentifier, iCPartnerRefType, iCPartnerReference, prepayment, prepmtLineAmount, prepmtAmtInv, prepmtAmtInclVAT, prepaymentAmount, prepmtVATBaseAmt, prepaymentVAT, prepmtVATCalcType, prepaymentVATIdentifier, prepaymentTaxAreaCode, prepaymentTaxLiable, prepaymentTaxGroupCode, prepmtAmtToDeduct, prepmtAmtDeducted, prepaymentLine, prepmtAmountInvInclVAT, iCPartnerCode, prepaymentVATDifference, prepmtVATDiffToDeduct, prepmtVATDiffDeducted, iCItemReferenceNo, pmtDiscountAmount, prepmtPmtDiscountAmount, dimensionSetID, jobTaskNo, jobLineType, jobUnitPrice, jobTotalPrice, jobLineAmount, jobLineDiscountAmount, jobLineDiscount, jobCurrencyFactor, jobCurrencyCode, jobPlanningLineNo, jobRemainingQty, deferralCode, returnsDeferralStartDate, selectedAllocAccountNo, allocAccModifiedByUser, allocationAccountNo, variantCode, binCode, qtyPerUnitOfMeasure, qtyRoundingPrecision, unitOfMeasureCode, fAPostingDate, fAPostingType, depreciationBookCode, salvageValue, deprUntilFAPostingDate, deprAcquisitionCost, maintenanceCode, insuranceNo, budgetedFANo, duplicateInDepreciationBook, useDuplicationList, responsibilityCenter, itemCategoryCode, nonstock, purchasingCode, specialOrder, specialOrderSalesNo, specialOrderSalesLineNo, itemReferenceNo, itemReferenceUnitOfMeasure, itemReferenceType, itemReferenceTypeNo, completelyReceived, requestedReceiptDate, promisedReceiptDate, leadTimeCalculation, inboundWhseHandlingTime, plannedReceiptDate, orderDate, allowItemChargeAssignment, qtyToAssign, qtyAssigned, returnQtyToShip, returnQtyShippedNotInvd, returnShpdNotInvd, returnQtyShipped, itemChargeQtyToHandle, nonDeductibleVAT, nonDeductibleVATBase, nonDeductibleVATAmount, nonDeductibleVATDiff, prepmtNonDeductVATBase, prepmtNonDeductVATAmount, returnShipmentNo, returnShipmentLineNo, returnReasonCode, subtype, copiedFromPostedDoc, priceCalculationMethod, attachedDocCount, attachedLinesCount, overReceiptQuantity, overReceiptCode, overReceiptApprovalStatus, buyFromVendorName, overheadRate, mPSOrder, planningFlexibility, safetyLeadTime, createdAt, lastModifiedDateTime
```

### `purchaseInvoices`

**Source Table:** Purchase Header (Invoice) | **Fields:** 159 | **Nested:** purchaseInvoiceLines

```
id, documentType, buyFromVendorNo, noValue, payToVendorNo, payToName, payToName2, payToAddress, payToAddress2, payToCity, payToContact, yourReference, shipToCode, shipToName, shipToName2, shipToAddress, shipToAddress2, shipToCity, shipToContact, orderDate, postingDate, expectedReceiptDate, postingDescription, paymentTermsCode, dueDate, paymentDiscount, pmtDiscountDate, shipmentMethodCode, locationCode, shortcutDimension1Code, shortcutDimension2Code, vendorPostingGroup, currencyCode, currencyFactor, pricesIncludingVAT, invoiceDiscCode, languageCode, formatRegion, purchaserCode, orderClass, commentValue, noPrinted, onHold, appliesToDocType, appliesToDocNo, balAccountNo, recalculateInvoiceDisc, receive, invoice, printPostedDocuments, amountValue, amountIncludingVAT, receivingNo, postingNo, lastReceivingNo, lastPostingNo, vendorOrderNo, vendorShipmentNo, vendorInvoiceNo, vendorCrMemoNo, vATRegistrationNo, sellToCustomerNo, reasonCode, genBusPostingGroup, transactionType, transportMethod, vATCountryRegionCode, buyFromVendorName, buyFromVendorName2, buyFromAddress, buyFromAddress2, buyFromCity, buyFromContact, payToPostCode, payToCounty, payToCountryRegionCode, buyFromPostCode, buyFromCounty, buyFromCountryRegionCode, shipToPostCode, shipToCounty, shipToCountryRegionCode, balAccountType, orderAddressCode, entryPoint, correctionValue, documentDate, areaValue, transactionSpecification, paymentMethodCode, noSeries, postingNoSeries, receivingNoSeries, taxAreaCode, taxLiable, vATBusPostingGroup, appliesToID, vATBaseDiscount, status, invoiceDiscountCalculation, invoiceDiscountValue, sendICDocument, iCStatus, buyFromICPartnerCode, payToICPartnerCode, iCReferenceDocumentNo, iCDirection, prepaymentNo, lastPrepaymentNo, prepmtCrMemoNo, lastPrepmtCrMemoNo, prepayment, prepaymentNoSeries, compressPrepayment, prepaymentDueDate, prepmtCrMemoNoSeries, prepmtPostingDescription, prepmtPmtDiscountDate, prepmtPaymentTermsCode, prepmtPaymentDiscount, quoteNo, jobQueueStatus, jobQueueEntryID, incomingDocumentEntryNo, creditorNo, paymentReference, invoiceReceivedDate, journalTemplName, vATReportingDate, shipToPhoneNo, dimensionSetID, remitToCode, invoiceDiscountAmount, noOfArchivedVersions, docNoOccurrence, campaignNo, buyFromContactNo, payToContactNo, responsibilityCenter, partiallyInvoiced, completelyReceived, postingFromWhseRef, receivedNotInvoiced, requestedReceiptDate, promisedReceiptDate, leadTimeCalculation, inboundWhseHandlingTime, vendorAuthorizationNo, returnShipmentNo, returnShipmentNoSeries, ship, lastReturnShipmentNo, priceCalculationMethod, assignedUserID, pendingApprovals, docAmountInclVAT, docAmountVAT, createdAt, lastModifiedDateTime
```

### `purchaseInvoiceLines`

**Source Table:** Purchase Line (Invoice) | **Fields:** 184

```
id, documentType, buyFromVendorNo, documentNo, lineNo, typeValue, noValue, locationCode, postingGroup, expectedReceiptDate, descriptionValue, description2, unitOfMeasure, quantityValue, outstandingQuantity, qtyToInvoice, qtyToReceive, directUnitCost, vAT, lineDiscount, lineDiscountAmount, amountValue, amountIncludingVAT, allowInvoiceDisc, grossWeight, netWeight, unitsPerParcel, unitVolume, applToItemEntry, shortcutDimension1Code, shortcutDimension2Code, jobNo, indirectCost, recalculateInvoiceDisc, outstandingAmount, qtyRcdNotInvoiced, amtRcdNotInvoiced, quantityReceived, quantityInvoiced, receiptNo, receiptLineNo, orderNo, orderLineNo, profit, payToVendorNo, invDiscountAmount, vendorItemNo, salesOrderNo, salesOrderLineNo, dropShipment, genBusPostingGroup, genProdPostingGroup, vATCalculationType, transactionType, transportMethod, attachedToLineNo, entryPoint, areaValue, transactionSpecification, taxAreaCode, taxLiable, taxGroupCode, useTax, vATBusPostingGroup, vATProdPostingGroup, currencyCode, reservedQuantity, blanketOrderNo, blanketOrderLineNo, vATBaseAmount, unitCost, systemCreatedEntry, lineAmount, vATDifference, invDiscAmountToInvoice, vATIdentifier, iCPartnerRefType, iCPartnerReference, prepayment, prepmtLineAmount, prepmtAmtInv, prepmtAmtInclVAT, prepaymentAmount, prepmtVATBaseAmt, prepaymentVAT, prepmtVATCalcType, prepaymentVATIdentifier, prepaymentTaxAreaCode, prepaymentTaxLiable, prepaymentTaxGroupCode, prepmtAmtToDeduct, prepmtAmtDeducted, prepaymentLine, prepmtAmountInvInclVAT, iCPartnerCode, prepaymentVATDifference, prepmtVATDiffToDeduct, prepmtVATDiffDeducted, iCItemReferenceNo, pmtDiscountAmount, prepmtPmtDiscountAmount, dimensionSetID, jobTaskNo, jobLineType, jobUnitPrice, jobTotalPrice, jobLineAmount, jobLineDiscountAmount, jobLineDiscount, jobCurrencyFactor, jobCurrencyCode, jobPlanningLineNo, jobRemainingQty, deferralCode, returnsDeferralStartDate, selectedAllocAccountNo, allocAccModifiedByUser, allocationAccountNo, variantCode, binCode, qtyPerUnitOfMeasure, qtyRoundingPrecision, unitOfMeasureCode, fAPostingDate, fAPostingType, depreciationBookCode, salvageValue, deprUntilFAPostingDate, deprAcquisitionCost, maintenanceCode, insuranceNo, budgetedFANo, duplicateInDepreciationBook, useDuplicationList, responsibilityCenter, itemCategoryCode, nonstock, purchasingCode, specialOrder, specialOrderSalesNo, specialOrderSalesLineNo, itemReferenceNo, itemReferenceUnitOfMeasure, itemReferenceType, itemReferenceTypeNo, completelyReceived, requestedReceiptDate, promisedReceiptDate, leadTimeCalculation, inboundWhseHandlingTime, plannedReceiptDate, orderDate, allowItemChargeAssignment, qtyToAssign, qtyAssigned, returnQtyToShip, returnQtyShippedNotInvd, returnShpdNotInvd, returnQtyShipped, itemChargeQtyToHandle, nonDeductibleVAT, nonDeductibleVATBase, nonDeductibleVATAmount, nonDeductibleVATDiff, prepmtNonDeductVATBase, prepmtNonDeductVATAmount, returnShipmentNo, returnShipmentLineNo, returnReasonCode, subtype, copiedFromPostedDoc, priceCalculationMethod, attachedDocCount, attachedLinesCount, overReceiptQuantity, overReceiptCode, overReceiptApprovalStatus, buyFromVendorName, overheadRate, mPSOrder, planningFlexibility, safetyLeadTime, createdAt, lastModifiedDateTime
```

### `purchaseCreditMemos`

**Source Table:** Purchase Header (Credit Memo) | **Fields:** 159 | **Nested:** purchaseCreditMemoLines

```
id, documentType, buyFromVendorNo, noValue, payToVendorNo, payToName, payToName2, payToAddress, payToAddress2, payToCity, payToContact, yourReference, shipToCode, shipToName, shipToName2, shipToAddress, shipToAddress2, shipToCity, shipToContact, orderDate, postingDate, expectedReceiptDate, postingDescription, paymentTermsCode, dueDate, paymentDiscount, pmtDiscountDate, shipmentMethodCode, locationCode, shortcutDimension1Code, shortcutDimension2Code, vendorPostingGroup, currencyCode, currencyFactor, pricesIncludingVAT, invoiceDiscCode, languageCode, formatRegion, purchaserCode, orderClass, commentValue, noPrinted, onHold, appliesToDocType, appliesToDocNo, balAccountNo, recalculateInvoiceDisc, receive, invoice, printPostedDocuments, amountValue, amountIncludingVAT, receivingNo, postingNo, lastReceivingNo, lastPostingNo, vendorOrderNo, vendorShipmentNo, vendorInvoiceNo, vendorCrMemoNo, vATRegistrationNo, sellToCustomerNo, reasonCode, genBusPostingGroup, transactionType, transportMethod, vATCountryRegionCode, buyFromVendorName, buyFromVendorName2, buyFromAddress, buyFromAddress2, buyFromCity, buyFromContact, payToPostCode, payToCounty, payToCountryRegionCode, buyFromPostCode, buyFromCounty, buyFromCountryRegionCode, shipToPostCode, shipToCounty, shipToCountryRegionCode, balAccountType, orderAddressCode, entryPoint, correctionValue, documentDate, areaValue, transactionSpecification, paymentMethodCode, noSeries, postingNoSeries, receivingNoSeries, taxAreaCode, taxLiable, vATBusPostingGroup, appliesToID, vATBaseDiscount, status, invoiceDiscountCalculation, invoiceDiscountValue, sendICDocument, iCStatus, buyFromICPartnerCode, payToICPartnerCode, iCReferenceDocumentNo, iCDirection, prepaymentNo, lastPrepaymentNo, prepmtCrMemoNo, lastPrepmtCrMemoNo, prepayment, prepaymentNoSeries, compressPrepayment, prepaymentDueDate, prepmtCrMemoNoSeries, prepmtPostingDescription, prepmtPmtDiscountDate, prepmtPaymentTermsCode, prepmtPaymentDiscount, quoteNo, jobQueueStatus, jobQueueEntryID, incomingDocumentEntryNo, creditorNo, paymentReference, invoiceReceivedDate, journalTemplName, vATReportingDate, shipToPhoneNo, dimensionSetID, remitToCode, invoiceDiscountAmount, noOfArchivedVersions, docNoOccurrence, campaignNo, buyFromContactNo, payToContactNo, responsibilityCenter, partiallyInvoiced, completelyReceived, postingFromWhseRef, receivedNotInvoiced, requestedReceiptDate, promisedReceiptDate, leadTimeCalculation, inboundWhseHandlingTime, vendorAuthorizationNo, returnShipmentNo, returnShipmentNoSeries, ship, lastReturnShipmentNo, priceCalculationMethod, assignedUserID, pendingApprovals, docAmountInclVAT, docAmountVAT, createdAt, lastModifiedDateTime
```

### `purchaseCreditMemoLines`

**Source Table:** Purchase Line (Credit Memo) | **Fields:** 184

```
id, documentType, buyFromVendorNo, documentNo, lineNo, typeValue, noValue, locationCode, postingGroup, expectedReceiptDate, descriptionValue, description2, unitOfMeasure, quantityValue, outstandingQuantity, qtyToInvoice, qtyToReceive, directUnitCost, vAT, lineDiscount, lineDiscountAmount, amountValue, amountIncludingVAT, allowInvoiceDisc, grossWeight, netWeight, unitsPerParcel, unitVolume, applToItemEntry, shortcutDimension1Code, shortcutDimension2Code, jobNo, indirectCost, recalculateInvoiceDisc, outstandingAmount, qtyRcdNotInvoiced, amtRcdNotInvoiced, quantityReceived, quantityInvoiced, receiptNo, receiptLineNo, orderNo, orderLineNo, profit, payToVendorNo, invDiscountAmount, vendorItemNo, salesOrderNo, salesOrderLineNo, dropShipment, genBusPostingGroup, genProdPostingGroup, vATCalculationType, transactionType, transportMethod, attachedToLineNo, entryPoint, areaValue, transactionSpecification, taxAreaCode, taxLiable, taxGroupCode, useTax, vATBusPostingGroup, vATProdPostingGroup, currencyCode, reservedQuantity, blanketOrderNo, blanketOrderLineNo, vATBaseAmount, unitCost, systemCreatedEntry, lineAmount, vATDifference, invDiscAmountToInvoice, vATIdentifier, iCPartnerRefType, iCPartnerReference, prepayment, prepmtLineAmount, prepmtAmtInv, prepmtAmtInclVAT, prepaymentAmount, prepmtVATBaseAmt, prepaymentVAT, prepmtVATCalcType, prepaymentVATIdentifier, prepaymentTaxAreaCode, prepaymentTaxLiable, prepaymentTaxGroupCode, prepmtAmtToDeduct, prepmtAmtDeducted, prepaymentLine, prepmtAmountInvInclVAT, iCPartnerCode, prepaymentVATDifference, prepmtVATDiffToDeduct, prepmtVATDiffDeducted, iCItemReferenceNo, pmtDiscountAmount, prepmtPmtDiscountAmount, dimensionSetID, jobTaskNo, jobLineType, jobUnitPrice, jobTotalPrice, jobLineAmount, jobLineDiscountAmount, jobLineDiscount, jobCurrencyFactor, jobCurrencyCode, jobPlanningLineNo, jobRemainingQty, deferralCode, returnsDeferralStartDate, selectedAllocAccountNo, allocAccModifiedByUser, allocationAccountNo, variantCode, binCode, qtyPerUnitOfMeasure, qtyRoundingPrecision, unitOfMeasureCode, fAPostingDate, fAPostingType, depreciationBookCode, salvageValue, deprUntilFAPostingDate, deprAcquisitionCost, maintenanceCode, insuranceNo, budgetedFANo, duplicateInDepreciationBook, useDuplicationList, responsibilityCenter, itemCategoryCode, nonstock, purchasingCode, specialOrder, specialOrderSalesNo, specialOrderSalesLineNo, itemReferenceNo, itemReferenceUnitOfMeasure, itemReferenceType, itemReferenceTypeNo, completelyReceived, requestedReceiptDate, promisedReceiptDate, leadTimeCalculation, inboundWhseHandlingTime, plannedReceiptDate, orderDate, allowItemChargeAssignment, qtyToAssign, qtyAssigned, returnQtyToShip, returnQtyShippedNotInvd, returnShpdNotInvd, returnQtyShipped, itemChargeQtyToHandle, nonDeductibleVAT, nonDeductibleVATBase, nonDeductibleVATAmount, nonDeductibleVATDiff, prepmtNonDeductVATBase, prepmtNonDeductVATAmount, returnShipmentNo, returnShipmentLineNo, returnReasonCode, subtype, copiedFromPostedDoc, priceCalculationMethod, attachedDocCount, attachedLinesCount, overReceiptQuantity, overReceiptCode, overReceiptApprovalStatus, buyFromVendorName, overheadRate, mPSOrder, planningFlexibility, safetyLeadTime, createdAt, lastModifiedDateTime
```

### `postedPurchInvoices`

**Source Table:** Purch. Inv. Header | **Fields:** 113 | **Nested:** postedPurchInvoiceLines

```
id, buyFromVendorNo, noValue, payToVendorNo, payToName, payToName2, payToAddress, payToAddress2, payToCity, payToContact, yourReference, shipToCode, shipToName, shipToName2, shipToAddress, shipToAddress2, shipToCity, shipToContact, orderDate, postingDate, expectedReceiptDate, postingDescription, paymentTermsCode, dueDate, paymentDiscount, pmtDiscountDate, shipmentMethodCode, locationCode, shortcutDimension1Code, shortcutDimension2Code, vendorPostingGroup, currencyCode, currencyFactor, pricesIncludingVAT, invoiceDiscCode, languageCode, formatRegion, purchaserCode, orderNo, commentValue, noPrinted, onHold, appliesToDocType, appliesToDocNo, balAccountNo, amountValue, amountIncludingVAT, vendorOrderNo, vendorInvoiceNo, vATRegistrationNo, sellToCustomerNo, reasonCode, genBusPostingGroup, transactionType, transportMethod, vATCountryRegionCode, buyFromVendorName, buyFromVendorName2, buyFromAddress, buyFromAddress2, buyFromCity, buyFromContact, payToPostCode, payToCounty, payToCountryRegionCode, buyFromPostCode, buyFromCounty, buyFromCountryRegionCode, shipToPostCode, shipToCounty, shipToCountryRegionCode, balAccountType, orderAddressCode, entryPoint, correctionValue, documentDate, areaValue, transactionSpecification, paymentMethodCode, preAssignedNoSeries, noSeries, orderNoSeries, preAssignedNo, userID, sourceCode, taxAreaCode, taxLiable, vATBusPostingGroup, vATBaseDiscount, prepaymentNoSeries, prepaymentInvoice, prepaymentOrderNo, quoteNo, creditorNo, paymentReference, vATReportingDate, shipToPhoneNo, dimensionSetID, remitToCode, closedValue, remainingAmount, vendorLedgerEntryNo, invoiceDiscountAmount, cancelled, corrective, campaignNo, buyFromContactNo, payToContactNo, responsibilityCenter, priceCalculationMethod, draftInvoiceSystemId, createdAt, lastModifiedDateTime
```

### `postedPurchInvoiceLines`

**Source Table:** Purch. Inv. Line | **Fields:** 112

```
id, buyFromVendorNo, documentNo, lineNo, typeValue, noValue, locationCode, postingGroup, expectedReceiptDate, descriptionValue, description2, unitOfMeasure, quantityValue, directUnitCost, vAT, lineDiscount, lineDiscountAmount, amountValue, amountIncludingVAT, allowInvoiceDisc, grossWeight, netWeight, unitsPerParcel, unitVolume, applToItemEntry, shortcutDimension1Code, shortcutDimension2Code, jobNo, indirectCost, receiptNo, receiptLineNo, orderNo, orderLineNo, payToVendorNo, invDiscountAmount, vendorItemNo, genBusPostingGroup, genProdPostingGroup, vATCalculationType, transactionType, transportMethod, attachedToLineNo, entryPoint, areaValue, transactionSpecification, taxAreaCode, taxLiable, taxGroupCode, useTax, vATBusPostingGroup, vATProdPostingGroup, blanketOrderNo, blanketOrderLineNo, vATBaseAmount, unitCost, systemCreatedEntry, lineAmount, vATDifference, vATIdentifier, iCPartnerRefType, iCPartnerReference, prepaymentLine, iCPartnerCode, postingDate, iCCrossReferenceNo, pmtDiscountAmount, dimensionSetID, jobTaskNo, jobLineType, jobUnitPrice, jobTotalPrice, jobLineAmount, jobLineDiscountAmount, jobLineDiscount, jobCurrencyFactor, jobCurrencyCode, jobPlanningLineNo, deferralCode, allocationAccountNo, variantCode, binCode, qtyPerUnitOfMeasure, unitOfMeasureCode, fAPostingDate, fAPostingType, depreciationBookCode, salvageValue, deprUntilFAPostingDate, deprAcquisitionCost, maintenanceCode, insuranceNo, budgetedFANo, duplicateInDepreciationBook, useDuplicationList, responsibilityCenter, itemCategoryCode, nonstock, purchasingCode, itemReferenceNo, itemReferenceUnitOfMeasure, itemReferenceType, itemReferenceTypeNo, nonDeductibleVAT, nonDeductibleVATBase, nonDeductibleVATAmount, nonDeductibleVATDiff, returnReasonCode, priceCalculationMethod, buyFromVendorName, overheadRate, createdAt, lastModifiedDateTime
```

### `postedPurchaseReceipts`

**Source Table:** Purch. Rcpt. Header | **Fields:** 98 | **Nested:** postedPurchaseReceiptLines

```
id, buyFromVendorNo, no, payToVendorNo, payToName, payToName2, payToAddress, payToAddress2, payToCity, payToContact, yourReference, shipToCode, shipToName, shipToName2, shipToAddress, shipToAddress2, shipToCity, shipToContact, orderDate, postingDate, expectedReceiptDate, postingDescription, paymentTermsCode, dueDate, paymentDiscount, pmtDiscountDate, shipmentMethodCode, locationCode, shortcutDimension1Code, shortcutDimension2Code, vendorPostingGroup, currencyCode, currencyFactor, invoiceDiscCode, languageCode, formatRegion, purchaserCode, orderNo, comment, noPrinted, onHold, appliesToDocType, appliesToDocNo, balAccountNo, vendorOrderNo, vendorShipmentNo, vATRegistrationNo, sellToCustomerNo, reasonCode, genBusPostingGroup, transactionType, transportMethod, vATCountryRegionCode, buyFromVendorName, buyFromVendorName2, buyFromAddress, buyFromAddress2, buyFromCity, buyFromContact, payToPostCode, payToCounty, payToCountryRegionCode, buyFromPostCode, buyFromCounty, buyFromCountryRegionCode, shipToPostCode, shipToCounty, shipToCountryRegionCode, balAccountType, orderAddressCode, entryPoint, correction, documentDate, areaValue, transactionSpecification, paymentMethodCode, noSeries, orderNoSeries, userID, sourceCode, taxAreaCode, taxLiable, vATBusPostingGroup, vATBaseDiscount, quoteNo, shipToPhoneNo, dimensionSetID, campaignNo, buyFromContactNo, payToContactNo, responsibilityCenter, requestedReceiptDate, promisedReceiptDate, leadTimeCalculation, inboundWhseHandlingTime, priceCalculationMethod, createdAt, lastModifiedDateTime
```

### `postedPurchaseReceiptLines`

**Source Table:** Purch. Rcpt. Line | **Fields:** 119

```
id, buyFromVendorNo, documentNo, lineNo, typeValue, no, locationCode, postingGroup, expectedReceiptDate, description, description2, unitOfMeasure, quantity, directUnitCost, unitCostLCY, vAT, lineDiscount, unitPriceLCY, allowInvoiceDisc, grossWeight, netWeight, unitsPerParcel, unitVolume, applToItemEntry, itemRcptEntryNo, shortcutDimension1Code, shortcutDimension2Code, jobNo, indirectCost, qtyRcdNotInvoiced, quantityInvoiced, orderNo, orderLineNo, payToVendorNo, vendorItemNo, salesOrderNo, salesOrderLineNo, genBusPostingGroup, genProdPostingGroup, vATCalculationType, transactionType, transportMethod, attachedToLineNo, entryPoint, areaValue, transactionSpecification, taxAreaCode, taxLiable, taxGroupCode, useTax, vATBusPostingGroup, vATProdPostingGroup, currencyCode, blanketOrderNo, blanketOrderLineNo, vATBaseAmount, unitCost, iCPartnerRefType, iCPartnerReference, postingDate, iCItemReferenceNo, dimensionSetID, jobTaskNo, jobLineType, jobUnitPrice, jobTotalPrice, jobLineAmount, jobLineDiscountAmount, jobLineDiscount, jobUnitPriceLCY, jobTotalPriceLCY, jobLineAmountLCY, jobLineDiscAmountLCY, jobCurrencyFactor, jobCurrencyCode, jobPlanningLineNo, variantCode, binCode, qtyPerUnitOfMeasure, unitOfMeasureCode, quantityBase, qtyInvoicedBase, fAPostingDate, fAPostingType, depreciationBookCode, salvageValue, deprUntilFAPostingDate, deprAcquisitionCost, maintenanceCode, insuranceNo, budgetedFANo, duplicateInDepreciationBook, useDuplicationList, responsibilityCenter, itemReferenceNo, itemReferenceUnitOfMeasure, itemReferenceType, itemReferenceTypeNo, itemCategoryCode, nonstock, purchasingCode, specialOrderSalesNo, specialOrderSalesLineNo, requestedReceiptDate, promisedReceiptDate, leadTimeCalculation, inboundWhseHandlingTime, plannedReceiptDate, orderDate, itemChargeBaseAmount, correction, returnReasonCode, priceCalculationMethod, documentId, overReceiptQuantity, overReceiptCode2, overheadRate, createdAt, lastModifiedDateTime
```

### `postedPurchaseCreditMemos`

**Source Table:** Purch. Cr. Memo Hdr. | **Fields:** 107 | **Nested:** postedPurchaseCreditMemoLines

```
id, buyFromVendorNo, no, payToVendorNo, payToName, payToName2, payToAddress, payToAddress2, payToCity, payToContact, yourReference, shipToCode, shipToName, shipToName2, shipToAddress, shipToAddress2, shipToCity, shipToContact, postingDate, expectedReceiptDate, postingDescription, paymentTermsCode, dueDate, paymentDiscount, pmtDiscountDate, shipmentMethodCode, locationCode, shortcutDimension1Code, shortcutDimension2Code, vendorPostingGroup, currencyCode, currencyFactor, pricesIncludingVAT, invoiceDiscCode, languageCode, formatRegion, purchaserCode, comment, noPrinted, onHold, appliesToDocType, appliesToDocNo, balAccountNo, amount, amountIncludingVAT, vendorCrMemoNo, vATRegistrationNo, sellToCustomerNo, reasonCode, genBusPostingGroup, transactionType, transportMethod, vATCountryRegionCode, buyFromVendorName, buyFromVendorName2, buyFromAddress, buyFromAddress2, buyFromCity, buyFromContact, payToPostCode, payToCounty, payToCountryRegionCode, buyFromPostCode, buyFromCounty, buyFromCountryRegionCode, shipToPostCode, shipToCounty, shipToCountryRegionCode, balAccountType, orderAddressCode, entryPoint, correction, documentDate, areaValue, transactionSpecification, paymentMethodCode, preAssignedNoSeries, noSeries, preAssignedNo, userID, sourceCode, taxAreaCode, taxLiable, vATBusPostingGroup, vATBaseDiscount, prepmtCrMemoNoSeries, prepaymentCreditMemo, prepaymentOrderNo, vATReportingDate, shipToPhoneNo, dimensionSetID, paid, remainingAmount, vendorLedgerEntryNo, invoiceDiscountAmount, cancelled, corrective, campaignNo, buyFromContactNo, payToContactNo, responsibilityCenter, returnOrderNo, returnOrderNoSeries, priceCalculationMethod, draftCrMemoSystemId, createdAt, lastModifiedDateTime
```

### `postedPurchaseCreditMemoLines`

**Source Table:** Purch. Cr. Memo Line | **Fields:** 118

```
id, buyFromVendorNo, documentNo, lineNo, typeValue, no, locationCode, postingGroup, expectedReceiptDate, description, description2, unitOfMeasure, quantity, directUnitCost, unitCostLCY, vAT, lineDiscount, lineDiscountAmount, amount, amountIncludingVAT, unitPriceLCY, allowInvoiceDisc, grossWeight, netWeight, unitsPerParcel, unitVolume, applToItemEntry, shortcutDimension1Code, shortcutDimension2Code, jobNo, indirectCost, orderNo, orderLineNo, payToVendorNo, invDiscountAmount, vendorItemNo, genBusPostingGroup, genProdPostingGroup, vATCalculationType, transactionType, transportMethod, attachedToLineNo, entryPoint, areaValue, transactionSpecification, taxAreaCode, taxLiable, taxGroupCode, useTax, vATBusPostingGroup, vATProdPostingGroup, blanketOrderNo, blanketOrderLineNo, vATBaseAmount, unitCost, systemCreatedEntry, lineAmount, vATDifference, vATIdentifier, iCPartnerRefType, iCPartnerReference, prepaymentLine, iCPartnerCode, postingDate, iCItemReferenceNo, pmtDiscountAmount, dimensionSetID, jobTaskNo, jobLineType, jobUnitPrice, jobTotalPrice, jobLineAmount, jobLineDiscountAmount, jobLineDiscount, jobUnitPriceLCY, jobTotalPriceLCY, jobLineAmountLCY, jobLineDiscAmountLCY, jobCurrencyFactor, jobCurrencyCode, jobPlanningLineNo, deferralCode, prodOrderNo, variantCode, binCode, qtyPerUnitOfMeasure, unitOfMeasureCode, quantityBase, fAPostingDate, fAPostingType, depreciationBookCode, salvageValue, deprUntilFAPostingDate, deprAcquisitionCost, maintenanceCode, insuranceNo, budgetedFANo, duplicateInDepreciationBook, useDuplicationList, responsibilityCenter, itemCategoryCode, nonstock, purchasingCode, itemReferenceNo, itemReferenceUnitOfMeasure, itemReferenceType, itemReferenceTypeNo, nonDeductibleVAT, nonDeductibleVATBase, nonDeductibleVATAmount, nonDeductibleVATDiff, returnShipmentNo, returnShipmentLineNo, returnReasonCode, priceCalculationMethod, buyFromVendorName, createdAt, lastModifiedDateTime
```

### `productionOrders`

**Source Table:** Production Order | **Fields:** 54 | **Nested:** productionOrderLines

```
id, status, no, description, searchDescription, description2, creationDate, lastDateModified, sourceType, sourceNo, routingNo, variantCode, inventoryPostingGroup, genProdPostingGroup, genBusPostingGroup, comment, startingTime, startingDate, endingTime, endingDate, dueDate, finishedDate, blocked, shortcutDimension1Code, shortcutDimension2Code, locationCode, binCode, replanRefNo, replanRefStatus, lowLevelCode, quantity, unitCost, costAmount, expectedOperationCostAmt, expectedComponentCostAmt, actualTimeUsed, allocatedCapacityNeed, expectedCapacityNeed, noSeries, plannedOrderNo, firmPlannedOrderNo, simulatedOrderNo, expectedMaterialOvhdCost, expectedCapacityOvhdCost, startingDateTime, endingDateTime, documentPutAwayStatus, reopened, manualScheduling, dimensionSetID, completelyPicked, assignedUserID, createdAt, lastModifiedDateTime
```

### `productionOrderLines`

**Source Table:** Prod. Order Line | **Fields:** 62 | **Nested:** productionOrderComponents

```
id, status, prodOrderNo, lineNo, itemNo, variantCode, description, description2, locationCode, shortcutDimension1Code, shortcutDimension2Code, binCode, standardTaskCode, quantity, finishedQuantity, remainingQuantity, scrap, dueDate, startingDate, startingTime, endingDate, endingTime, planningLevelCode, priority, productionBOMNo, routingNo, inventoryPostingGroup, routingReferenceNo, unitCost, costAmount, reservedQuantity, qtyRoundingPrecision, qtyRoundingPrecisionBase, manualScheduling, unitOfMeasureCode, quantityBase, finishedQtyBase, remainingQtyBase, reservedQtyBase, expectedOperationCostAmt, totalExpOperOutputQty, expectedComponentCostAmt, startingDateTime, endingDateTime, dimensionSetID, costAmountACY, unitCostACY, qtyPutAway, qtyPutAwayBase, putAwayQty, putAwayQtyBase, putAwayStatus, productionBOMVersionCode, routingVersionCode, routingType, qtyPerUnitOfMeasure, mPSOrder, planningFlexibility, indirectCost, overheadRate, createdAt, lastModifiedDateTime
```

### `productionOrderComponents`

**Source Table:** Prod. Order Component | **Fields:** 62

```
id, status, prodOrderNo, prodOrderLineNo, lineNo, itemNo, description, unitOfMeasureCode, quantity, position, position2, position3, leadTimeOffset, routingLinkCode, scrap, variantCode, qtyRoundingPrecision, qtyRoundingPrecisionBase, expectedQuantity, remainingQuantity, actConsumptionQty, flushingMethod, locationCode, shortcutDimension1Code, shortcutDimension2Code, binCode, suppliedByLineNo, planningLevelCode, itemLowLevelCode, length, width, weight, depth, calculationFormula, quantityPer, unitCost, costAmount, dueDate, dueTime, qtyPerUnitOfMeasure, remainingQtyBase, quantityBase, reservedQtyBase, reservedQuantity, expectedQtyBase, dueDateTime, dimensionSetID, substitutionAvailable, originalItemNo, originalVariantCode, pickQty, qtyPicked, qtyPickedBase, completelyPicked, pickQtyBase, directUnitCost, indirectCost, overheadRate, directCostAmount, overheadAmount, createdAt, lastModifiedDateTime
```

### `customers`

**Source Table:** Customer | **Fields:** 162

```
id, no, nameValue, searchName, name2, address, address2, city, contact, phoneNo, telexNo, documentSendingProfile, shipToCode, ourAccountNo, territoryCode, globalDimension1Code, globalDimension2Code, chainName, budgetedAmount, creditLimitLCY, customerPostingGroup, currencyCode, customerPriceGroup, languageCode, registrationNumber, statisticsGroup, paymentTermsCode, finChargeTermsCode, salespersonCode, shipmentMethodCode, shippingAgentCode, placeOfExport, invoiceDiscCode, customerDiscGroup, countryRegionCode, collectionMethod, amount, comment, blocked, invoiceCopies, lastStatementNo, printStatements, billToCustomerNo, priority, paymentMethodCode, formatRegion, lastModifiedDateTime2, lastDateModified, balance, balanceLCY, netChange, netChangeLCY, salesLCY, profitLCY, invDiscountsLCY, pmtDiscountsLCY, balanceDue, balanceDueLCY, payments, invoiceAmounts, crMemoAmounts, financeChargeMemoAmounts, paymentsLCY, invAmountsLCY, crMemoAmountsLCY, finChargeMemoAmountsLCY, outstandingOrders, shippedNotInvoiced, applicationMethod, pricesIncludingVAT, locationCode, faxNo, telexAnswerBack, vATRegistrationNo, combineShipments, genBusPostingGroup, gLN, postCode, county, eORINumber, useGLNInElectronicDocument, debitAmount, creditAmount, debitAmountLCY, creditAmountLCY, eMail, homePage, reminderTermsCode, reminderAmounts, reminderAmountsLCY, noSeries, taxAreaCode, taxLiable, vATBusPostingGroup, outstandingOrdersLCY, shippedNotInvoicedLCY, reserve, blockPaymentTolerance, pmtDiscToleranceLCY, pmtToleranceLCY, iCPartnerCode, refunds, refundsLCY, otherAmounts, otherAmountsLCY, prepayment, outstandingInvoicesLCY, outstandingInvoices, billToNoOfArchivedDoc, sellToNoOfArchivedDoc, partnerType, intrastatPartnerType, excludeFromPmtPractices, image, privacyBlocked, disableSearchByName, allowMultiplePostingGroups, preferredBankAccountCode, coupledToDataverse, cashFlowPaymentTermsCode, primaryContactNo, contactType, mobilePhoneNo, responsibilityCenter, shippingAdvice, shippingTime, shippingAgentServiceCode, priceCalculationMethod, allowLineDisc, noOfQuotes, noOfBlanketOrders, noOfOrders, noOfInvoices, noOfReturnOrders, noOfCreditMemos, noOfPstdShipments, noOfPstdInvoices, noOfPstdReturnReceipts, noOfPstdCreditMemos, noOfShipToAddresses, billToNoOfQuotes, billToNoOfBlanketOrders, billToNoOfOrders, billToNoOfInvoices, billToNoOfReturnOrders, billToNoOfCreditMemos, billToNoOfPstdShipments, billToNoOfPstdInvoices, billToNoOfPstdReturnR, billToNoOfPstdCrMemos, baseCalendarCode, copySellToAddrToQteFrom, validateEUVatRegNo, currencyId, paymentTermsId, shipmentMethodId, paymentMethodId, taxAreaID, contactID, contactGraphId, createdAt, lastModifiedDateTime
```

### `vendors`

**Source Table:** Vendor | **Fields:** 141

```
id, no, nameValue, searchName, name2, address, address2, city, contact, phoneNo, telexNo, ourAccountNo, territoryCode, globalDimension1Code, globalDimension2Code, budgetedAmount, vendorPostingGroup, currencyCode, languageCode, registrationNumber, statisticsGroup, paymentTermsCode, finChargeTermsCode, purchaserCode, shipmentMethodCode, shippingAgentCode, invoiceDiscCode, countryRegionCode, comment, blocked, payToVendorNo, priority, paymentMethodCode, formatRegion, lastModifiedDateTime2, lastDateModified, balance, balanceLCY, netChange, netChangeLCY, purchasesLCY, invDiscountsLCY, pmtDiscountsLCY, balanceDue, balanceDueLCY, payments, invoiceAmounts, crMemoAmounts, financeChargeMemoAmounts, paymentsLCY, invAmountsLCY, crMemoAmountsLCY, finChargeMemoAmountsLCY, outstandingOrders, amtRcdNotInvoiced, applicationMethod, pricesIncludingVAT, faxNo, telexAnswerBack, vATRegistrationNo, genBusPostingGroup, gLN, postCode, county, eORINumber, debitAmount, creditAmount, debitAmountLCY, creditAmountLCY, eMail, homePage, reminderAmounts, reminderAmountsLCY, noSeries, taxAreaCode, taxLiable, vATBusPostingGroup, outstandingOrdersLCY, amtRcdNotInvoicedLCY, blockPaymentTolerance, pmtDiscToleranceLCY, pmtToleranceLCY, iCPartnerCode, refunds, refundsLCY, otherAmounts, otherAmountsLCY, prepayment, outstandingInvoices, outstandingInvoicesLCY, payToNoOfArchivedDoc, buyFromNoOfArchivedDoc, partnerType, intrastatPartnerType, excludeFromPmtPractices, companySizeCode, image, privacyBlocked, disableSearchByName, creditorNo, allowMultiplePostingGroups, preferredBankAccountCode, coupledToDataverse, cashFlowPaymentTermsCode, primaryContactNo, mobilePhoneNo, responsibilityCenter, locationCode, leadTimeCalculation, priceCalculationMethod, noOfPstdReceipts, noOfPstdInvoices, noOfPstdReturnShipments, noOfPstdCreditMemos, payToNoOfOrders, payToNoOfInvoices, payToNoOfReturnOrders, payToNoOfCreditMemos, payToNoOfPstdReceipts, payToNoOfPstdInvoices, payToNoOfPstdReturnS, payToNoOfPstdCrMemos, noOfQuotes, noOfBlanketOrders, noOfOrders, noOfInvoices, noOfReturnOrders, noOfCreditMemos, noOfOrderAddresses, payToNoOfQuotes, payToNoOfBlanketOrders, noOfIncomingDocuments, baseCalendarCode, documentSendingProfile, validateEUVatRegNo, currencyId, paymentTermsId, paymentMethodId, overReceiptCode, createdAt, lastModifiedDateTime
```

### `bankAccounts`

**Source Table:** Bank Account | **Fields:** 80

```
id, no, nameValue, searchName, name2, address, address2, city, contact, phoneNo, telexNo, bankAccountNo, transitNo, territoryCode, globalDimension1Code, globalDimension2Code, chainName, minBalance, bankAccPostingGroup, currencyCode, languageCode, formatRegion, statisticsGroup, ourContactCode, countryRegionCode, amount, comment, blocked, lastStatementNo, lastPaymentStatementNo, pmtRecNoSeries, lastDateModified, balance, balanceLCY, netChange, netChangeLCY, totalOnChecks, useAsDefaultForCurrency, faxNo, telexAnswerBack, postCode, county, lastCheckNo, balanceLastStatement, balanceAtDate, balanceAtDateLCY, debitAmount, creditAmount, debitAmountLCY, creditAmountLCY, bankBranchNo, eMail, homePage, noSeries, checkReportID, checkReportName, iBAN, sWIFTCode, bankStatementImportFormat, creditTransferMsgNos, directDebitMsgNos, sEPADirectDebitExpFormat, bankStmtServiceRecordID, transactionImportTimespan, automaticStmtImportEnabled, intercompanyEnable, image, creditorNo, paymentExportFormat, bankClearingCode, bankClearingStandard, matchToleranceType, matchToleranceValue, disableAutomaticPmtMatching, disableBankRecOptimization, positivePayExportCode, checkTransmitted, mobilePhoneNo, createdAt, lastModifiedDateTime
```

### `glAccounts`

**Source Table:** G/L Account | **Fields:** 66

```
id, no, nameValue, searchName, accountType, globalDimension1Code, globalDimension2Code, accountCategory, incomeBalance, debitCredit, no2, comment, blocked, directPosting, reconciliationAccount, newPage, noOfBlankLines, indentation, sourceCurrencyCode, sourceCurrencyPosting, sourceCurrencyRevaluation, unrealizedRevaluation, lastModifiedDateTime2, lastDateModified, balanceAtDate, netChange, budgetedAmount, totaling, balance, budgetAtDate, consolTranslationMethod, consolDebitAcc, consolCreditAcc, genPostingType, genBusPostingGroup, genProdPostingGroup, debitAmount, creditAmount, automaticExtTexts, budgetedDebitAmount, budgetedCreditAmount, taxAreaCode, taxLiable, taxGroupCode, vATBusPostingGroup, vATProdPostingGroup, vATAmt, additionalCurrencyNetChange, addCurrencyBalanceAtDate, additionalCurrencyBalance, exchangeRateAdjustment, addCurrencyDebitAmount, addCurrencyCreditAmount, defaultICPartnerGLAccNo, omitDefaultDescrInJnl, sourceCurrencyNetChange, sourceCurrBalanceAtDate, sourceCurrencyBalance, accountSubcategoryEntryNo, accountSubcategoryDescript, excludeFromConsolidation, costTypeNo, defaultDeferralTemplateCode, aPIAccountType, createdAt, lastModifiedDateTime
```

### `gLEntries`

**Source Table:** G/L Entry | **Fields:** 74

```
id, entryNo, gLAccountNo, postingDate, documentType, documentNo, descriptionValue, balAccountNo, amountValue, sourceCurrencyAmount, sourceCurrencyVATAmount, sourceCurrencyCode, globalDimension1Code, globalDimension2Code, userID, sourceCode, systemCreatedEntry, priorYearEntry, jobNo, quantityValue, vATAmount, businessUnitCode, journalBatchName, reasonCode, genPostingType, genBusPostingGroup, genProdPostingGroup, balAccountType, transactionNo, debitAmount, creditAmount, documentDate, externalDocumentNo, sourceType, sourceNo, noSeries, taxAreaCode, taxLiable, taxGroupCode, useTax, vATBusPostingGroup, vATProdPostingGroup, additionalCurrencyAmount, addCurrencyDebitAmount, addCurrencyCreditAmount, closeIncomeStatementDimID, iCPartnerCode, reversedValue, reversedByEntryNo, reversedEntryNo, gLAccountName, journalTemplName, vATReportingDate, dimensionSetID, shortcutDimension3Code, shortcutDimension4Code, shortcutDimension5Code, shortcutDimension6Code, shortcutDimension7Code, shortcutDimension8Code, lastDimCorrectionEntryNo, lastDimCorrectionNode, dimensionChangesCount, allocationAccountNo, prodOrderNo, fAEntryType, fAEntryNo, commentValue, nonDeductibleVATAmount, nonDeductibleVATAmountACY, srcCurrNonDedVATAmount, accountId, createdAt, lastModifiedDateTime
```

### `customerLedgerEntries`

**Source Table:** Cust. Ledger Entry | **Fields:** 92

```
id, entryNo, customerNo, postingDate, documentType, documentNo, description, customerName, yourReference, currencyCode, amount, remainingAmount, originalAmtLCY, remainingAmtLCY, amountLCY, salesLCY, profitLCY, invDiscountLCY, sellToCustomerNo, customerPostingGroup, globalDimension1Code, globalDimension2Code, salespersonCode, userID, sourceCode, onHold, appliesToDocType, appliesToDocNo, openValue, dueDate, pmtDiscountDate, originalPmtDiscPossible, pmtDiscGivenLCY, origPmtDiscPossibleLCY, positive, closedByEntryNo, closedAtDate, closedByAmount, appliesToID, journalTemplName, journalBatchName, reasonCode, balAccountType, balAccountNo, transactionNo, closedByAmountLCY, debitAmount, creditAmount, debitAmountLCY, creditAmountLCY, documentDate, externalDocumentNo, calculateInterest, closingInterestCalculated, noSeries, closedByCurrencyCode, closedByCurrencyAmount, adjustedCurrencyFactor, originalCurrencyFactor, originalAmount, remainingPmtDiscPossible, pmtDiscToleranceDate, maxPaymentTolerance, lastIssuedReminderLevel, acceptedPaymentTolerance, acceptedPmtDiscTolerance, pmtToleranceLCY, amountToApply, iCPartnerCode, applyingEntry, reversed, reversedByEntryNo, reversedEntryNo, prepayment, paymentReference, paymentMethodCode, appliesToExtDocNo, recipientBankAccount, messageToRecipient, exportedToPaymentFile, dimensionSetID, shortcutDimension3Code, shortcutDimension4Code, shortcutDimension5Code, shortcutDimension6Code, shortcutDimension7Code, shortcutDimension8Code, directDebitMandateID, disputeStatus, promisedPayDate, createdAt, lastModifiedDateTime
```

### `detailedCustLedgerEntries`

**Source Table:** Detailed Cust. Ledg. Entry | **Fields:** 41

```
id, entryNo, custLedgerEntryNo, entryType, postingDate, documentType, documentNo, amount, amountLCY, customerNo, currencyCode, userID, sourceCode, transactionNo, journalBatchName, reasonCode, debitAmount, creditAmount, debitAmountLCY, creditAmountLCY, initialEntryDueDate, initialEntryGlobalDim1, initialEntryGlobalDim2, genBusPostingGroup, genProdPostingGroup, useTax, vATBusPostingGroup, vATProdPostingGroup, initialDocumentType, appliedCustLedgerEntryNo, unapplied, unappliedByEntryNo, remainingPmtDiscPossible, maxPaymentTolerance, taxJurisdictionCode, applicationNo, ledgerEntryAmount, postingGroup, exchRateAdjmtRegNo, createdAt, lastModifiedDateTime
```

### `vendorLedgerEntries`

**Source Table:** Vendor Ledger Entry | **Fields:** 87

```
id, entryNo, vendorNo, postingDate, documentType, documentNo, description, vendorName, currencyCode, amount, remainingAmount, originalAmtLCY, remainingAmtLCY, amountLCY, purchaseLCY, invDiscountLCY, buyFromVendorNo, vendorPostingGroup, globalDimension1Code, globalDimension2Code, purchaserCode, userID, sourceCode, onHold, appliesToDocType, appliesToDocNo, openValue, dueDate, pmtDiscountDate, originalPmtDiscPossible, pmtDiscRcdLCY, origPmtDiscPossibleLCY, positive, closedByEntryNo, closedAtDate, closedByAmount, appliesToID, journalTemplName, journalBatchName, reasonCode, balAccountType, balAccountNo, transactionNo, closedByAmountLCY, debitAmount, creditAmount, debitAmountLCY, creditAmountLCY, documentDate, externalDocumentNo, noSeries, closedByCurrencyCode, closedByCurrencyAmount, adjustedCurrencyFactor, originalCurrencyFactor, originalAmount, remainingPmtDiscPossible, pmtDiscToleranceDate, maxPaymentTolerance, acceptedPaymentTolerance, acceptedPmtDiscTolerance, pmtToleranceLCY, amountToApply, iCPartnerCode, applyingEntry, reversed, reversedByEntryNo, reversedEntryNo, prepayment, creditorNo, paymentReference, paymentMethodCode, appliesToExtDocNo, invoiceReceivedDate, recipientBankAccount, messageToRecipient, exportedToPaymentFile, dimensionSetID, shortcutDimension3Code, shortcutDimension4Code, shortcutDimension5Code, shortcutDimension6Code, shortcutDimension7Code, shortcutDimension8Code, remitToCode, createdAt, lastModifiedDateTime
```

### `detailedVendorLedgerEntries`

**Source Table:** Detailed Vendor Ledg. Entry | **Fields:** 41

```
id, entryNo, vendorLedgerEntryNo, entryType, postingDate, documentType, documentNo, amount, amountLCY, vendorNo, currencyCode, userID, sourceCode, transactionNo, journalBatchName, reasonCode, debitAmount, creditAmount, debitAmountLCY, creditAmountLCY, initialEntryDueDate, initialEntryGlobalDim1, initialEntryGlobalDim2, genBusPostingGroup, genProdPostingGroup, useTax, vATBusPostingGroup, vATProdPostingGroup, initialDocumentType, appliedVendLedgerEntryNo, unapplied, unappliedByEntryNo, remainingPmtDiscPossible, maxPaymentTolerance, taxJurisdictionCode, applicationNo, ledgerEntryAmount, postingGroup, exchRateAdjmtRegNo, createdAt, lastModifiedDateTime
```

### `bankAccountLedgerEntries`

**Source Table:** Bank Account Ledger Entry | **Fields:** 50

```
id, entryNo, bankAccountNo, postingDate, documentType, documentNo, description, currencyCode, amount, remainingAmount, amountLCY, bankAccPostingGroup, globalDimension1Code, globalDimension2Code, ourContactCode, userID, sourceCode, openValue, positive, closedByEntryNo, closedAtDate, journalTemplName, journalBatchName, reasonCode, balAccountType, balAccountNo, transactionNo, statementStatus, statementNo, statementLineNo, debitAmount, creditAmount, debitAmountLCY, creditAmountLCY, documentDate, externalDocumentNo, reversed, reversedByEntryNo, reversedEntryNo, statementDate, checkLedgerEntries, dimensionSetID, shortcutDimension3Code, shortcutDimension4Code, shortcutDimension5Code, shortcutDimension6Code, shortcutDimension7Code, shortcutDimension8Code, createdAt, lastModifiedDateTime
```

### `valueEntries`

**Source Table:** Value Entry | **Fields:** 69

```
id, entryNo, itemNo, postingDate, itemLedgerEntryType, sourceNo, documentNo, descriptionValue, locationCode, inventoryPostingGroup, sourcePostingGroup, itemLedgerEntryNo, valuedQuantity, itemLedgerEntryQuantity, invoicedQuantity, costPerUnit, itemRegisterNo, sIFTBucketNo, salespersPurchCode, discountAmount, userID, sourceCode, appliesToEntry, globalDimension1Code, globalDimension2Code, sourceType, costPostedToGL, reasonCode, dropShipment, journalBatchName, genBusPostingGroup, genProdPostingGroup, documentDate, externalDocumentNo, documentType, documentLineNo, vATReportingDate, orderType, orderNo, orderLineNo, expectedCost, itemChargeNo, valuedByAverageCost, partialRevaluation, inventoriable, valuationDate, entryType, varianceType, expectedCostPostedToGL, dimensionSetID, shortcutDimension3Code, shortcutDimension4Code, shortcutDimension5Code, shortcutDimension6Code, shortcutDimension7Code, shortcutDimension8Code, jobNo, jobTaskNo, jobLedgerEntryNo, variantCode, adjustment, averageCostException, capacityLedgerEntryNo, typeValue, noValue, returnReasonCode, itemDescription, createdAt, lastModifiedDateTime
```

### `itemLedgerEntries`

**Source Table:** Item Ledger Entry | **Fields:** 76

```
id, entryNo, itemNo, postingDate, entryType, sourceNo, documentNo, descriptionValue, locationCode, quantityValue, remainingQuantity, invoicedQuantity, itemRegisterNo, sIFTBucketNo, appliesToEntry, openValue, globalDimension1Code, globalDimension2Code, positiveValue, shptMethodCode, sourceType, dropShipment, transactionType, transportMethod, countryRegionCode, entryExitPoint, documentDate, externalDocumentNo, areaValue, transactionSpecification, noSeries, reservedQuantity, documentType, documentLineNo, orderType, orderNo, orderLineNo, dimensionSetID, shortcutDimension3Code, shortcutDimension4Code, shortcutDimension5Code, shortcutDimension6Code, shortcutDimension7Code, shortcutDimension8Code, assembleToOrder, jobNo, jobTaskNo, jobPurchase, variantCode, qtyPerUnitOfMeasure, unitOfMeasureCode, derivedFromBlanketOrder, originallyOrderedNo, originallyOrderedVarCode, outOfStockSubstitution, itemCategoryCode, nonstock, purchasingCode, itemReferenceNo, completelyInvoiced, lastInvoiceDate, appliedEntryToAdjust, correctionValue, shippedQtyNotReturned, itemLedgerEntryQuantity, prodOrderCompLineNo, serialNo, lotNo, warrantyDate, expirationDate, itemTracking, packageNo, returnReasonCode, itemDescription, createdAt, lastModifiedDateTime
```

### `fixedAssets`

**Source Table:** Fixed Asset | **Fields:** 34

```
id, no, description, searchDescription, description2, fAClassCode, fASubclassCode, globalDimension1Code, globalDimension2Code, locationCode, fALocationCode, vendorNo, mainAssetComponent, componentOfMainAsset, budgetedAsset, warrantyDate, responsibleEmployee, serialNo, lastDateModified, insured, comment, blocked, maintenanceVendorNo, underMaintenance, nextServiceDate, inactive, noSeries, fAPostingGroup, acquired, image, fALocationId, responsibleEmployeeId, createdAt, lastModifiedDateTime
```

### `faLedgerEntries`

**Source Table:** FA Ledger Entry | **Fields:** 84

```
id, entryNo, gLEntryNo, fANo, fAPostingDate, postingDate, documentType, documentDate, documentNo, externalDocumentNo, description, depreciationBookCode, fAPostingCategory, fAPostingType, amount, debitAmount, creditAmount, reclassificationEntry, partOfBookValue, partOfDepreciableBasis, disposalCalculationMethod, disposalEntryNo, noOfDepreciationDays, quantity, fANoBudgetedFANo, fASubclassCode, fALocationCode, fAPostingGroup, globalDimension1Code, globalDimension2Code, locationCode, userID, depreciationMethod, depreciationStartingDate, straightLine, noOfDepreciationYears, fixedDeprAmount, decliningBalance, depreciationTableCode, journalBatchName, sourceCode, reasonCode, transactionNo, balAccountType, balAccountNo, vATAmount, genPostingType, genBusPostingGroup, genProdPostingGroup, fAClassCode, fAExchangeRate, amountLCY, resultOnDisposal, correction, indexEntry, canceledFromFANo, depreciationEndingDate, useFALedgerCheck, automaticEntry, deprStartingDateCustom1, deprEndingDateCustom1, accumDeprCustom1, deprThisYearCustom1, propertyClassCustom1, noSeries, taxAreaCode, taxLiable, taxGroupCode, useTax, vATBusPostingGroup, vATProdPostingGroup, reversed, reversedByEntryNo, reversedEntryNo, dimensionSetID, shortcutDimension3Code, shortcutDimension4Code, shortcutDimension5Code, shortcutDimension6Code, shortcutDimension7Code, shortcutDimension8Code, nonDedVATFACost, createdAt, lastModifiedDateTime
```

### `dimensionSetEntries`

**Source Table:** Dimension Set Entry | **Fields:** 10

```
id, dimensionSetID, dimensionCode, dimensionValueCode, dimensionValueID, dimensionName, dimensionValueName, globalDimensionNo, createdAt, lastModifiedDateTime
```

### `dimensionValues`

**Source Table:** Dimension Value | **Fields:** 17

```
id, dimensionCode, codeValue, nameValue, dimensionValueType, totaling, blockedValue, consolidationCode, indentation, globalDimensionNo, mapToICDimensionCode, mapToICDimensionValueCode, dimensionValueID, lastModifiedDateTimeBC, dimensionId, createdAt, lastModifiedDateTime
```

---

## Notes

- **id** = `SystemId` (GUID) — OData key สำหรับทุก endpoint
- **FlowFields** (Balance, Amount, Inventory ฯลฯ) ถูก CalcFields อัตโนมัติใน `OnAfterGetRecord`
- Reserved keyword renames: `type` → `lineType`/`typeValue`, `area` → `areaValue`, `name` → `nameValue`
- ทุก endpoint เป็น read-only (`InsertAllowed/ModifyAllowed/DeleteAllowed = false`)
- Line endpoints เรียกได้ทั้งผ่าน parent (`/salesOrders({id})/salesOrderLines`) หรือ standalone
