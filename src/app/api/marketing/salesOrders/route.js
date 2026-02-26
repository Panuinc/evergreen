import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { data: orders, error } = await auth.supabase
    .from("bcSalesOrder")
    .select(
      "bcSalesOrderNumber,bcSalesOrderCustomerNumber,bcSalesOrderCustomerName,bcSalesOrderDate,bcSalesOrderStatus,bcSalesOrderCompletelyShipped,bcSalesOrderExternalDocumentNumber,bcSalesOrderTotalAmountIncVat,bcSalesOrderSalespersonCode",
    )
    .eq("bcSalesOrderSalespersonCode", "ONLINE")
    .order("bcSalesOrderDate", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Map Supabase camelCase fields back to OData-style names expected by frontend
  const result = (orders || []).map((o) => ({
    No: o.bcSalesOrderNumber,
    Sell_to_Customer_No: o.bcSalesOrderCustomerNumber,
    Sell_to_Customer_Name: o.bcSalesOrderCustomerName,
    Order_Date: o.bcSalesOrderDate,
    Status: o.bcSalesOrderStatus,
    Completely_Shipped: o.bcSalesOrderCompletelyShipped,
    External_Document_No: o.bcSalesOrderExternalDocumentNumber,
    totalAmount: o.bcSalesOrderTotalAmountIncVat,
  }));

  return Response.json({ orders: result });
}
