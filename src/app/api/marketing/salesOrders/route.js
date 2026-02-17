import { withAuth } from "@/app/api/_lib/auth";
import { bcODataGet } from "@/lib/bcClient";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const [orders, lines] = await Promise.all([
      bcODataGet("Sales_Order_Excel", {
        $filter: "Salesperson_Code eq 'ONLINE' and startswith(No,'SO26')",
        $orderby: "Order_Date desc",
        $select:
          "No,Sell_to_Customer_No,Sell_to_Customer_Name,Order_Date,Status,Completely_Shipped,External_Document_No",
      }),
      bcODataGet("Sales_Order_Line_Excel", {
        $filter: "startswith(Document_No,'SO26')",
        $select: "Document_No,Line_Amount",
      }),
    ]);

    // Compute totalAmount per order from lines
    const amountByOrder = {};
    for (const l of lines) {
      amountByOrder[l.Document_No] = (amountByOrder[l.Document_No] || 0) + (l.Line_Amount || 0);
    }

    const result = orders.map((o) => ({
      ...o,
      totalAmount: amountByOrder[o.No] || 0,
    }));

    return Response.json({ orders: result });
  } catch (error) {
    console.error("[Sales Orders List] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
