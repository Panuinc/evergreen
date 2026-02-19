import { withAuth } from "@/app/api/_lib/auth";
import { bcODataGet } from "@/lib/bcClient";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const [orders, allLines] = await Promise.all([
      bcODataGet("Sales_Order_Excel", {
        $filter: "startswith(No,'SO26')",
        $orderby: "No desc",
        $select:
          "No,Sell_to_Customer_No,Sell_to_Customer_Name,Order_Date,Due_Date,Status,Completely_Shipped,Salesperson_Code,External_Document_No",
      }),
      bcODataGet("Sales_Order_Line_Excel", {
        $filter: "startswith(Document_No,'SO26')",
        $select:
          "Document_No,No,Description,Quantity,Unit_Price,Line_Amount,Quantity_Shipped,Unit_of_Measure_Code",
      }),
    ]);

    const linesByOrder = {};
    for (const line of allLines) {
      if (!linesByOrder[line.Document_No]) linesByOrder[line.Document_No] = [];
      linesByOrder[line.Document_No].push({
        id: `${line.Document_No}-${line.No}`,
        lineObjectNumber: line.No,
        description: line.Description,
        quantity: line.Quantity,
        unitPrice: line.Unit_Price,
        amountIncludingTax: line.Line_Amount,
        quantityShipped: line.Quantity_Shipped,
        unitOfMeasureCode: line.Unit_of_Measure_Code,
      });
    }

    const result = orders.map((o) => {
      const lines = linesByOrder[o.No] || [];
      const totalAmountIncludingTax = lines.reduce(
        (s, l) => s + (l.amountIncludingTax || 0),
        0,
      );
      return {
        id: o.No,
        number: o.No,
        customerNumber: o.Sell_to_Customer_No,
        customerName: o.Sell_to_Customer_Name,
        orderDate: o.Order_Date,
        dueDate: o.Due_Date,
        status: o.Status,
        completelyShipped: o.Completely_Shipped,
        salespersonCode: o.Salesperson_Code,
        externalDocumentNumber: o.External_Document_No,
        totalAmountIncludingTax,
        salesOrderLines: lines,
      };
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
