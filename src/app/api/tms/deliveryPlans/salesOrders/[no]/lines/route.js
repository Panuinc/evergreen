import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { no } = await params;

  const { data, error } = await supabase
    .from("bcSalesOrderLine")
    .select(
      "bcSalesOrderLineNo, bcSalesOrderLineObjectNumber, bcSalesOrderLineDescription, bcSalesOrderLineQuantity, bcSalesOrderLineQuantityShipped, bcSalesOrderLineOutstandingQuantity, bcSalesOrderLineUnitOfMeasureCode, bcSalesOrderLineUnitPrice, bcSalesOrderLineAmount"
    )
    .eq("bcSalesOrderLineDocumentNo", no)
    .eq("bcSalesOrderLineType", "Item")
    .gt("bcSalesOrderLineOutstandingQuantity", 0)
    .order("bcSalesOrderLineNo", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
