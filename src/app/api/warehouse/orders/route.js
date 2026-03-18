import { withAuth } from "@/app/api/_lib/auth";

function formatOrder(o) {
  return {
    number: o.bcSalesOrderNoValue,
    sellToCustomerName: o.bcSalesOrderSellToCustomerName,
    sellToCustomerNo: o.bcSalesOrderSellToCustomerNo,
    orderDate: o.bcSalesOrderOrderDate,
    status: o.bcSalesOrderStatus,
    Completely_Shipped: o.bcSalesOrderCompletelyShipped,
    totalAmountIncVat: o.bcSalesOrderAmountIncludingVAT,
    salespersonCode: o.bcSalesOrderSalespersonCode,
    lines: (o.lines || []).map(formatOrderLine),
  };
}

function formatOrderLine(l) {
  return {
    number: l.bcSalesOrderLineLineNo,
    documentNo: l.bcSalesOrderLineDocumentNo,
    description: l.bcSalesOrderLineDescriptionValue,
    quantity: l.bcSalesOrderLineQuantityValue,
    unitPrice: l.bcSalesOrderLineUnitPrice,
    amount: l.bcSalesOrderLineAmountValue,
    amountIncVat: l.bcSalesOrderLineAmountValue,
  };
}

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  let tableName = "bcSalesOrder";
  let linesTable = "bcSalesOrderLine";

  let query = supabase.from(tableName).select("*");

  let { data, error } = await query.order("bcSalesOrderOrderDate", { ascending: false });


  if (error && error.message.includes("does not exist")) {
    tableName = "bcSalesOrderHeaders";
    query = supabase.from(tableName).select("*");

    const result = await query.order("bcSalesOrderOrderDate", { ascending: false });
    data = result.data;
    error = result.error;
  }

  if (error) return Response.json({ error: error.message }, { status: 500 });


  if (data && data.length > 0) {
    const orderNumbers = data.map((o) => o.bcSalesOrderNoValue || o.no).filter(Boolean);

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
          lines: linesByOrder[order.bcSalesOrderNoValue || order.no] || [],
        }));
      }
    }
  }

  return Response.json(data.map(formatOrder));
}
