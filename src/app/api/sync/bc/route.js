import { createClient } from "@supabase/supabase-js";
import { bcODataGet } from "@/lib/bcClient";

export async function GET(request) {
  // Dev mode: skip auth check / Production: verify Vercel Cron secret
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Service role client — bypasses RLS, ไม่ต้องการ user session
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const now = new Date().toISOString();
  const results = {};

  try {
    // 1. Customers
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
    const { error: cErr } = await supabase
      .from("bcCustomers")
      .upsert(customerRows, { onConflict: "id" });
    results.customers = cErr ? `ERROR: ${cErr.message}` : customerRows.length;
  } catch (e) {
    results.customers = `ERROR: ${e.message}`;
  }

  try {
    // 2. Items
    const items = await bcODataGet("Item_Card_Excel", {
      $filter: "Blocked eq false",
      $select:
        "No,Description,Type,Inventory,Unit_Price,Unit_Cost,Item_Category_Code,Gen_Prod_Posting_Group,Blocked,Base_Unit_of_Measure",
      $orderby: "No asc",
    });
    const itemRows = items.map((i) => ({
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
      syncedAt: now,
    }));
    const { error: iErr } = await supabase
      .from("bcItems")
      .upsert(itemRows, { onConflict: "id" });
    results.items = iErr ? `ERROR: ${iErr.message}` : itemRows.length;
  } catch (e) {
    results.items = `ERROR: ${e.message}`;
  }

  try {
    // 3. Sales Orders + Lines (SO26 = ปี 2026)
    const [orders, allLines] = await Promise.all([
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

    // คำนวณ totalAmountIncludingTax per order จาก lines
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
    const { error: oErr } = await supabase
      .from("bcSalesOrders")
      .upsert(orderRows, { onConflict: "id" });
    results.salesOrders = oErr ? `ERROR: ${oErr.message}` : orderRows.length;

    // เก็บทุก line รวมถึง comment lines (No เป็น "" แต่ Description มีข้อมูล เช่น ที่อยู่ เบอร์โทร)
    const lineRows = allLines.map((l) => ({
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
        syncedAt: now,
      }));
    const { error: lErr } = await supabase
      .from("bcSalesOrderLines")
      .upsert(lineRows, { onConflict: "id" });
    results.salesOrderLines = lErr
      ? `ERROR: ${lErr.message}`
      : lineRows.length;
  } catch (e) {
    results.salesOrders = `ERROR: ${e.message}`;
    results.salesOrderLines = `ERROR: ${e.message}`;
  }

  return Response.json({ ok: true, syncedAt: now, results });
}
