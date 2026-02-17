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

    // CustomerList — use this entity instead of Customer_Card_Excel (avoids BWK permission issue)
    let customers = [];
    try {
      customers = await bcODataGet("CustomerList", {
        $filter: "Salesperson_Code eq 'ONLINE'",
        $select: "No,Name,Contact",
      });
      console.log(`[Marketing Analytics] Customers loaded: ${customers.length}`);
    } catch (e) {
      console.warn(`[Marketing Analytics] CustomerList failed (${e.message})`);
    }

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

    // === Week-to-Date + WoW Growth ===
    const msPerDay = 86400000;
    const todayDate = new Date(today);
    const dayOfWeek = todayDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisWeekStart = new Date(todayDate - mondayOffset * msPerDay).toISOString().slice(0, 10);
    const lastWeekStart = new Date(todayDate - (mondayOffset + 7) * msPerDay).toISOString().slice(0, 10);
    const lastWeekEnd = new Date(todayDate - (mondayOffset + 1) * msPerDay).toISOString().slice(0, 10);

    const wtd = { orders: 0, revenue: 0 };
    const prevWtd = { orders: 0, revenue: 0 };
    for (const o of ordersWithLines) {
      const d = o.Order_Date;
      if (!d) continue;
      if (d >= thisWeekStart && d <= today) { wtd.orders++; wtd.revenue += o.totalAmount; }
      if (d >= lastWeekStart && d <= lastWeekEnd) { prevWtd.orders++; prevWtd.revenue += o.totalAmount; }
    }
    const wowGrowth = prevWtd.revenue ? ((wtd.revenue - prevWtd.revenue) / prevWtd.revenue) * 100 : null;

    // === Revenue by Day of Week ===
    const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    const dowStats = Array.from({ length: 7 }, (_, i) => ({ day: i, dayName: dayNames[i], revenue: 0, orders: 0 }));
    for (const o of ordersWithLines) {
      if (!o.Order_Date) continue;
      const dow = new Date(o.Order_Date).getDay();
      dowStats[dow].revenue += o.totalAmount;
      dowStats[dow].orders++;
    }
    const revenueByDayOfWeek = [...dowStats.slice(1), dowStats[0]].map((d) => ({
      ...d, avgValue: d.orders ? d.revenue / d.orders : 0,
    }));

    // === Order Value Distribution ===
    const valueBuckets = [
      { label: "0-1K", min: 0, max: 1000, count: 0, revenue: 0 },
      { label: "1K-5K", min: 1000, max: 5000, count: 0, revenue: 0 },
      { label: "5K-20K", min: 5000, max: 20000, count: 0, revenue: 0 },
      { label: "20K-50K", min: 20000, max: 50000, count: 0, revenue: 0 },
      { label: "50K+", min: 50000, max: Infinity, count: 0, revenue: 0 },
    ];
    for (const o of ordersWithLines) {
      const bucket = valueBuckets.find((b) => o.totalAmount >= b.min && o.totalAmount < b.max);
      if (bucket) { bucket.count++; bucket.revenue += o.totalAmount; }
    }
    const orderValueDist = valueBuckets.map(({ label, count, revenue }) => ({
      label, count, revenue,
      pct: totalOrders ? +((count / totalOrders) * 100).toFixed(1) : 0,
    }));

    // === Customer Insights ===
    const allCustomers = Object.values(custMap);
    const totalUniqueCustomers = allCustomers.length;
    const repeatCustomers = allCustomers.filter((c) => c.orders > 1).length;
    const repeatCustomerRate = totalUniqueCustomers ? +((repeatCustomers / totalUniqueCustomers) * 100).toFixed(1) : 0;
    const sortedCustByRev = [...allCustomers].sort((a, b) => b.revenue - a.revenue);
    const top5Count = Math.max(1, Math.ceil(totalUniqueCustomers * 0.05));
    const top5Revenue = sortedCustByRev.slice(0, top5Count).reduce((s, c) => s + c.revenue, 0);
    const customerInsights = {
      totalUniqueCustomers,
      repeatCustomers,
      singleOrderCustomers: totalUniqueCustomers - repeatCustomers,
      repeatCustomerRate,
      top5ConcentrationPct: totalRevenue ? +((top5Revenue / totalRevenue) * 100).toFixed(1) : 0,
      repeatCustomerRevenue: allCustomers.filter((c) => c.orders > 1).reduce((s, c) => s + c.revenue, 0),
      singleCustomerRevenue: allCustomers.filter((c) => c.orders === 1).reduce((s, c) => s + c.revenue, 0),
    };

    // === Fulfillment Metrics ===
    let totalQtyOrdered = 0, totalQtyShipped = 0, totalOutstanding = 0, ordersWithOutstanding = 0;
    for (const o of ordersWithLines) {
      totalQtyOrdered += o.totalQty;
      totalQtyShipped += o.shippedQty;
      const outstanding = o.totalQty - o.shippedQty;
      totalOutstanding += outstanding;
      if (outstanding > 0) ordersWithOutstanding++;
    }
    const fulfillmentMetrics = {
      totalQtyOrdered,
      totalQtyShipped,
      totalOutstanding,
      fulfillmentRate: totalQtyOrdered ? +((totalQtyShipped / totalQtyOrdered) * 100).toFixed(1) : 0,
      avgOutstandingPerOrder: ordersWithOutstanding ? +(totalOutstanding / ordersWithOutstanding).toFixed(1) : 0,
      ordersWithOutstanding,
    };

    // === Monthly Comparison ===
    function computeMonthStats(ords) {
      const rev = ords.reduce((s, o) => s + o.totalAmount, 0);
      const shipped = ords.filter((o) => o.Completely_Shipped).length;
      return {
        orders: ords.length, revenue: rev,
        avgValue: ords.length ? rev / ords.length : 0,
        shippedOrders: shipped,
        shipRate: ords.length ? +((shipped / ords.length) * 100).toFixed(1) : 0,
        uniqueCustomers: new Set(ords.map((o) => o.Sell_to_Customer_No)).size,
      };
    }
    const monthlyComparison = {
      current: { month: currentMonth, ...computeMonthStats(ordersWithLines.filter((o) => o.Order_Date?.startsWith(currentMonth))) },
      previous: { month: prevMonth, ...computeMonthStats(ordersWithLines.filter((o) => o.Order_Date?.startsWith(prevMonth))) },
    };

    // === Location Distribution ===
    const locationMap = {};
    for (const l of lines) {
      const loc = l.Location_Code?.trim() || "ไม่ระบุ";
      if (!locationMap[loc]) locationMap[loc] = { location: loc, quantity: 0, revenue: 0, lineCount: 0 };
      locationMap[loc].quantity += l.Quantity || 0;
      locationMap[loc].revenue += l.Line_Amount || 0;
      locationMap[loc].lineCount++;
    }
    const locationDist = Object.values(locationMap).sort((a, b) => b.revenue - a.revenue);

    // === Customer Segmentation from CustomerList ===
    const CHANNEL_LABELS = { L: "LINE", FB: "Facebook", IN: "Instagram", SP: "Shopee", TT: "TikTok", LZ: "Lazada", W: "Website" };
    const GROUP_LABELS = { CLT: "ลูกค้าทั่วไป", OWN: "เจ้าของโครงการ", DEV: "บ.พัฒนาอสังหาฯ", MC: "ผู้รับเหมาหลัก", SUB: "ผู้รับเหมาช่วง", ARCH: "สถาปนิก", PM: "ที่ปรึกษาโครงการ" };
    const TYPE_LABELS = { RES: "ที่อยู่อาศัย", COM: "อาคารพาณิชย์", IND: "อุตสาหกรรม", INFRA: "สาธารณูปโภค" };

    // Normalize variations (case-insensitive, full names, abbreviations) → standard codes
    const CHANNEL_NORMALIZE = {
      l: "L", line: "L", li: "L",
      fb: "FB", facebook: "FB", f: "FB",
      in: "IN", instagram: "IN", ig: "IN",
      sp: "SP", shopee: "SP",
      tt: "TT", tiktok: "TT",
      lz: "LZ", lazada: "LZ",
      w: "W", website: "W", web: "W",
    };
    const GROUP_NORMALIZE = {
      clt: "CLT", own: "OWN", dev: "DEV", mc: "MC", sub: "SUB", arch: "ARCH", pm: "PM",
    };
    const TYPE_NORMALIZE = {
      res: "RES", com: "COM", ind: "IND", infra: "INFRA",
    };
    function normalize(val, map) {
      if (!val) return "";
      const key = val.toLowerCase();
      return map[key] || val.toUpperCase();
    }

    // Build customer lookup by No -> parsed segments
    const customerByNo = {};
    for (const c of customers) {
      const code = (c.Contact || "").trim();
      const parts = code.split("-");
      customerByNo[c.No] = {
        name: c.Name,
        code,
        channel: normalize(parts[0], CHANNEL_NORMALIZE),
        group: normalize(parts[1], GROUP_NORMALIZE),
        type: normalize(parts[2], TYPE_NORMALIZE),
      };
    }

    // Aggregate segmentation from orders (so we get revenue-weighted data)
    const channelMap = {};
    const groupMap = {};
    const typeMap = {};
    const channelGroupMap = {};

    for (const o of ordersWithLines) {
      const cust = customerByNo[o.Sell_to_Customer_No];
      if (!cust || !cust.code) continue;

      const ch = cust.channel;
      const gr = cust.group;
      const tp = cust.type;

      // Channel distribution
      if (ch) {
        if (!channelMap[ch]) channelMap[ch] = { code: ch, label: CHANNEL_LABELS[ch] || ch, customers: new Set(), orders: 0, revenue: 0 };
        channelMap[ch].customers.add(o.Sell_to_Customer_No);
        channelMap[ch].orders++;
        channelMap[ch].revenue += o.totalAmount;
      }

      // Customer group distribution
      if (gr) {
        if (!groupMap[gr]) groupMap[gr] = { code: gr, label: GROUP_LABELS[gr] || gr, customers: new Set(), orders: 0, revenue: 0 };
        groupMap[gr].customers.add(o.Sell_to_Customer_No);
        groupMap[gr].orders++;
        groupMap[gr].revenue += o.totalAmount;
      }

      // Project type distribution
      if (tp) {
        if (!typeMap[tp]) typeMap[tp] = { code: tp, label: TYPE_LABELS[tp] || tp, customers: new Set(), orders: 0, revenue: 0 };
        typeMap[tp].customers.add(o.Sell_to_Customer_No);
        typeMap[tp].orders++;
        typeMap[tp].revenue += o.totalAmount;
      }

      // Channel x Group cross-tab
      if (ch && gr) {
        const key = `${ch}-${gr}`;
        if (!channelGroupMap[key]) channelGroupMap[key] = { channel: CHANNEL_LABELS[ch] || ch, group: GROUP_LABELS[gr] || gr, orders: 0, revenue: 0 };
        channelGroupMap[key].orders++;
        channelGroupMap[key].revenue += o.totalAmount;
      }
    }

    const serializeSegment = (map) =>
      Object.values(map)
        .map((s) => ({ ...s, customers: s.customers.size }))
        .sort((a, b) => b.revenue - a.revenue);

    const customerSegmentation = {
      totalCustomers: customers.length,
      parsedCustomers: Object.keys(customerByNo).filter((k) => customerByNo[k].code).length,
      byChannel: serializeSegment(channelMap),
      byGroup: serializeSegment(groupMap),
      byType: serializeSegment(typeMap),
      channelGroupCross: Object.values(channelGroupMap).sort((a, b) => b.revenue - a.revenue),
    };

    return Response.json({
      orders: ordersWithLines,
      stats: {
        totalOrders,
        totalRevenue,
        shippedOrders,
        pendingOrders,
        avgOrderValue,
        dtd,
        wtd,
        mtd,
        ytd,
        prevWtd,
        prevMtd,
        prevYtd,
        wowGrowth,
        mtdGrowth,
        ytdGrowth,
        monthlyTrend,
        dailyTrend,
        orderStatusDist,
        shipStatusDist,
        topCustomers,
        topSkus,
        revenueByDayOfWeek,
        orderValueDist,
        customerInsights,
        fulfillmentMetrics,
        monthlyComparison,
        locationDist,
        customerSegmentation,
      },
    });
  } catch (error) {
    console.error("[Marketing Analytics] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
