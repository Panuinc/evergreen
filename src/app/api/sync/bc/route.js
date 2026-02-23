import { createClient } from "@supabase/supabase-js";
import { bcODataGet, bcApiGet } from "@/lib/bcClient";

function extractProjectCode(itemNo) {
  if (!itemNo) return null;
  const parts = itemNo.split("-");
  if (parts.length >= 2) return parts[1];
  return null;
}

// Upsert แบบแบ่ง batch เพื่อไม่ให้ Supabase timeout
async function batchUpsert(supabase, table, rows, batchSize = 500) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict: "id" });
    if (error) throw error;
  }
}

export async function GET(request) {
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const now = new Date().toISOString();
  const results = {};
  const syncSuccess = {
    customers: false,
    items: false,
    salesOrders: false,
    salesOrderLines: false,
  };

  // ═══ Phase 1: Fetch ข้อมูลทั้ง 5 ชุดจาก BC พร้อมกัน ═══
  const [dimsResult, customersResult, itemsResult, ordersResult, linesResult] =
    await Promise.allSettled([
      bcApiGet("dimensionValues", {
        $select: "code,displayName",
      }),
      bcODataGet("CustomerList", {
        $select:
          "No,Name,Phone_No,Contact,Balance_Due_LCY,Balance_LCY,Salesperson_Code",
        $orderby: "No asc",
      }),
      bcODataGet("Item_Card_Excel", {
        $filter: "Blocked eq false",
        $select:
          "No,Description,Type,Inventory,Unit_Price,Unit_Cost,Item_Category_Code,Gen_Prod_Posting_Group,Blocked,Base_Unit_of_Measure",
        $orderby: "No asc",
      }),
      bcODataGet("Sales_Order_Excel", {
        $filter: "startswith(No,'SO26')",
        $orderby: "No desc",
        $select:
          "No,Sell_to_Customer_No,Sell_to_Customer_Name,Sell_to_Address,Sell_to_City,Sell_to_Post_Code,Ship_to_Name,Ship_to_Address,Ship_to_City,Ship_to_Post_Code,Order_Date,Due_Date,Status,Completely_Shipped,Salesperson_Code,External_Document_No",
      }),
      bcODataGet("Sales_Order_Line_Excel", {
        $filter: "startswith(Document_No,'SO26')",
        $select:
          "Document_No,Line_No,Type,No,Description,Quantity,Unit_Price,Line_Amount,Quantity_Shipped,BWK_Outstanding_Quantity,Unit_of_Measure_Code,Location_Code",
      }),
    ]);

  // ═══ Phase 2: Build dimMap สำหรับ project mapping ═══
  let dimMap = {};
  if (dimsResult.status === "fulfilled") {
    for (const d of dimsResult.value) {
      if (d.code) dimMap[d.code] = d.displayName || d.code;
    }
    results.dimensionValues = dimsResult.value.length;
  } else {
    results.dimensionValues = `ERROR: ${dimsResult.reason?.message}`;
  }

  // ═══ Phase 3: Transform + Upsert ทุกตารางพร้อมกัน ═══
  const upsertTasks = [];

  // --- Customers ---
  if (customersResult.status === "fulfilled") {
    const customerRows = customersResult.value.map((c) => ({
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
    upsertTasks.push(
      batchUpsert(supabase, "bcCustomers", customerRows)
        .then(() => {
          results.customers = customerRows.length;
          syncSuccess.customers = true;
        })
        .catch((e) => {
          results.customers = `ERROR: ${e.message}`;
        }),
    );
  } else {
    results.customers = `ERROR: ${customersResult.reason?.message}`;
  }

  // --- Items ---
  if (itemsResult.status === "fulfilled") {
    const itemRows = itemsResult.value.map((i) => {
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
        projectCode: projectCode,
        projectName: projectCode ? (dimMap[projectCode] || null) : null,
        syncedAt: now,
      };
    });
    upsertTasks.push(
      batchUpsert(supabase, "bcItems", itemRows)
        .then(() => {
          results.items = itemRows.length;
          syncSuccess.items = true;
        })
        .catch((e) => {
          results.items = `ERROR: ${e.message}`;
        }),
    );
  } else {
    results.items = `ERROR: ${itemsResult.reason?.message}`;
  }

  // --- Sales Orders + Lines ---
  if (
    ordersResult.status === "fulfilled" &&
    linesResult.status === "fulfilled"
  ) {
    const orders = ordersResult.value;
    const allLines = linesResult.value;

    // คำนวณ totalAmount per order จาก lines
    const amountByOrder = {};
    for (const l of allLines) {
      amountByOrder[l.Document_No] =
        (amountByOrder[l.Document_No] || 0) + (l.Line_Amount || 0);
    }

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
        projectCode: projectCode,
        projectName: projectCode ? (dimMap[projectCode] || null) : null,
        syncedAt: now,
      };
    });

    // Upsert orders + lines พร้อมกัน (คนละตาราง)
    upsertTasks.push(
      batchUpsert(supabase, "bcSalesOrders", orderRows)
        .then(() => {
          results.salesOrders = orderRows.length;
          syncSuccess.salesOrders = true;
        })
        .catch((e) => {
          results.salesOrders = `ERROR: ${e.message}`;
        }),
    );
    upsertTasks.push(
      batchUpsert(supabase, "bcSalesOrderLines", lineRows)
        .then(() => {
          results.salesOrderLines = lineRows.length;
          syncSuccess.salesOrderLines = true;
        })
        .catch((e) => {
          results.salesOrderLines = `ERROR: ${e.message}`;
        }),
    );
  } else {
    if (ordersResult.status === "rejected") {
      results.salesOrders = `ERROR: ${ordersResult.reason?.message}`;
    }
    if (linesResult.status === "rejected") {
      results.salesOrderLines = `ERROR: ${linesResult.reason?.message}`;
    }
  }

  // รอ upsert ทุกตารางเสร็จ
  await Promise.all(upsertTasks);

  // ═══ Phase 4: Stale data cleanup — ลบ record ที่ไม่มีใน BC แล้ว ═══
  const cleanup = {};

  // Cleanup customers + items พร้อมกัน (ไม่มี dependency)
  const cleanupParallel = [];
  if (syncSuccess.customers) {
    cleanupParallel.push(
      supabase
        .from("bcCustomers")
        .delete({ count: "exact" })
        .lt("syncedAt", now)
        .then(({ count, error }) => {
          cleanup.customers = error ? `ERROR: ${error.message}` : (count || 0);
        }),
    );
  }
  if (syncSuccess.items) {
    cleanupParallel.push(
      supabase
        .from("bcItems")
        .delete({ count: "exact" })
        .lt("syncedAt", now)
        .then(({ count, error }) => {
          cleanup.items = error ? `ERROR: ${error.message}` : (count || 0);
        }),
    );
  }
  await Promise.all(cleanupParallel);

  // ลบ lines ก่อน orders (child → parent)
  if (syncSuccess.salesOrderLines) {
    const { count, error } = await supabase
      .from("bcSalesOrderLines")
      .delete({ count: "exact" })
      .lt("syncedAt", now);
    cleanup.salesOrderLines = error
      ? `ERROR: ${error.message}`
      : (count || 0);
  }
  if (syncSuccess.salesOrders) {
    const { count, error } = await supabase
      .from("bcSalesOrders")
      .delete({ count: "exact" })
      .lt("syncedAt", now);
    cleanup.salesOrders = error ? `ERROR: ${error.message}` : (count || 0);
  }

  return Response.json({ ok: true, syncedAt: now, results, cleanup });
}
