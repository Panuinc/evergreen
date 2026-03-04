import { createClient } from "@supabase/supabase-js";
import { bcODataGet, bcApiGet, bcProductionODataGet } from "@/lib/bcClient";

export const maxDuration = 300;

function extractProjectCode(itemNo) {
  if (!itemNo) return null;
  const parts = itemNo.split("-");
  if (parts.length >= 2) return parts[1];
  return null;
}

async function batchUpsert(
  supabase,
  table,
  rows,
  { batchSize = 1000, concurrency = 3, onConflictCol = "bcCustomerExternalId", onProgress } = {},
) {
  const batches = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }

  let done = 0;
  for (let i = 0; i < batches.length; i += concurrency) {
    const chunk = batches.slice(i, i + concurrency);
    const results = await Promise.all(
      chunk.map((batch) =>
        supabase.from(table).upsert(batch, { onConflict: onConflictCol }),
      ),
    );
    for (const { error } of results) {
      if (error) throw error;
    }
    done += chunk.length;
    onProgress?.(Math.min(done * batchSize, rows.length), rows.length);
  }
}

function isSafeToCleanup(newCount, totalCount) {
  if (totalCount === 0) return true;
  return (newCount / totalCount) * 100 >= 50;
}

function bcDate(val) {
  if (!val || val === "0001-01-01") return null;
  return val;
}

function bcTimestamp(val) {
  if (!val || val.startsWith("0001-01-01")) return null;
  return val;
}

const ALL_TABLES = [
  "dimensionValues",
  "customers",
  "items",
  "salesOrders",
  "salesOrderLines",
  "production",
];

let syncLock = null;
const LOCK_TTL = 5 * 60 * 1000;

export async function GET(request) {
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (syncLock && Date.now() - syncLock < LOCK_TTL) {
    return Response.json(
      {
        error: "Sync is already running",
        lockedSince: new Date(syncLock).toISOString(),
      },
      { status: 429 },
    );
  }
  syncLock = Date.now();

  const url = new URL(request.url);
  const tablesParam = url.searchParams.get("tables");
  const stream = url.searchParams.get("stream") === "1";
  const requestedTables = tablesParam
    ? tablesParam.split(",").filter((t) => ALL_TABLES.includes(t))
    : ALL_TABLES;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // Non-streaming (cron / backward compat)
  if (!stream) {
    try {
      const result = await runSync(supabase, requestedTables, () => {});
      return Response.json(result);
    } finally {
      syncLock = null;
    }
  }

  // SSE streaming
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const send = (event, data) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      try {
        const result = await runSync(supabase, requestedTables, send);
        send("done", result);
      } catch (e) {
        send("error", { message: e.message });
      } finally {
        syncLock = null;
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ═══════════════════════════════════════════════════
// Core sync logic (shared by streaming & non-streaming)
// ═══════════════════════════════════════════════════

async function runSync(supabase, requestedTables, send) {
  const shouldSync = (table) => requestedTables.includes(table);
  const needDims =
    shouldSync("dimensionValues") ||
    shouldSync("items") ||
    shouldSync("salesOrderLines") ||
    shouldSync("production");
  const needOrders = shouldSync("salesOrders");
  const needLines = shouldSync("salesOrderLines");

  const now = new Date().toISOString();
  const results = {};
  const syncSuccess = {};

  // ═══ Phase 1: Dimension Values ═══
  let dimMap = {};
  if (needDims) {
    send("progress", {
      phase: "dimensionValues",
      step: "fetching",
      label: "ดึงข้อมูลมิติ...",
    });
    try {
      const dims = await bcApiGet("dimensionValues", {
        $select: "code,displayName",
      });
      for (const d of dims) {
        if (d.code) dimMap[d.code] = d.displayName || d.code;
      }
      if (shouldSync("dimensionValues")) {
        results.dimensionValues = dims.length;
        send("progress", {
          phase: "dimensionValues",
          step: "done",
          count: dims.length,
          label: `มิติ ${dims.length} รายการ`,
        });
      }
    } catch (e) {
      if (shouldSync("dimensionValues")) {
        results.dimensionValues = `ERROR: ${e.message}`;
        send("progress", {
          phase: "dimensionValues",
          step: "error",
          error: e.message,
        });
      }
    }
  }

  // ═══ Phase 2: Customers ═══
  if (shouldSync("customers")) {
    send("progress", {
      phase: "customers",
      step: "fetching",
      label: "ดึงข้อมูลลูกค้า...",
    });
    try {
      const customers = await bcODataGet("CustomerList", {
        $select:
          "No,Name,Phone_No,Contact,Balance_Due_LCY,Balance_LCY,Salesperson_Code",
        $orderby: "No asc",
      });
      const customerRows = customers.map((c) => ({
        bcCustomerExternalId: c.No,
        bcCustomerNumber: c.No,
        bcCustomerDisplayName: c.Name,
        bcCustomerPhoneNumber: c.Phone_No,
        bcCustomerContact: c.Contact,
        bcCustomerBalanceDue: c.Balance_Due_LCY,
        bcCustomerBalance: c.Balance_LCY,
        bcCustomerSalespersonCode: c.Salesperson_Code,
        bcCustomerSyncedAt: now,
      }));
      send("progress", {
        phase: "customers",
        step: "saving",
        count: customerRows.length,
        label: `บันทึกลูกค้า ${customerRows.length.toLocaleString()} รายการ...`,
      });
      await batchUpsert(supabase, "bcCustomer", customerRows, {
        onConflictCol: "bcCustomerExternalId",
        onProgress: (done, total) =>
          send("progress", {
            phase: "customers",
            step: "saving",
            done,
            total,
            label: `บันทึกลูกค้า ${done.toLocaleString()}/${total.toLocaleString()}`,
          }),
      });
      results.customers = customerRows.length;
      syncSuccess.customers = true;
      send("progress", {
        phase: "customers",
        step: "done",
        count: customerRows.length,
        label: `ลูกค้า ${customerRows.length.toLocaleString()} รายการ`,
      });
    } catch (e) {
      results.customers = `ERROR: ${e.message}`;
      send("progress", {
        phase: "customers",
        step: "error",
        error: e.message,
      });
    }
  }

  // ═══ Phase 3: Items ═══
  if (shouldSync("items")) {
    send("progress", {
      phase: "items",
      step: "fetching",
      label: "ดึงข้อมูลสินค้า...",
    });
    try {
      const items = await bcODataGet(
        "Item_Card_Excel",
        {
          $filter: "Blocked eq false and Inventory gt 0",
          $select:
            "No,Description,Type,Inventory,Unit_Price,Unit_Cost,Item_Category_Code,Gen_Prod_Posting_Group,Blocked,Base_Unit_of_Measure",
          $orderby: "No asc",
        },
        { timeout: 120_000 },
      );
      // Fetch existing RFID codes so upsert doesn't overwrite them
      const itemNos = items.map((i) => i.No);
      const rfidMap = {};
      for (let i = 0; i < itemNos.length; i += 1000) {
        const batch = itemNos.slice(i, i + 1000);
        const { data: existing } = await supabase
          .from("bcItem")
          .select("bcItemExternalId, bcItemRfidCode")
          .in("bcItemExternalId", batch)
          .not("bcItemRfidCode", "is", null);
        for (const row of existing || []) {
          rfidMap[row.bcItemExternalId] = row.bcItemRfidCode;
        }
      }

      // Auto-assign sequential rfidCode to items that don't have one yet
      const maxExisting = Object.values(rfidMap).reduce(
        (max, v) => Math.max(max, parseInt(v) || 0),
        0,
      );
      let nextCode = maxExisting + 1;
      // Sort items by No to ensure stable assignment order across syncs
      const sortedItems = [...items].sort((a, b) => a.No.localeCompare(b.No));
      for (const item of sortedItems) {
        if (!rfidMap[item.No]) {
          rfidMap[item.No] = String(nextCode++);
        }
      }

      const itemRows = items.map((i) => {
        const projectCode = extractProjectCode(i.No);
        return {
          bcItemExternalId: i.No,
          bcItemNumber: i.No,
          bcItemDisplayName: i.Description,
          bcItemType: i.Type,
          bcItemInventory: i.Inventory,
          bcItemUnitPrice: i.Unit_Price,
          bcItemUnitCost: i.Unit_Cost,
          bcItemCategoryCode: i.Item_Category_Code,
          bcItemGeneralProductPostingGroupCode: i.Gen_Prod_Posting_Group,
          bcItemBlocked: i.Blocked,
          bcItemBaseUnitOfMeasure: i.Base_Unit_of_Measure,
          bcItemProjectCode: projectCode,
          bcItemProjectName: projectCode ? dimMap[projectCode] || null : null,
          bcItemRfidCode: rfidMap[i.No],
          bcItemSyncedAt: now,
        };
      });
      send("progress", {
        phase: "items",
        step: "saving",
        count: itemRows.length,
        label: `บันทึกสินค้า ${itemRows.length.toLocaleString()} รายการ...`,
      });
      await batchUpsert(supabase, "bcItem", itemRows, {
        onConflictCol: "bcItemExternalId",
        onProgress: (done, total) =>
          send("progress", {
            phase: "items",
            step: "saving",
            done,
            total,
            label: `บันทึกสินค้า ${done.toLocaleString()}/${total.toLocaleString()}`,
          }),
      });
      results.items = itemRows.length;
      syncSuccess.items = true;
      send("progress", {
        phase: "items",
        step: "done",
        count: itemRows.length,
        label: `สินค้า ${itemRows.length.toLocaleString()} รายการ`,
      });
    } catch (e) {
      results.items = `ERROR: ${e.message}`;
      send("progress", { phase: "items", step: "error", error: e.message });
    }
  }

  // ═══ Phase 4: Sales Orders + Lines ═══
  if (needOrders || needLines) {
    send("progress", {
      phase: "salesOrders",
      step: "fetching",
      label: "ดึงข้อมูลคำสั่งขาย...",
    });
    try {
      // Build month prefixes from SO2501 to current month to avoid BC API timeout
      const soPrefixes = [];
      const startYear = 25, startMonth = 1;
      const nowDate = new Date();
      const endYear = nowDate.getFullYear() % 100;
      const endMonth = nowDate.getMonth() + 1;
      for (let y = startYear; y <= endYear; y++) {
        const mStart = y === startYear ? startMonth : 1;
        const mEnd = y === endYear ? endMonth : 12;
        for (let m = mStart; m <= mEnd; m++) {
          soPrefixes.push(`SO${String(y).padStart(2, "0")}${String(m).padStart(2, "0")}`);
        }
      }

      const selectOrders =
        "No,Sell_to_Customer_No,Sell_to_Customer_Name,Sell_to_Address,Sell_to_City,Sell_to_Post_Code,Ship_to_Name,Ship_to_Address,Ship_to_City,Ship_to_Post_Code,Order_Date,Due_Date,Status,Completely_Shipped,Salesperson_Code,External_Document_No";
      const selectLines =
        "Document_No,Line_No,Type,No,Description,Quantity,Unit_Price,Line_Amount,Quantity_Shipped,BWK_Outstanding_Quantity,Unit_of_Measure_Code,Location_Code";

      const orders = [];
      const allLines = [];

      for (const prefix of soPrefixes) {
        send("progress", {
          phase: "salesOrders",
          step: "fetching",
          label: `ดึงคำสั่งขาย ${prefix}...`,
        });
        const monthOrders = await bcODataGet(
          "Sales_Order_Excel",
          { $filter: `startswith(No,'${prefix}')`, $orderby: "No desc", $select: selectOrders },
          { timeout: 120_000 },
        );
        orders.push(...monthOrders);

        send("progress", {
          phase: "salesOrderLines",
          step: "fetching",
          label: `ดึงรายการ ${prefix}...`,
        });
        const monthLines = await bcODataGet(
          "Sales_Order_Line_Excel",
          { $filter: `startswith(Document_No,'${prefix}')`, $select: selectLines },
          { timeout: 120_000 },
        );
        allLines.push(...monthLines);
      }

      const amountByOrder = {};
      for (const l of allLines) {
        amountByOrder[l.Document_No] =
          (amountByOrder[l.Document_No] || 0) + (l.Line_Amount || 0);
      }

      if (shouldSync("salesOrders")) {
        send("progress", {
          phase: "salesOrders",
          step: "saving",
          count: orders.length,
          label: `บันทึก SO ${orders.length.toLocaleString()} รายการ...`,
        });
        const orderRows = orders.map((o) => ({
          bcSalesOrderExternalId: o.No,
          bcSalesOrderNumber: o.No,
          bcSalesOrderCustomerNumber: o.Sell_to_Customer_No,
          bcSalesOrderCustomerName: o.Sell_to_Customer_Name,
          bcSalesOrderSellToAddress: o.Sell_to_Address,
          bcSalesOrderSellToCity: o.Sell_to_City,
          bcSalesOrderSellToPostCode: o.Sell_to_Post_Code,
          bcSalesOrderShipToName: o.Ship_to_Name,
          bcSalesOrderShipToAddress: o.Ship_to_Address,
          bcSalesOrderShipToCity: o.Ship_to_City,
          bcSalesOrderShipToPostCode: o.Ship_to_Post_Code,
          bcSalesOrderDate: o.Order_Date || null,
          bcSalesOrderDueDate: o.Due_Date || null,
          bcSalesOrderStatus: o.Status,
          bcSalesOrderCompletelyShipped: o.Completely_Shipped,
          bcSalesOrderSalespersonCode: o.Salesperson_Code,
          bcSalesOrderExternalDocumentNumber: o.External_Document_No,
          bcSalesOrderTotalAmountIncVat: amountByOrder[o.No] || 0,
          bcSalesOrderSyncedAt: now,
        }));
        await batchUpsert(supabase, "bcSalesOrder", orderRows, {
          onConflictCol: "bcSalesOrderExternalId",
          onProgress: (done, total) =>
            send("progress", {
              phase: "salesOrders",
              step: "saving",
              done,
              total,
              label: `บันทึก SO ${done.toLocaleString()}/${total.toLocaleString()}`,
            }),
        });
        results.salesOrders = orderRows.length;
        syncSuccess.salesOrders = true;
        send("progress", {
          phase: "salesOrders",
          step: "done",
          count: orderRows.length,
          label: `คำสั่งขาย ${orderRows.length.toLocaleString()} รายการ`,
        });
      }

      if (shouldSync("salesOrderLines")) {
        send("progress", {
          phase: "salesOrderLines",
          step: "saving",
          count: allLines.length,
          label: `บันทึกรายการ SO ${allLines.length.toLocaleString()} รายการ...`,
        });
        const lineRows = allLines.map((l) => {
          const projectCode = extractProjectCode(l.No);
          return {
            bcSalesOrderLineExternalId: `${l.Document_No}-${l.Line_No}`,
            bcSalesOrderLineDocumentNo: l.Document_No,
            bcSalesOrderLineNo: l.Line_No,
            bcSalesOrderLineType: l.Type?.trim() || null,
            bcSalesOrderLineObjectNumber: l.No,
            bcSalesOrderLineDescription: l.Description,
            bcSalesOrderLineQuantity: l.Quantity,
            bcSalesOrderLineUnitPrice: l.Unit_Price,
            bcSalesOrderLineAmount: l.Line_Amount,
            bcSalesOrderLineQuantityShipped: l.Quantity_Shipped,
            bcSalesOrderLineOutstandingQuantity: l.BWK_Outstanding_Quantity,
            bcSalesOrderLineUnitOfMeasureCode: l.Unit_of_Measure_Code,
            bcSalesOrderLineLocationCode: l.Location_Code?.trim() || null,
            bcSalesOrderLineProjectCode: projectCode,
            bcSalesOrderLineProjectName: projectCode ? dimMap[projectCode] || null : null,
            bcSalesOrderLineSyncedAt: now,
          };
        });
        await batchUpsert(supabase, "bcSalesOrderLine", lineRows, {
          onConflictCol: "bcSalesOrderLineExternalId",
          onProgress: (done, total) =>
            send("progress", {
              phase: "salesOrderLines",
              step: "saving",
              done,
              total,
              label: `บันทึกรายการ ${done.toLocaleString()}/${total.toLocaleString()}`,
            }),
        });
        results.salesOrderLines = lineRows.length;
        syncSuccess.salesOrderLines = true;
        send("progress", {
          phase: "salesOrderLines",
          step: "done",
          count: lineRows.length,
          label: `รายการ SO ${lineRows.length.toLocaleString()} รายการ`,
        });
      }
    } catch (e) {
      if (shouldSync("salesOrders") && !results.salesOrders) {
        results.salesOrders = `ERROR: ${e.message}`;
        send("progress", {
          phase: "salesOrders",
          step: "error",
          error: e.message,
        });
      }
      if (shouldSync("salesOrderLines") && !results.salesOrderLines) {
        results.salesOrderLines = `ERROR: ${e.message}`;
        send("progress", {
          phase: "salesOrderLines",
          step: "error",
          error: e.message,
        });
      }
    }
  }


  // ═══ Phase 5: Production (productionOrder + ItemLedgerEntries → bcProduction) ═══
  if (shouldSync("production")) {
    send("progress", {
      phase: "production",
      step: "fetching",
      label: "ดึงข้อมูลใบสั่งผลิต...",
    });
    try {
      const [prodOrders, ileEntries] = await Promise.all([
        bcProductionODataGet(
          "productionOrder",
          { $filter: "No ge 'RPD2501-001'" },
          { timeout: 120_000 },
        ),
        bcProductionODataGet(
          "ItemLedgerEntries",
          {
            $filter:
              "(Entry_Type eq 'Consumption' or Entry_Type eq 'Output') and Posting_Date ge 2025-01-01 and Document_No ge 'RPD2501'",
          },
          { timeout: 180_000 },
        ),
      ]);

      send("progress", {
        phase: "production",
        step: "fetching",
        label: `ดึงข้อมูลเสร็จ: ใบสั่งผลิต ${prodOrders.length.toLocaleString()} / ILE ${ileEntries.length.toLocaleString()} รายการ`,
      });

      // ── Map Production Orders ──
      const poRows = prodOrders.map((o) => ({
        bcProductionOrderExternalId: o.No,
        bcProductionOrderStatus: o.Status || null,
        bcProductionOrderDescription: o.Description || null,
        bcProductionOrderDescription2: o.Description_2 || null,
        bcProductionOrderSourceNo: o.Source_No || null,
        bcProductionOrderRoutingNo: o.Routing_No || null,
        bcProductionOrderQuantity: o.Quantity || 0,
        bcProductionOrderDimension1Code: o.Shortcut_Dimension_1_Code || null,
        bcProductionOrderDimension1Name: dimMap[o.Shortcut_Dimension_1_Code] || null,
        bcProductionOrderDimension2Code: o.Shortcut_Dimension_2_Code || null,
        bcProductionOrderDimension2Name: dimMap[o.Shortcut_Dimension_2_Code] || null,
        bcProductionOrderLocationCode: o.Location_Code || null,
        bcProductionOrderStartingDateTime: bcTimestamp(o.Starting_Date_Time),
        bcProductionOrderEndingDateTime: bcTimestamp(o.Ending_Date_Time),
        bcProductionOrderDueDate: bcDate(o.Due_Date),
        bcProductionOrderRemainingConsumption: o.BWK_Remaining_Consumption || 0,
        bcProductionOrderAssignedUserId: o.Assigned_User_ID || null,
        bcProductionOrderFinishedDate: bcDate(o.Finished_Date),
        bcProductionOrderSearchDescription: o.Search_Description || null,
        bcProductionOrderSyncedAt: now,
      }));

      // ── Map Item Ledger Entries ──
      const ileRows = ileEntries.map((e) => ({
        bcItemLedgerEntryExternalNo: e.Entry_No,
        bcItemLedgerEntryItemNo: e.Item_No || null,
        bcItemLedgerEntryPostingDate: bcDate(e.Posting_Date),
        bcItemLedgerEntryDocumentDate: bcDate(e.DocumentDate),
        bcItemLedgerEntryEntryType: e.Entry_Type?.trim() || null,
        bcItemLedgerEntryDocumentType: e.Document_Type?.trim() || null,
        bcItemLedgerEntryDocumentNo: e.Document_No || null,
        bcItemLedgerEntryItemDescription: e.Description || e.Item_Description || null,
        bcItemLedgerEntryEmployeeCode: e.CHH_Employee_Code || null,
        bcItemLedgerEntryEmployeeName: e.CHH_Employee_Name || null,
        bcItemLedgerEntryDescription2: e.BWK_Descriptin_2 || null,
        bcItemLedgerEntryLocationCode: e.Location_Code || null,
        bcItemLedgerEntryLotNo: e.Lot_No || null,
        bcItemLedgerEntrySerialNo: e.Serial_No || null,
        bcItemLedgerEntryExpirationDate: bcDate(e.Expiration_Date),
        bcItemLedgerEntryQuantity: e.Quantity || 0,
        bcItemLedgerEntryUnitOfMeasureCode: e.Unit_of_Measure_Code || null,
        bcItemLedgerEntryRemainingQuantity: e.Remaining_Quantity || 0,
        bcItemLedgerEntryInvoicedQuantity: e.Invoiced_Quantity || 0,
        bcItemLedgerEntryCompletelyInvoiced: e.Completely_Invoiced || false,
        bcItemLedgerEntryUnitCostExpected: e.UnitCostExp || 0,
        bcItemLedgerEntryCostAmountExpected: e.Cost_Amount_Expected || 0,
        bcItemLedgerEntryUnitCostActual: e.UnitCostActual || 0,
        bcItemLedgerEntryCostAmountActual: e.Cost_Amount_Actual || 0,
        bcItemLedgerEntrySalesAmountExpected: e.Sales_Amount_Expected || 0,
        bcItemLedgerEntrySalesAmountActual: e.Sales_Amount_Actual || 0,
        bcItemLedgerEntryOpen: e.Open || false,
        bcItemLedgerEntryGlobalDimension1Code: e.Global_Dimension_1_Code || null,
        bcItemLedgerEntryGlobalDimension1Name: dimMap[e.Global_Dimension_1_Code] || null,
        bcItemLedgerEntryGlobalDimension2Code: e.Global_Dimension_2_Code || null,
        bcItemLedgerEntryGlobalDimension2Name: dimMap[e.Global_Dimension_2_Code] || null,
        bcItemLedgerEntryOrderType: e.Order_Type?.trim() || null,
        bcItemLedgerEntryOrderLineNo: e.Order_Line_No || 0,
        bcItemLedgerEntryDocumentLineNo: e.Document_Line_No || 0,
        bcItemLedgerEntryVariantCode: e.Variant_Code || null,
        bcItemLedgerEntryBinCode: e.BWK_Bin_Code || null,
        bcItemLedgerEntryBaseUnitOfMeasure: e.BWK_Base_Unit_of_Measure || null,
        bcItemLedgerEntryTotalGrossWeight: e.BWK_Total_Gross_Weight || 0,
        bcItemLedgerEntryTotalNetWeight: e.BWK_Total_Net_Weight || 0,
        bcItemLedgerEntryCreatedBy: e.BWK_Create_By || null,
        bcItemLedgerEntrySyncedAt: now,
      }));

      send("progress", {
        phase: "production",
        step: "saving",
        label: `บันทึก PO ${poRows.length.toLocaleString()} / ILE ${ileRows.length.toLocaleString()} รายการ...`,
      });

      // Delete all then insert (full replace strategy)
      await Promise.all([
        supabase.from("bcProductionOrder").delete().neq("bcProductionOrderExternalId", ""),
        supabase.from("bcItemLedgerEntry").delete().gte("bcItemLedgerEntryExternalNo", 0),
      ]);

      // Insert both tables in parallel
      await Promise.all([
        batchUpsert(supabase, "bcProductionOrder", poRows, {
          onConflictCol: "bcProductionOrderExternalId",
          onProgress: (done, total) =>
            send("progress", {
              phase: "production",
              step: "saving",
              label: `บันทึก PO ${done.toLocaleString()}/${total.toLocaleString()}`,
            }),
        }),
        batchUpsert(supabase, "bcItemLedgerEntry", ileRows, {
          onConflictCol: "bcItemLedgerEntryExternalNo",
          onProgress: (done, total) =>
            send("progress", {
              phase: "production",
              step: "saving",
              label: `บันทึก ILE ${done.toLocaleString()}/${total.toLocaleString()}`,
            }),
        }),
      ]);

      results.production = { orders: poRows.length, entries: ileRows.length };
      syncSuccess.production = true;
      send("progress", {
        phase: "production",
        step: "done",
        count: poRows.length + ileRows.length,
        label: `การผลิต PO ${poRows.length.toLocaleString()} / ILE ${ileRows.length.toLocaleString()} รายการ`,
      });
    } catch (e) {
      results.production = `ERROR: ${e.message}`;
      send("progress", {
        phase: "production",
        step: "error",
        error: e.message,
      });
    }
  }

  // ═══ Phase 6: Cleanup ═══
  send("progress", {
    phase: "cleanup",
    step: "cleaning",
    label: "ลบข้อมูลเก่า...",
  });
  const cleanup = {};
  const cleanupParallel = [];

  if (syncSuccess.customers) {
    cleanupParallel.push(
      (async () => {
        const { count: staleCount } = await supabase
          .from("bcCustomer")
          .select("*", { count: "exact", head: true })
          .lt("bcCustomerSyncedAt", now);
        if (
          !isSafeToCleanup(
            results.customers,
            results.customers + (staleCount || 0),
          )
        ) {
          cleanup.customers = `SKIPPED: sync got ${results.customers} but ${staleCount} would be deleted`;
          return;
        }
        const { count, error } = await supabase
          .from("bcCustomer")
          .delete({ count: "exact" })
          .lt("bcCustomerSyncedAt", now);
        cleanup.customers = error ? `ERROR: ${error.message}` : count || 0;
      })(),
    );
  }

  if (syncSuccess.items) {
    cleanupParallel.push(
      (async () => {
        const { count, error } = await supabase
          .from("bcItem")
          .delete({ count: "exact" })
          .lt("bcItemSyncedAt", now);
        cleanup.items = error ? `ERROR: ${error.message}` : count || 0;
      })(),
    );
  }

  await Promise.all(cleanupParallel);

  if (syncSuccess.salesOrderLines) {
    const { count: staleCount } = await supabase
      .from("bcSalesOrderLine")
      .select("*", { count: "exact", head: true })
      .lt("bcSalesOrderLineSyncedAt", now);
    if (
      !isSafeToCleanup(
        results.salesOrderLines,
        results.salesOrderLines + (staleCount || 0),
      )
    ) {
      cleanup.salesOrderLines = `SKIPPED: sync got ${results.salesOrderLines} but ${staleCount} would be deleted`;
    } else {
      const { count, error } = await supabase
        .from("bcSalesOrderLine")
        .delete({ count: "exact" })
        .lt("bcSalesOrderLineSyncedAt", now);
      cleanup.salesOrderLines = error
        ? `ERROR: ${error.message}`
        : count || 0;
    }
  }

  if (syncSuccess.salesOrders) {
    const { count: staleCount } = await supabase
      .from("bcSalesOrder")
      .select("*", { count: "exact", head: true })
      .lt("bcSalesOrderSyncedAt", now);
    if (
      !isSafeToCleanup(
        results.salesOrders,
        results.salesOrders + (staleCount || 0),
      )
    ) {
      cleanup.salesOrders = `SKIPPED: sync got ${results.salesOrders} but ${staleCount} would be deleted`;
    } else {
      const { count, error } = await supabase
        .from("bcSalesOrder")
        .delete({ count: "exact" })
        .lt("bcSalesOrderSyncedAt", now);
      cleanup.salesOrders = error ? `ERROR: ${error.message}` : count || 0;
    }
  }


  send("progress", {
    phase: "cleanup",
    step: "done",
    label: "ลบข้อมูลเก่าเสร็จ",
  });

  return { ok: true, syncedAt: now, results, cleanup };
}
