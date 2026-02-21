import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  // Try bcSalesOrders first, fall back to bcSalesOrderHeaders
  let tableName = "bcSalesOrders";
  let linesTable = "bcSalesOrderLines";

  let query = supabase.from(tableName).select("*");

  if (type) {
    query = query.eq("documentType", type);
  }

  let { data, error } = await query.order("orderDate", { ascending: false });

  // Fall back to bcSalesOrderHeaders if bcSalesOrders doesn't exist
  if (error && error.message.includes("does not exist")) {
    tableName = "bcSalesOrderHeaders";
    query = supabase.from(tableName).select("*");

    if (type) {
      query = query.eq("documentType", type);
    }

    const result = await query.order("orderDate", { ascending: false });
    data = result.data;
    error = result.error;
  }

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Try to include related lines for each order
  if (data && data.length > 0) {
    const orderNumbers = data.map((o) => o.number || o.no).filter(Boolean);

    if (orderNumbers.length > 0) {
      const { data: lines } = await supabase
        .from(linesTable)
        .select("*")
        .in("documentNo", orderNumbers);

      if (lines) {
        const linesByOrder = {};
        lines.forEach((line) => {
          const key = line.documentNo;
          if (!linesByOrder[key]) linesByOrder[key] = [];
          linesByOrder[key].push(line);
        });

        data = data.map((order) => ({
          ...order,
          lines: linesByOrder[order.number || order.no] || [],
        }));
      }
    }
  }

  return Response.json(data);
}
