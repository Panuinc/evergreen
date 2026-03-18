import { withAuth } from "@/app/api/_lib/auth";

async function fetchAllLines(supabase) {
  const allLines = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("bcSalesOrderLine")
      .select("*")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (data && data.length > 0) allLines.push(...data);
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return allLines;
}

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const [{ data: orders, error: oErr }, lines] = await Promise.all([
    auth.supabase
      .from("bcSalesOrder")
      .select("*")
      .order("bcSalesOrderNoValue", { ascending: false }),
    fetchAllLines(auth.supabase).catch(() => null),
  ]);

  if (oErr || lines === null)
    return Response.json({ error: "DB error" }, { status: 500 });

  const linesByOrder = {};
  for (const line of lines) {
    if (!linesByOrder[line.bcSalesOrderLineDocumentNo]) linesByOrder[line.bcSalesOrderLineDocumentNo] = [];
    linesByOrder[line.bcSalesOrderLineDocumentNo].push(line);
  }

  const result = (orders || []).map((o) => ({
    ...o,
    salesOrderLines: linesByOrder[o.bcSalesOrderNoValue] || [],
  }));

  return Response.json(result);
}
