import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { no } = await params;
  const orderNo = decodeURIComponent(no);

  const [{ data: orders, error: oErr }, { data: rawLines, error: lErr }] =
    await Promise.all([
      auth.supabase.from("bcSalesOrder").select("*").eq("bcSalesOrderNumber", orderNo),
      auth.supabase
        .from("bcSalesOrderLine")
        .select("*")
        .eq("bcSalesOrderLineDocumentNo", orderNo),
    ]);

  if (oErr || lErr)
    return Response.json({ error: "DB error" }, { status: 500 });

  const order = orders?.[0];
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

  const lines = rawLines || [];

  const totalAmount = lines.reduce((s, l) => s + (l.bcSalesOrderLineAmount || 0), 0);
  const totalQty = lines.reduce((s, l) => s + (l.bcSalesOrderLineQuantity || 0), 0);
  const shippedQty = lines.reduce((s, l) => s + (l.bcSalesOrderLineQuantityShipped || 0), 0);

  // Customer phone from bcCustomer cache
  const { data: custRows } = await auth.supabase
    .from("bcCustomer")
    .select("bcCustomerPhoneNumber")
    .eq("bcCustomerNumber", order.bcSalesOrderCustomerNumber)
    .limit(1);
  const customerPhone = custRows?.[0]?.bcCustomerPhoneNumber || "";

  return Response.json({
    order: { ...order, lines, totalAmount, totalQty, shippedQty },
    customerPhone,
  });
}
