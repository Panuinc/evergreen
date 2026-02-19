import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { no } = await params;
  const orderNo = decodeURIComponent(no);

  const [{ data: orders, error: oErr }, { data: rawLines, error: lErr }] =
    await Promise.all([
      auth.supabase.from("bcSalesOrders").select("*").eq("number", orderNo),
      auth.supabase
        .from("bcSalesOrderLines")
        .select("*")
        .eq("documentNo", orderNo),
    ]);

  if (oErr || lErr)
    return Response.json({ error: "DB error" }, { status: 500 });

  const order = orders?.[0];
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

  // Map Supabase camelCase → OData-style field names (frontend ใช้ OData names)
  const mappedOrder = {
    No: order.number,
    Sell_to_Customer_No: order.customerNumber,
    Sell_to_Customer_Name: order.customerName,
    Sell_to_Address: order.sellToAddress,
    Sell_to_City: order.sellToCity,
    Sell_to_Post_Code: order.sellToPostCode,
    Ship_to_Name: order.shipToName,
    Ship_to_Address: order.shipToAddress,
    Ship_to_City: order.shipToCity,
    Ship_to_Post_Code: order.shipToPostCode,
    Order_Date: order.orderDate,
    Due_Date: order.dueDate,
    Status: order.status,
    Completely_Shipped: order.completelyShipped,
    External_Document_No: order.externalDocumentNumber,
    Salesperson_Code: order.salespersonCode,
  };

  const lines = (rawLines || []).map((l) => ({
    Document_No: l.documentNo,
    Line_No: l.lineNo,
    Type: l.type,
    No: l.lineObjectNumber,
    Description: l.description,
    Quantity: l.quantity,
    Unit_Price: l.unitPrice,
    Line_Amount: l.amountIncludingTax,
    Quantity_Shipped: l.quantityShipped,
    BWK_Outstanding_Quantity: l.bwkOutstandingQuantity,
    Unit_of_Measure_Code: l.unitOfMeasureCode,
    Location_Code: l.locationCode,
  }));

  const totalAmount = lines.reduce((s, l) => s + (l.Line_Amount || 0), 0);
  const totalQty = lines.reduce((s, l) => s + (l.Quantity || 0), 0);
  const shippedQty = lines.reduce((s, l) => s + (l.Quantity_Shipped || 0), 0);

  // Customer phone จาก bcCustomers cache
  const { data: custRows } = await auth.supabase
    .from("bcCustomers")
    .select("phoneNumber")
    .eq("number", order.customerNumber)
    .limit(1);
  const customerPhone = custRows?.[0]?.phoneNumber || "";

  return Response.json({
    order: { ...mappedOrder, lines, totalAmount, totalQty, shippedQty },
    customerPhone,
  });
}
