import { withAuth } from "@/app/api/_lib/auth";
import { bcODataGet } from "@/lib/bcClient";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    // Fetch orders and lines in parallel
    const [orders, allLines] = await Promise.all([
      bcODataGet("Sales_Order_Excel", {
        $filter: "Salesperson_Code eq 'ONLINE' and startswith(No,'SO26')",
        $orderby: "Order_Date desc",
        $select:
          "No,Sell_to_Customer_No,Sell_to_Customer_Name,Sell_to_Address,Order_Date,Due_Date,Status,Completely_Shipped,External_Document_No,Salesperson_Code",
      }),
      bcODataGet("Sales_Order_Line_Excel", {
        $filter: "startswith(Document_No,'SO26')",
        $select:
          "Document_No,Line_No,Type,No,Description,Quantity,Unit_Price,Line_Amount,Quantity_Shipped,BWK_Outstanding_Quantity,Unit_of_Measure_Code,Location_Code",
      }),
    ]);

    // Build set of order numbers for filtering lines
    const orderNos = new Set(orders.map((o) => o.No));

    // Filter lines to only include those belonging to our orders
    const lines = allLines.filter((l) => orderNos.has(l.Document_No));

    // Group lines by Document_No
    const linesByOrder = {};
    for (const line of lines) {
      if (!linesByOrder[line.Document_No]) linesByOrder[line.Document_No] = [];
      linesByOrder[line.Document_No].push(line);
    }

    // Attach lines to orders + calc order totals
    const ordersWithLines = orders.map((order) => {
      const orderLines = linesByOrder[order.No] || [];
      const totalAmount = orderLines.reduce((sum, l) => sum + (l.Line_Amount || 0), 0);
      const totalQty = orderLines.reduce((sum, l) => sum + (l.Quantity || 0), 0);
      const shippedQty = orderLines.reduce((sum, l) => sum + (l.Quantity_Shipped || 0), 0);
      return { ...order, lines: orderLines, totalAmount, totalQty, shippedQty };
    });

    // KPI stats
    const totalOrders = ordersWithLines.length;
    const totalRevenue = ordersWithLines.reduce((sum, o) => sum + o.totalAmount, 0);
    const shippedOrders = ordersWithLines.filter((o) => o.Completely_Shipped).length;
    const pendingOrders = totalOrders - shippedOrders;

    // Monthly sales (group by YYYY-MM)
    const monthlyMap = {};
    for (const order of ordersWithLines) {
      const month = order.Order_Date?.slice(0, 7); // "2026-02"
      if (!month) continue;
      if (!monthlyMap[month]) monthlyMap[month] = { month, amount: 0, count: 0 };
      monthlyMap[month].amount += order.totalAmount;
      monthlyMap[month].count += 1;
    }
    const monthlySales = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    // Top 10 customers by revenue
    const customerMap = {};
    for (const order of ordersWithLines) {
      const name = order.Sell_to_Customer_Name || "Unknown";
      if (!customerMap[name]) customerMap[name] = { name, amount: 0, count: 0 };
      customerMap[name].amount += order.totalAmount;
      customerMap[name].count += 1;
    }
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Top 10 SKU by revenue (fallback to quantity if no amount)
    const skuMap = {};
    for (const line of lines) {
      const key = line.No?.trim() || line.Description?.trim();
      if (!key) continue;
      if (!line.Quantity && !line.Line_Amount) continue;
      if (!skuMap[key]) skuMap[key] = { sku: key, description: line.Description || key, quantity: 0, amount: 0 };
      skuMap[key].quantity += line.Quantity || 0;
      skuMap[key].amount += line.Line_Amount || 0;
    }
    const topSkus = Object.values(skuMap)
      .sort((a, b) => (b.amount || b.quantity) - (a.amount || a.quantity))
      .slice(0, 10);

    // DTD / MTD / YTD
    const today = new Date().toISOString().slice(0, 10); // "2026-02-17"
    const currentMonth = today.slice(0, 7); // "2026-02"
    const currentYear = today.slice(0, 4); // "2026"

    const dtd = { orders: 0, revenue: 0 };
    const mtd = { orders: 0, revenue: 0 };
    const ytd = { orders: 0, revenue: 0 };

    for (const order of ordersWithLines) {
      const d = order.Order_Date;
      if (!d) continue;
      if (d === today) { dtd.orders++; dtd.revenue += order.totalAmount; }
      if (d.startsWith(currentMonth)) { mtd.orders++; mtd.revenue += order.totalAmount; }
      if (d.startsWith(currentYear)) { ytd.orders++; ytd.revenue += order.totalAmount; }
    }

    return Response.json({
      orders: ordersWithLines,
      stats: {
        totalOrders,
        totalRevenue,
        shippedOrders,
        pendingOrders,
        monthlySales,
        topCustomers,
        topSkus,
        dtd,
        mtd,
        ytd,
      },
    });
  } catch (error) {
    console.error("[Marketing Analytics] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
