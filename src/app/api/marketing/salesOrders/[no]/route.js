import { withAuth } from "@/app/api/_lib/auth";
import { bcODataGet } from "@/lib/bcClient";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { no } = await params;
  const orderNo = decodeURIComponent(no);

  try {
    const [orders, lines] = await Promise.all([
      bcODataGet("Sales_Order_Excel", {
        $filter: `No eq '${orderNo}'`,
        $select:
          "No,Sell_to_Customer_No,Sell_to_Customer_Name,Sell_to_Address,Sell_to_City,Sell_to_Post_Code,Ship_to_Name,Ship_to_Address,Ship_to_City,Ship_to_Post_Code,Order_Date,Due_Date,Status,Completely_Shipped,External_Document_No,Salesperson_Code",
      }),
      bcODataGet("Sales_Order_Line_Excel", {
        $filter: `Document_No eq '${orderNo}'`,
        $select:
          "Document_No,Line_No,Type,No,Description,Quantity,Unit_Price,Line_Amount,Quantity_Shipped,BWK_Outstanding_Quantity,Unit_of_Measure_Code,Location_Code",
      }),
    ]);

    const order = orders[0];
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const totalAmount = lines.reduce((s, l) => s + (l.Line_Amount || 0), 0);
    const totalQty = lines.reduce((s, l) => s + (l.Quantity || 0), 0);
    const shippedQty = lines.reduce((s, l) => s + (l.Quantity_Shipped || 0), 0);

    // Fetch customer phone
    let customerPhone = "";
    try {
      const customers = await bcODataGet("CustomerList", {
        $filter: `No eq '${order.Sell_to_Customer_No}'`,
        $select: "No,Phone_No",
      });
      customerPhone = customers[0]?.Phone_No || "";
    } catch {}

    return Response.json({
      order: { ...order, lines, totalAmount, totalQty, shippedQty },
      customerPhone,
    });
  } catch (error) {
    console.error("[Sales Order Detail] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
