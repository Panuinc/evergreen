import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { data: orders, error } = await auth.supabase
    .from("bcSalesOrders")
    .select(
      "number,customerNumber,customerName,orderDate,status,completelyShipped,externalDocumentNumber,totalAmountIncludingTax,salespersonCode",
    )
    .eq("salespersonCode", "ONLINE")
    .order("orderDate", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Map Supabase camelCase fields back to OData-style names expected by frontend
  const result = (orders || []).map((o) => ({
    No: o.number,
    Sell_to_Customer_No: o.customerNumber,
    Sell_to_Customer_Name: o.customerName,
    Order_Date: o.orderDate,
    Status: o.status,
    Completely_Shipped: o.completelyShipped,
    External_Document_No: o.externalDocumentNumber,
    totalAmount: o.totalAmountIncludingTax,
  }));

  return Response.json({ orders: result });
}
