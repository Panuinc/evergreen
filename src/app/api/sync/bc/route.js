import { createClient } from "@supabase/supabase-js";
import { bcODataGet, bcApiGet } from "@/lib/bcClient";

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
  { batchSize = 1000, concurrency = 3, onProgress } = {},
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
        supabase.from(table).upsert(batch, { onConflict: "id" }),
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

const ALL_TABLES = [
  "dimensionValues",
  "customers",
  "items",
  "salesOrders",
  "salesOrderLines",
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
    shouldSync("salesOrderLines");
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
        id: c.No,
        number: c.No,
        displayName: c.Name,
        phoneNumber: c.Phone_No,
        contact: c.Contact,
        balanceDue: c.Balance_Due_LCY,
        balance: c.Balance_LCY,
        salespersonCode: c.Salesperson_Code,
        syncedAt: now,
      }));
      send("progress", {
        phase: "customers",
        step: "saving",
        count: customerRows.length,
        label: `บันทึกลูกค้า ${customerRows.length.toLocaleString()} รายการ...`,
      });
      await batchUpsert(supabase, "bcCustomers", customerRows, {
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
          $filter: "Blocked eq false",
          $select:
            "No,Description,Type,Inventory,Unit_Price,Unit_Cost,Item_Category_Code,Gen_Prod_Posting_Group,Blocked,Base_Unit_of_Measure",
          $orderby: "No asc",
        },
        { timeout: 120_000 },
      );
      const itemRows = items.map((i) => {
        const projectCode = extractProjectCode(i.No);
        return {
          id: i.No,
          number: i.No,
          displayName: i.Description,
          type: i.Type,
          inventory: i.Inventory,
          unitPrice: i.Unit_Price,
          unitCost: i.Unit_Cost,
          itemCategoryCode: i.Item_Category_Code,
          generalProductPostingGroupCode: i.Gen_Prod_Posting_Group,
          blocked: i.Blocked,
          baseUnitOfMeasure: i.Base_Unit_of_Measure,
          projectCode,
          projectName: projectCode ? dimMap[projectCode] || null : null,
          syncedAt: now,
        };
      });
      send("progress", {
        phase: "items",
        step: "saving",
        count: itemRows.length,
        label: `บันทึกสินค้า ${itemRows.length.toLocaleString()} รายการ...`,
      });
      await batchUpsert(supabase, "bcItems", itemRows, {
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
      const [orders, allLines] = await Promise.all([
        bcODataGet(
          "Sales_Order_Excel",
          {
            $filter: "startswith(No,'SO26')",
            $orderby: "No desc",
            $select:
              "No,Sell_to_Customer_No,Sell_to_Customer_Name,Sell_to_Address,Sell_to_City,Sell_to_Post_Code,Ship_to_Name,Ship_to_Address,Ship_to_City,Ship_to_Post_Code,Order_Date,Due_Date,Status,Completely_Shipped,Salesperson_Code,External_Document_No",
          },
          { timeout: 120_000 },
        ),
        bcODataGet(
          "Sales_Order_Line_Excel",
          {
            $filter: "startswith(Document_No,'SO26')",
            $select:
              "Document_No,Line_No,Type,No,Description,Quantity,Unit_Price,Line_Amount,Quantity_Shipped,BWK_Outstanding_Quantity,Unit_of_Measure_Code,Location_Code",
          },
          { timeout: 120_000 },
        ),
      ]);

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
          id: o.No,
          number: o.No,
          customerNumber: o.Sell_to_Customer_No,
          customerName: o.Sell_to_Customer_Name,
          sellToAddress: o.Sell_to_Address,
          sellToCity: o.Sell_to_City,
          sellToPostCode: o.Sell_to_Post_Code,
          shipToName: o.Ship_to_Name,
          shipToAddress: o.Ship_to_Address,
          shipToCity: o.Ship_to_City,
          shipToPostCode: o.Ship_to_Post_Code,
          orderDate: o.Order_Date || null,
          dueDate: o.Due_Date || null,
          status: o.Status,
          completelyShipped: o.Completely_Shipped,
          salespersonCode: o.Salesperson_Code,
          externalDocumentNumber: o.External_Document_No,
          totalAmountIncludingTax: amountByOrder[o.No] || 0,
          syncedAt: now,
        }));
        await batchUpsert(supabase, "bcSalesOrders", orderRows, {
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
            id: `${l.Document_No}-${l.Line_No}`,
            documentNo: l.Document_No,
            lineNo: l.Line_No,
            type: l.Type?.trim() || null,
            lineObjectNumber: l.No,
            description: l.Description,
            quantity: l.Quantity,
            unitPrice: l.Unit_Price,
            amountIncludingTax: l.Line_Amount,
            quantityShipped: l.Quantity_Shipped,
            bwkOutstandingQuantity: l.BWK_Outstanding_Quantity,
            unitOfMeasureCode: l.Unit_of_Measure_Code,
            locationCode: l.Location_Code?.trim() || null,
            projectCode,
            projectName: projectCode ? dimMap[projectCode] || null : null,
            syncedAt: now,
          };
        });
        await batchUpsert(supabase, "bcSalesOrderLines", lineRows, {
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

  // ═══ Phase 5: Cleanup ═══
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
          .from("bcCustomers")
          .select("*", { count: "exact", head: true })
          .lt("syncedAt", now);
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
          .from("bcCustomers")
          .delete({ count: "exact" })
          .lt("syncedAt", now);
        cleanup.customers = error ? `ERROR: ${error.message}` : count || 0;
      })(),
    );
  }

  if (syncSuccess.items) {
    cleanupParallel.push(
      (async () => {
        const { count: staleCount } = await supabase
          .from("bcItems")
          .select("*", { count: "exact", head: true })
          .lt("syncedAt", now);
        if (
          !isSafeToCleanup(results.items, results.items + (staleCount || 0))
        ) {
          cleanup.items = `SKIPPED: sync got ${results.items} but ${staleCount} would be deleted`;
          return;
        }
        const { count: deletedNoRfid, error: err1 } = await supabase
          .from("bcItems")
          .delete({ count: "exact" })
          .lt("syncedAt", now)
          .is("rfidCode", null);
        const { count: markedBlocked, error: err2 } = await supabase
          .from("bcItems")
          .update({ blocked: true, inventory: 0 })
          .lt("syncedAt", now)
          .not("rfidCode", "is", null);
        cleanup.items =
          err1 || err2
            ? `ERROR: ${(err1 || err2).message}`
            : {
                deleted: deletedNoRfid || 0,
                markedBlocked: markedBlocked || 0,
              };
      })(),
    );
  }

  await Promise.all(cleanupParallel);

  if (syncSuccess.salesOrderLines) {
    const { count: staleCount } = await supabase
      .from("bcSalesOrderLines")
      .select("*", { count: "exact", head: true })
      .lt("syncedAt", now);
    if (
      !isSafeToCleanup(
        results.salesOrderLines,
        results.salesOrderLines + (staleCount || 0),
      )
    ) {
      cleanup.salesOrderLines = `SKIPPED: sync got ${results.salesOrderLines} but ${staleCount} would be deleted`;
    } else {
      const { count, error } = await supabase
        .from("bcSalesOrderLines")
        .delete({ count: "exact" })
        .lt("syncedAt", now);
      cleanup.salesOrderLines = error
        ? `ERROR: ${error.message}`
        : count || 0;
    }
  }

  if (syncSuccess.salesOrders) {
    const { count: staleCount } = await supabase
      .from("bcSalesOrders")
      .select("*", { count: "exact", head: true })
      .lt("syncedAt", now);
    if (
      !isSafeToCleanup(
        results.salesOrders,
        results.salesOrders + (staleCount || 0),
      )
    ) {
      cleanup.salesOrders = `SKIPPED: sync got ${results.salesOrders} but ${staleCount} would be deleted`;
    } else {
      const { count, error } = await supabase
        .from("bcSalesOrders")
        .delete({ count: "exact" })
        .lt("syncedAt", now);
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
