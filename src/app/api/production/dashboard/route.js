import { withAuth } from "@/app/api/_lib/auth";

const PAGE_SIZE = 1000;

async function fetchAll(supabase, table, orderBy = "id") {
  let rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderBy)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows = rows.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const [orders, entries] = await Promise.all([
      fetchAll(auth.supabase, "bcProductionOrders"),
      fetchAll(auth.supabase, "bcItemLedgerEntries", "entryNo"),
    ]);

    // Build order lookup: id (orderNo) → order
    const orderMap = {};
    for (const o of orders) {
      orderMap[o.id] = o;
    }

    // ── KPI: Orders by Status ──
    const totalOrders = orders.length;
    let releasedOrders = 0;
    let finishedOrders = 0;
    for (const o of orders) {
      if (o.status === "Released") releasedOrders++;
      else if (o.status === "Finished") finishedOrders++;
    }

    // ── KPIs by entryType ──
    let totalOutputQty = 0;
    let totalConsumptionCost = 0;
    let totalOutputValue = 0;

    for (const e of entries) {
      if (e.entryType === "Output") {
        totalOutputQty += Number(e.quantity) || 0;
        totalOutputValue += Number(e.costAmountActual) || 0;
      } else if (e.entryType === "Consumption") {
        totalConsumptionCost += Math.abs(Number(e.costAmountActual) || 0);
      }
    }

    // ── WIP: consumption cost of Released orders ──
    let wipValue = 0;
    for (const e of entries) {
      const order = orderMap[e.documentNo];
      if (order?.status === "Released" && e.entryType === "Consumption") {
        wipValue += Math.abs(Number(e.costAmountActual) || 0);
      }
    }

    // ── Chart 1: Orders by Status ──
    const statusCount = {};
    for (const o of orders) {
      const s = o.status || "ไม่ระบุ";
      statusCount[s] = (statusCount[s] || 0) + 1;
    }
    const ordersByStatus = Object.entries(statusCount).map(([status, count]) => ({
      status,
      count,
    }));

    // ── Chart 2: Output by Product Group (dimension1Code from order, fallback globalDimension1Code from entry) ──
    const groupMap = {};
    for (const e of entries) {
      if (e.entryType !== "Output") continue;
      const order = orderMap[e.documentNo];
      const group = order?.dimension1Code || e.globalDimension1Code || "ไม่ระบุ";
      if (!groupMap[group]) groupMap[group] = { quantity: 0, count: 0 };
      groupMap[group].quantity += Number(e.quantity) || 0;
      groupMap[group].count++;
    }
    const outputByProductGroup = Object.entries(groupMap)
      .map(([group, v]) => ({ group, ...v }))
      .sort((a, b) => b.quantity - a.quantity);

    // ── Chart 3: Cost by Project (dimension2Code from order, fallback globalDimension2Code from entry) ──
    const projectMap = {};
    for (const e of entries) {
      const order = orderMap[e.documentNo];
      const project = order?.dimension2Code || e.globalDimension2Code || "ไม่ระบุ";
      if (!projectMap[project])
        projectMap[project] = { consumptionCost: 0, outputValue: 0 };
      if (e.entryType === "Consumption") {
        projectMap[project].consumptionCost += Math.abs(
          Number(e.costAmountActual) || 0,
        );
      } else if (e.entryType === "Output") {
        projectMap[project].outputValue += Number(e.costAmountActual) || 0;
      }
    }
    const costByProject = Object.entries(projectMap)
      .map(([project, v]) => ({ project, ...v }))
      .sort((a, b) => b.consumptionCost - a.consumptionCost)
      .slice(0, 15);

    // ── Chart 4: Daily Trend ──
    const dailyMap = {};
    for (const e of entries) {
      if (!e.postingDate) continue;
      const d = e.postingDate.slice(0, 10);
      if (!dailyMap[d]) dailyMap[d] = { consumption: 0, output: 0 };
      if (e.entryType === "Consumption") {
        dailyMap[d].consumption += Math.abs(Number(e.costAmountActual) || 0);
      } else if (e.entryType === "Output") {
        dailyMap[d].output += Number(e.costAmountActual) || 0;
      }
    }
    const dailyTrend = Object.entries(dailyMap)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Chart 5: Top 10 Output Items ──
    const itemMap = {};
    for (const e of entries) {
      if (e.entryType !== "Output") continue;
      const key = e.itemNo || "ไม่ระบุ";
      if (!itemMap[key])
        itemMap[key] = { itemNo: key, description: e.itemDescription, quantity: 0 };
      itemMap[key].quantity += Number(e.quantity) || 0;
    }
    const topOutputItems = Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // ── Chart 6: WIP by Order (Released orders only) ──
    const wipMap = {};
    for (const e of entries) {
      const order = orderMap[e.documentNo];
      if (!order || order.status !== "Released") continue;
      const orderNo = e.documentNo;
      if (!wipMap[orderNo])
        wipMap[orderNo] = {
          orderNo,
          description: order.description,
          consumptionCost: 0,
          outputValue: 0,
        };
      if (e.entryType === "Consumption") {
        wipMap[orderNo].consumptionCost += Math.abs(
          Number(e.costAmountActual) || 0,
        );
      } else if (e.entryType === "Output") {
        wipMap[orderNo].outputValue += Number(e.costAmountActual) || 0;
      }
    }
    const wipByOrder = Object.values(wipMap)
      .map((w) => ({
        ...w,
        wipValue: w.consumptionCost - w.outputValue,
      }))
      .sort((a, b) => b.wipValue - a.wipValue)
      .slice(0, 15);

    return Response.json({
      totalOrders,
      releasedOrders,
      finishedOrders,
      totalOutputQty,
      totalConsumptionCost,
      totalOutputValue,
      wipValue,
      ordersByStatus,
      outputByProductGroup,
      costByProject,
      dailyTrend,
      topOutputItems,
      wipByOrder,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
