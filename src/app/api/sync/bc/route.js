import { createClient } from "@supabase/supabase-js";
import { bcODataGet, bcApiGet } from "@/lib/bcClient";

export const maxDuration = 300;

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

const ALL_TABLES = ["dimensionValues", "customers", "items", "salesOrders", "salesOrderLines"];

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

  // รับ tables ที่ต้องการ sync จาก query param (ถ้าไม่ระบุ = sync ทั้งหมด)
  const url = new URL(request.url);
  const tablesParam = url.searchParams.get("tables");
  const requestedTables = tablesParam
    ? tablesParam.split(",").filter((t) => ALL_TABLES.includes(t))
    : ALL_TABLES;

  const shouldSync = (table) => requestedTables.includes(table);

  // dimensionValues ต้อง fetch เสมอถ้า sync items หรือ salesOrderLines (ใช้ map project)
  const needDims = shouldSync("dimensionValues") || shouldSync("items") || shouldSync("salesOrderLines");
  // salesOrders กับ salesOrderLines ต้อง fetch คู่กัน (คำนวณ totalAmount)
  const needOrders = shouldSync("salesOrders");
  const needLines = shouldSync("salesOrderLines");

  const now = new Date().toISOString();
  const results = {};
  const syncSuccess = {};

  // ═══ Phase 1: Dimension Values (ต้อง fetch ก่อนเพราะใช้ map project) ═══
  let dimMap = {};
  if (needDims) {
    try {
      const dims = await bcApiGet("dimensionValues", { $select: "code,displayName" });
      for (const d of dims) {
        if (d.code) dimMap[d.code] = d.displayName || d.code;
      }
      if (shouldSync("dimensionValues")) {
        results.dimensionValues = dims.length;
      }
    } catch (e) {
      if (shouldSync("dimensionValues")) {
        results.dimensionValues = `ERROR: ${e.message}`;
      }
    }
  }

  // ═══ Phase 2: Customers ═══
  if (shouldSync("customers")) {
    try {
      const customers = await bcODataGet("CustomerList", {
        $select: "No,Name,Phone_No,Contact,Balance_Due_LCY,Balance_LCY,Salesperson_Code",
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
      await batchUpsert(supabase, "bcCustomers", customerRows);
      results.customers = customerRows.length;
      syncSuccess.customers = true;
    } catch (e) {
      results.customers = `ERROR: ${e.message}`;
    }
  }

  // ═══ Phase 3: Items (สินค้า) ═══
  if (shouldSync("items")) {
    try {
      const items = await bcODataGet("Item_Card_Excel", {
        $filter: "Blocked eq false and Inventory gt 0",
        $select: "No,Description,Type,Inventory,Unit_Price,Unit_Cost,Item_Category_Code,Gen_Prod_Posting_Group,Blocked,Base_Unit_of_Measure",
        $orderby: "No asc",
      });
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
          projectName: projectCode ? (dimMap[projectCode] || null) : null,
          syncedAt: now,
        };
      });
      await batchUpsert(supabase, "bcItems", itemRows);
      results.items = itemRows.length;
      syncSuccess.items = true;
    } catch (e) {
      results.items = `ERROR: ${e.message}`;
    }
  }

  // ═══ Phase 4: Sales Orders + Lines (fetch คู่กันเพราะต้องคำนวณ totalAmount) ═══
  if (needOrders || needLines) {
    try {
      // Fetch orders and lines in parallel (ข้อมูลเกี่ยวข้องกันต้อง fetch พร้อมกัน)
      const [orders, allLines] = await Promise.all([
        bcODataGet("Sales_Order_Excel", {
          $filter: "startswith(No,'SO26')",
          $orderby: "No desc",
          $select: "No,Sell_to_Customer_No,Sell_to_Customer_Name,Sell_to_Address,Sell_to_City,Sell_to_Post_Code,Ship_to_Name,Ship_to_Address,Ship_to_City,Ship_to_Post_Code,Order_Date,Due_Date,Status,Completely_Shipped,Salesperson_Code,External_Document_No",
        }),
        bcODataGet("Sales_Order_Line_Excel", {
          $filter: "startswith(Document_No,'SO26')",
          $select: "Document_No,Line_No,Type,No,Description,Quantity,Unit_Price,Line_Amount,Quantity_Shipped,BWK_Outstanding_Quantity,Unit_of_Measure_Code,Location_Code",
        }),
      ]);

      const amountByOrder = {};
      for (const l of allLines) {
        amountByOrder[l.Document_No] = (amountByOrder[l.Document_No] || 0) + (l.Line_Amount || 0);
      }

      if (shouldSync("salesOrders")) {
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
        await batchUpsert(supabase, "bcSalesOrders", orderRows);
        results.salesOrders = orderRows.length;
        syncSuccess.salesOrders = true;
      }

      if (shouldSync("salesOrderLines")) {
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
            projectName: projectCode ? (dimMap[projectCode] || null) : null,
            syncedAt: now,
          };
        });
        await batchUpsert(supabase, "bcSalesOrderLines", lineRows);
        results.salesOrderLines = lineRows.length;
        syncSuccess.salesOrderLines = true;
      }
    } catch (e) {
      if (shouldSync("salesOrders") && !results.salesOrders) {
        results.salesOrders = `ERROR: ${e.message}`;
      }
      if (shouldSync("salesOrderLines") && !results.salesOrderLines) {
        results.salesOrderLines = `ERROR: ${e.message}`;
      }
    }
  }

  // ═══ Phase 5: Stale data cleanup ═══
  const cleanup = {};

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

  if (syncSuccess.salesOrderLines) {
    const { count, error } = await supabase
      .from("bcSalesOrderLines")
      .delete({ count: "exact" })
      .lt("syncedAt", now);
    cleanup.salesOrderLines = error ? `ERROR: ${error.message}` : (count || 0);
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
