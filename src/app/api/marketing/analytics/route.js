import { withAuth } from "@/app/api/_lib/auth";
import { bcODataGet } from "@/lib/bcClient";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
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

    const orderNos = new Set(orders.map((o) => o.No));
    const lines = allLines.filter((l) => orderNos.has(l.Document_No));

    // Group lines by Document_No
    const linesByOrder = {};
    for (const line of lines) {
      if (!linesByOrder[line.Document_No]) linesByOrder[line.Document_No] = [];
      linesByOrder[line.Document_No].push(line);
    }

    // Attach lines + calc totals
    const ordersWithLines = orders.map((order) => {
      const ol = linesByOrder[order.No] || [];
      const totalAmount = ol.reduce((s, l) => s + (l.Line_Amount || 0), 0);
      const totalQty = ol.reduce((s, l) => s + (l.Quantity || 0), 0);
      const shippedQty = ol.reduce((s, l) => s + (l.Quantity_Shipped || 0), 0);
      return { ...order, lines: ol, totalAmount, totalQty, shippedQty };
    });

    // === Date helpers ===
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const currentMonth = today.slice(0, 7);
    const currentYear = today.slice(0, 4);

    // Previous month
    const pm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${pm.getFullYear()}-${String(pm.getMonth() + 1).padStart(2, "0")}`;
    const prevYear = String(now.getFullYear() - 1);

    // === KPI: DTD / MTD / YTD with comparison ===
    const dtd = { orders: 0, revenue: 0 };
    const mtd = { orders: 0, revenue: 0 };
    const ytd = { orders: 0, revenue: 0 };
    const prevMtd = { orders: 0, revenue: 0 };
    const prevYtd = { orders: 0, revenue: 0 };

    for (const o of ordersWithLines) {
      const d = o.Order_Date;
      if (!d) continue;
      if (d === today) { dtd.orders++; dtd.revenue += o.totalAmount; }
      if (d.startsWith(currentMonth)) { mtd.orders++; mtd.revenue += o.totalAmount; }
      if (d.startsWith(currentYear)) { ytd.orders++; ytd.revenue += o.totalAmount; }
      if (d.startsWith(prevMonth)) { prevMtd.orders++; prevMtd.revenue += o.totalAmount; }
      if (d.startsWith(prevYear)) { prevYtd.orders++; prevYtd.revenue += o.totalAmount; }
    }

    // Growth %
    const mtdGrowth = prevMtd.revenue ? ((mtd.revenue - prevMtd.revenue) / prevMtd.revenue) * 100 : null;
    const ytdGrowth = prevYtd.revenue ? ((ytd.revenue - prevYtd.revenue) / prevYtd.revenue) * 100 : null;

    // === Overall KPIs ===
    const totalOrders = ordersWithLines.length;
    const totalRevenue = ordersWithLines.reduce((s, o) => s + o.totalAmount, 0);
    const shippedOrders = ordersWithLines.filter((o) => o.Completely_Shipped).length;
    const pendingOrders = totalOrders - shippedOrders;
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    // === Order Status distribution ===
    const statusMap = {};
    for (const o of ordersWithLines) {
      const st = o.Status || "Unknown";
      if (!statusMap[st]) statusMap[st] = { status: st, count: 0, revenue: 0 };
      statusMap[st].count++;
      statusMap[st].revenue += o.totalAmount;
    }
    const orderStatusDist = Object.values(statusMap);

    // Ship status
    const shipStatusDist = [
      { status: "จัดส่งแล้ว", count: shippedOrders },
      { status: "รอจัดส่ง", count: pendingOrders },
    ];

    // === Monthly revenue trend ===
    const monthlyMap = {};
    for (const o of ordersWithLines) {
      const m = o.Order_Date?.slice(0, 7);
      if (!m) continue;
      if (!monthlyMap[m]) monthlyMap[m] = { month: m, revenue: 0, orders: 0 };
      monthlyMap[m].revenue += o.totalAmount;
      monthlyMap[m].orders++;
    }
    const monthlyTrend = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    // === Daily trend (current month) ===
    const dailyMap = {};
    for (const o of ordersWithLines) {
      const d = o.Order_Date;
      if (!d || !d.startsWith(currentMonth)) continue;
      if (!dailyMap[d]) dailyMap[d] = { date: d, revenue: 0, orders: 0 };
      dailyMap[d].revenue += o.totalAmount;
      dailyMap[d].orders++;
    }
    const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // === Top 10 customers ===
    const custMap = {};
    for (const o of ordersWithLines) {
      const n = o.Sell_to_Customer_Name || "Unknown";
      if (!custMap[n]) custMap[n] = { name: n, revenue: 0, orders: 0, avgValue: 0 };
      custMap[n].revenue += o.totalAmount;
      custMap[n].orders++;
    }
    const topCustomers = Object.values(custMap)
      .map((c) => ({ ...c, avgValue: c.orders ? c.revenue / c.orders : 0 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // === Top 10 SKU ===
    const skuMap = {};
    for (const l of lines) {
      const key = l.No?.trim() || l.Description?.trim();
      if (!key) continue;
      if (!l.Quantity && !l.Line_Amount) continue;
      if (!skuMap[key]) skuMap[key] = { sku: key, description: l.Description || key, quantity: 0, revenue: 0 };
      skuMap[key].quantity += l.Quantity || 0;
      skuMap[key].revenue += l.Line_Amount || 0;
    }
    const topSkus = Object.values(skuMap)
      .sort((a, b) => (b.revenue || b.quantity) - (a.revenue || a.quantity))
      .slice(0, 10);

    return Response.json({
      orders: ordersWithLines,
      stats: {
        totalOrders,
        totalRevenue,
        shippedOrders,
        pendingOrders,
        avgOrderValue,
        dtd,
        mtd,
        ytd,
        prevMtd,
        prevYtd,
        mtdGrowth,
        ytdGrowth,
        monthlyTrend,
        dailyTrend,
        orderStatusDist,
        shipStatusDist,
        topCustomers,
        topSkus,
      },
    });
  } catch (error) {
    console.error("[Marketing Analytics] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
