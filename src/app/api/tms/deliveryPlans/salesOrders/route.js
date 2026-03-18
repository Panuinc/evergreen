import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  let query = supabase
    .from("bcSalesOrder")
    .select(
      "bcSalesOrderNoValue, bcSalesOrderSellToCustomerName, bcSalesOrderDueDate, bcSalesOrderStatus, bcSalesOrderAmountIncludingVAT"
    )
    .eq("bcSalesOrderCompletelyShipped", false);

  if (search) {
    query = query.or(
      `bcSalesOrderNoValue.ilike.%${search}%,bcSalesOrderSellToCustomerName.ilike.%${search}%`
    );
  }

  const { data, error } = await query
    .order("bcSalesOrderDueDate", { ascending: true })
    .limit(50);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
