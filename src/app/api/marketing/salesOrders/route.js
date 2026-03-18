import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { data: orders, error } = await auth.supabase
    .from("bcSalesOrder")
    .select("*")
    .eq("bcSalesOrderSalespersonCode", "ONLINE")
    .order("bcSalesOrderOrderDate", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ orders: orders || [] });
}
