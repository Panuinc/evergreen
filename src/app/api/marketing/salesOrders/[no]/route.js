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

  // Map Supabase camelCase → OData-style field names (frontend uses OData names)
  const mappedOrder = {
    No: order.bcSalesOrderNumber,
    Sell_to_Customer_No: order.bcSalesOrderCustomerNumber,
    Sell_to_Customer_Name: order.bcSalesOrderCustomerName,
    Sell_to_Address: order.bcSalesOrderSellToAddress,
    Sell_to_City: order.bcSalesOrderSellToCity,
    Sell_to_Post_Code: order.bcSalesOrderSellToPostCode,
    Ship_to_Name: order.bcSalesOrderShipToName,
    Ship_to_Address: order.bcSalesOrderShipToAddress,
    Ship_to_City: order.bcSalesOrderShipToCity,
    Ship_to_Post_Code: order.bcSalesOrderShipToPostCode,
    Order_Date: order.bcSalesOrderOrderDate,
    Due_Date: order.bcSalesOrderDueDate,
    Status: order.bcSalesOrderStatus,
    Completely_Shipped: order.bcSalesOrderCompletelyShipped,
    External_Document_No: order.bcSalesOrderExternalDocumentNumber,
    Salesperson_Code: order.bcSalesOrderSalespersonCode,
  };

  const lines = (rawLines || []).map((l) => ({
    Document_No: l.bcSalesOrderLineDocumentNo,
    Line_No: l.bcSalesOrderLineLineNo,
    Type: l.bcSalesOrderLineType,
    No: l.bcSalesOrderLineObjectNumber,
    Description: l.bcSalesOrderLineDescription,
    Quantity: l.bcSalesOrderLineQuantity,
    Unit_Price: l.bcSalesOrderLineUnitPrice,
    Line_Amount: l.bcSalesOrderLineAmountIncludingTax,
    Quantity_Shipped: l.bcSalesOrderLineQuantityShipped,
    BWK_Outstanding_Quantity: l.bcSalesOrderLineOutstandingQuantity,
    Unit_of_Measure_Code: l.bcSalesOrderLineUnitOfMeasureCode,
    Location_Code: l.bcSalesOrderLineLocationCode,
    projectCode: l.bcSalesOrderLineProjectCode,
    projectName: l.bcSalesOrderLineProjectName,
  }));

  const totalAmount = lines.reduce((s, l) => s + (l.Line_Amount || 0), 0);
  const totalQty = lines.reduce((s, l) => s + (l.Quantity || 0), 0);
  const shippedQty = lines.reduce((s, l) => s + (l.Quantity_Shipped || 0), 0);

  // Customer phone from bcCustomer cache
  const { data: custRows } = await auth.supabase
    .from("bcCustomer")
    .select("bcCustomerPhoneNumber")
    .eq("bcCustomerNumber", order.bcSalesOrderCustomerNumber)
    .limit(1);
  const customerPhone = custRows?.[0]?.bcCustomerPhoneNumber || "";

  return Response.json({
    order: { ...mappedOrder, lines, totalAmount, totalQty, shippedQty },
    customerPhone,
  });
}
