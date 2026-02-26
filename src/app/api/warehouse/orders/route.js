import { withAuth } from "@/app/api/_lib/auth";

function formatOrder(o) {
  return {
    number: o.bcSalesOrderNumber,
    documentType: o.bcSalesOrderDocumentType,
    sellToCustomerName: o.bcSalesOrderCustomerName,
    sellToCustomerNo: o.bcSalesOrderCustomerNumber,
    orderDate: o.bcSalesOrderDate,
    status: o.bcSalesOrderStatus,
    Completely_Shipped: o.bcSalesOrderCompletelyShipped,
    totalAmountIncVat: o.bcSalesOrderTotalAmountIncVat,
    salespersonCode: o.bcSalesOrderSalespersonCode,
    lines: (o.lines || []).map(formatOrderLine),
  };
}

function formatOrderLine(l) {
  return {
    number: l.bcSalesOrderLineNo,
    documentNo: l.bcSalesOrderLineDocumentNo,
    description: l.bcSalesOrderLineDescription,
    quantity: l.bcSalesOrderLineQuantity,
    unitPrice: l.bcSalesOrderLineUnitPrice,
    amount: l.bcSalesOrderLineAmount,
    amountIncVat: l.bcSalesOrderLineAmount,
  };
}

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  // Try bcSalesOrder first, fall back to bcSalesOrderHeaders
  let tableName = "bcSalesOrder";
  let linesTable = "bcSalesOrderLine";

  let query = supabase.from(tableName).select("*");

  if (type) {
    query = query.eq("bcSalesOrderDocumentType", type);
  }

  let { data, error } = await query.order("bcSalesOrderDate", { ascending: false });

  // Fall back to bcSalesOrderHeaders if bcSalesOrder doesn't exist
  if (error && error.message.includes("does not exist")) {
    tableName = "bcSalesOrderHeaders";
    query = supabase.from(tableName).select("*");

    if (type) {
      query = query.eq("bcSalesOrderDocumentType", type);
    }

    const result = await query.order("bcSalesOrderDate", { ascending: false });
    data = result.data;
    error = result.error;
  }

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Try to include related lines for each order
  if (data && data.length > 0) {
    const orderNumbers = data.map((o) => o.bcSalesOrderNumber || o.no).filter(Boolean);

    if (orderNumbers.length > 0) {
      const { data: lines } = await supabase
        .from(linesTable)
        .select("*")
        .in("bcSalesOrderLineDocumentNo", orderNumbers);

      if (lines) {
        const linesByOrder = {};
        lines.forEach((line) => {
          const key = line.bcSalesOrderLineDocumentNo;
          if (!linesByOrder[key]) linesByOrder[key] = [];
          linesByOrder[key].push(line);
        });

        data = data.map((order) => ({
          ...order,
          lines: linesByOrder[order.bcSalesOrderNumber || order.no] || [],
        }));
      }
    }
  }

  return Response.json(data.map(formatOrder));
}
