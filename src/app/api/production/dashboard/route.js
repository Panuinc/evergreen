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

function getDept(order) {
  // dimension1Code on the production ORDER = department (e.g. "WPC")
  // DO NOT fallback to entry.globalDimension1Code — that's the worker name
  return order?.dimension1Code || "";
}

function buildDashboard(orders, entries, orderMap, itemLookup, salesPriceMap, salesLines, today) {
  // ── KPI: Orders by Status ──
  const totalOrders = orders.length;
  let releasedOrders = 0;
  let finishedOrders = 0;
  for (const o of orders) {
    if (o.status === "Released") releasedOrders++;
    else if (o.status === "Finished") finishedOrders++;
  }

  // ── KPI: Entry totals ──
  // Cost = consumption (raw materials), Revenue = selling price × output qty
  let totalOutputQty = 0;
  let totalConsumptionCost = 0;
  let totalRevenue = 0;
  for (const e of entries) {
    if (e.entryType === "Output") {
      const qty = Number(e.quantity) || 0;
      totalOutputQty += qty;
      const unitPrice = salesPriceMap[e.itemNo] || 0;
      totalRevenue += unitPrice * qty;
    } else if (e.entryType === "Consumption") {
      totalConsumptionCost += Math.abs(Number(e.costAmountActual) || 0);
    }
  }
  const totalProfit = totalRevenue - totalConsumptionCost;
  const profitMargin = totalRevenue > 0
    ? Math.round((totalProfit / totalRevenue) * 100)
    : null;

  // ── KPI: WIP ──
  let wipValue = 0;
  for (const e of entries) {
    const order = orderMap[e.documentNo];
    if (order?.status === "Released" && e.entryType === "Consumption") {
      wipValue += Math.abs(Number(e.costAmountActual) || 0);
    }
  }

  // ── KPI: On-Time Rate ──
  let onTimeCount = 0;
  let finishedWithDueDateCount = 0;
  for (const o of orders) {
    if (o.status === "Finished" && o.finishedDate && o.dueDate) {
      finishedWithDueDateCount++;
      if (o.finishedDate <= o.dueDate) onTimeCount++;
    }
  }
  const onTimeRate =
    finishedWithDueDateCount > 0
      ? Math.round((onTimeCount / finishedWithDueDateCount) * 100)
      : null;

  // ── KPI: Avg Lead Time ──
  const leadTimes = [];
  for (const o of orders) {
    if (o.status === "Finished" && o.startingDateTime && o.finishedDate) {
      const start = new Date(o.startingDateTime);
      const end = new Date(o.finishedDate);
      const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
      if (days >= 0) leadTimes.push(days);
    }
  }
  const avgLeadTime =
    leadTimes.length > 0
      ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length)
      : null;

  // ── KPI: Cost Variance ──
  let totalCostExpected = 0;
  let totalCostActual = 0;
  for (const e of entries) {
    if (e.entryType === "Consumption") {
      totalCostExpected += Math.abs(Number(e.costAmountExpected) || 0);
      totalCostActual += Math.abs(Number(e.costAmountActual) || 0);
    }
  }
  const costVariance =
    totalCostExpected > 0
      ? Math.round(
          ((totalCostActual - totalCostExpected) / totalCostExpected) * 100,
        )
      : null;

  // ── KPI: Overdue count ──
  let overdueCount = 0;
  for (const o of orders) {
    if (o.status === "Released" && o.dueDate && o.dueDate < today) {
      overdueCount++;
    }
  }

  // ── Chart: Orders by Status ──
  const statusCount = {};
  for (const o of orders) {
    const s = o.status || "ไม่ระบุ";
    statusCount[s] = (statusCount[s] || 0) + 1;
  }
  const ordersByStatus = Object.entries(statusCount).map(
    ([status, count]) => ({ status, count }),
  );

  // ── Chart: Cost vs Revenue by Project ──
  const projectMap = {};
  for (const e of entries) {
    const order = orderMap[e.documentNo];
    const projectCode =
      order?.dimension2Code || e.globalDimension2Code || "ไม่ระบุ";
    const projectName =
      order?.dimension2Name || e.globalDimension2Name || projectCode;
    const key = projectCode;
    if (!projectMap[key])
      projectMap[key] = {
        project: projectName,
        consumptionCost: 0,
        revenue: 0,
      };
    if (e.entryType === "Consumption") {
      projectMap[key].consumptionCost += Math.abs(
        Number(e.costAmountActual) || 0,
      );
    } else if (e.entryType === "Output") {
      const qty = Number(e.quantity) || 0;
      const unitPrice = salesPriceMap[e.itemNo] || 0;
      projectMap[key].revenue += unitPrice * qty;
    }
  }
  const costByProject = Object.values(projectMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 15);

  // ── Chart: Daily Trend (ต้นทุน vs รายได้) ──
  const dailyMap = {};
  for (const e of entries) {
    if (!e.postingDate) continue;
    const d = e.postingDate.slice(0, 10);
    if (!dailyMap[d]) dailyMap[d] = { consumption: 0, revenue: 0 };
    if (e.entryType === "Consumption") {
      dailyMap[d].consumption += Math.abs(Number(e.costAmountActual) || 0);
    } else if (e.entryType === "Output") {
      const qty = Number(e.quantity) || 0;
      const unitPrice = salesPriceMap[e.itemNo] || 0;
      dailyMap[d].revenue += unitPrice * qty;
    }
  }
  const dailyTrend = Object.entries(dailyMap)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── Chart: Top 10 Output Items ──
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

  // ── Chart & Table: WIP by Order (ต้นทุน vs รายได้ + ความคืบหน้า) ──
  const wipMap = {};
  for (const e of entries) {
    const order = orderMap[e.documentNo];
    if (!order || order.status !== "Released") continue;
    const orderNo = e.documentNo;
    if (!wipMap[orderNo])
      wipMap[orderNo] = {
        orderNo,
        description: order.description,
        sourceNo: order.sourceNo,
        plannedQty: Number(order.quantity) || 0,
        outputQty: 0,
        consumptionCost: 0,
        revenue: 0,
        dueDate: order.dueDate,
        startingDateTime: order.startingDateTime,
      };
    if (e.entryType === "Consumption") {
      wipMap[orderNo].consumptionCost += Math.abs(
        Number(e.costAmountActual) || 0,
      );
    } else if (e.entryType === "Output") {
      const qty = Number(e.quantity) || 0;
      wipMap[orderNo].outputQty += qty;
      const unitPrice = salesPriceMap[e.itemNo] || 0;
      wipMap[orderNo].revenue += unitPrice * qty;
    }
  }
  const wipDetailAll = Object.values(wipMap).map((w) => {
    const remainQty = w.plannedQty - w.outputQty;
    const completionPct = w.plannedQty > 0
      ? Math.round((w.outputQty / w.plannedQty) * 100)
      : 0;
    return {
      ...w,
      remainQty,
      completionPct,
      wipValue: w.consumptionCost - w.revenue,
    };
  });
  const wipByOrder = wipDetailAll
    .sort((a, b) => b.wipValue - a.wipValue)
    .slice(0, 15);
  const wipDetail = wipDetailAll
    .sort((a, b) => a.completionPct - b.completionPct);

  // ── Chart: Top 10 Consumed Items ──
  const consumedMap = {};
  for (const e of entries) {
    if (e.entryType !== "Consumption") continue;
    const key = e.itemNo || "ไม่ระบุ";
    if (!consumedMap[key])
      consumedMap[key] = { itemNo: key, description: e.itemDescription, cost: 0, quantity: 0 };
    consumedMap[key].cost += Math.abs(Number(e.costAmountActual) || 0);
    consumedMap[key].quantity += Math.abs(Number(e.quantity) || 0);
  }
  const topConsumedItems = Object.values(consumedMap)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

  // ── Chart: Cost by Department ──
  // dimension1Code on order = department, NOT entry.globalDimension1Code (= worker name)
  const deptMap = {};
  for (const e of entries) {
    if (e.entryType !== "Consumption") continue;
    const order = orderMap[e.documentNo];
    const deptCode = order?.dimension1Code || "ไม่ระบุ";
    const deptName = order?.dimension1Name || deptCode;
    if (!deptMap[deptCode])
      deptMap[deptCode] = { department: deptName, cost: 0 };
    deptMap[deptCode].cost += Math.abs(Number(e.costAmountActual) || 0);
  }
  const costByDepartment = Object.values(deptMap)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

  // ── Chart: On-Time Trend ──
  const monthlyOnTime = {};
  for (const o of orders) {
    if (o.status !== "Finished" || !o.finishedDate || !o.dueDate) continue;
    const month = o.finishedDate.slice(0, 7);
    if (!monthlyOnTime[month]) monthlyOnTime[month] = { total: 0, onTime: 0 };
    monthlyOnTime[month].total++;
    if (o.finishedDate <= o.dueDate) monthlyOnTime[month].onTime++;
  }
  const onTimeTrend = Object.entries(monthlyOnTime)
    .map(([month, v]) => ({
      month,
      rate: Math.round((v.onTime / v.total) * 100),
      total: v.total,
      onTime: v.onTime,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // ── Chart: Lead Time Trend ──
  const monthlyLeadTime = {};
  for (const o of orders) {
    if (o.status !== "Finished" || !o.startingDateTime || !o.finishedDate) continue;
    const month = o.finishedDate.slice(0, 7);
    const start = new Date(o.startingDateTime);
    const end = new Date(o.finishedDate);
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (days < 0) continue;
    if (!monthlyLeadTime[month]) monthlyLeadTime[month] = { sum: 0, count: 0 };
    monthlyLeadTime[month].sum += days;
    monthlyLeadTime[month].count++;
  }
  const leadTimeTrend = Object.entries(monthlyLeadTime)
    .map(([month, v]) => ({
      month,
      avgDays: Math.round(v.sum / v.count),
      count: v.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // ── Table: Overdue Orders ──
  const overdueOrders = orders
    .filter((o) => o.status === "Released" && o.dueDate && o.dueDate < today)
    .map((o) => {
      const overdueDays = Math.round(
        (new Date(today) - new Date(o.dueDate)) / (1000 * 60 * 60 * 24),
      );
      return {
        id: o.id,
        description: o.description,
        sourceNo: o.sourceNo,
        quantity: o.quantity,
        dueDate: o.dueDate,
        startingDateTime: o.startingDateTime,
        overdueDays,
        dimension1Name: o.dimension1Name || o.dimension1Code,
        dimension2Name: o.dimension2Name || o.dimension2Code,
        locationCode: o.locationCode,
      };
    })
    .sort((a, b) => b.overdueDays - a.overdueDays);

  // ── Chart: Employee (Worker) Specialization ──
  // entry.globalDimension1Code = worker names joined by "/" (e.g. "ป.เสริฐ/สีมาซู")
  // Split by "/" to credit each worker individually
  // itemCategoryCode = product type skill (ประตู, วงกบ, etc.)
  const empSpecMap = {};
  for (const e of entries) {
    if (e.entryType !== "Output") continue;
    const raw = e.globalDimension1Code || e.globalDimension1Name || "ไม่ระบุ";
    const workers = raw.split("/").map((w) => w.trim()).filter(Boolean);
    if (!workers.length) workers.push("ไม่ระบุ");
    const cat = itemLookup[e.itemNo]?.itemCategoryCode || "ไม่ระบุ";
    const qty = Number(e.quantity) || 0;
    for (const worker of workers) {
      if (!empSpecMap[worker])
        empSpecMap[worker] = { employee: worker, categories: {}, totalQty: 0 };
      if (!empSpecMap[worker].categories[cat])
        empSpecMap[worker].categories[cat] = 0;
      empSpecMap[worker].categories[cat] += qty;
      empSpecMap[worker].totalQty += qty;
    }
  }
  const employeeSpecialization = Object.values(empSpecMap)
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 15)
    .map((emp) => {
      const cats = Object.entries(emp.categories)
        .sort((a, b) => b[1] - a[1])
        .map(([category, quantity]) => ({ category, quantity }));
      return {
        employee: emp.employee,
        totalQty: emp.totalQty,
        topCategory: cats[0]?.category || "-",
        categories: cats,
      };
    });

  // ── Chart: FG by Product Type ──
  const fgTypeMap = {};
  for (const e of entries) {
    if (e.entryType !== "Output") continue;
    const cat = itemLookup[e.itemNo]?.itemCategoryCode || "ไม่ระบุ";
    if (!fgTypeMap[cat])
      fgTypeMap[cat] = { category: cat, quantity: 0, revenue: 0, count: 0 };
    const qty = Number(e.quantity) || 0;
    const unitPrice = salesPriceMap[e.itemNo] || 0;
    fgTypeMap[cat].quantity += qty;
    fgTypeMap[cat].revenue += unitPrice * qty;
    fgTypeMap[cat].count++;
  }
  const fgByProductType = Object.values(fgTypeMap)
    .sort((a, b) => b.quantity - a.quantity);

  // ── Chart: Profit/Loss per Item ──
  // Cost = consumption only (raw materials), Revenue = selling price × qty
  const profitMap = {};
  for (const e of entries) {
    if (e.entryType !== "Output") continue;
    const key = e.itemNo || "ไม่ระบุ";
    if (!profitMap[key])
      profitMap[key] = {
        itemNo: key,
        description: e.itemDescription,
        category: itemLookup[e.itemNo]?.itemCategoryCode || "-",
        outputQty: 0,
        consumptionCost: 0,
      };
    profitMap[key].outputQty += Number(e.quantity) || 0;
  }
  for (const e of entries) {
    if (e.entryType !== "Consumption") continue;
    const order = orderMap[e.documentNo];
    if (!order) continue;
    const fgItem = order.sourceNo;
    if (fgItem && profitMap[fgItem]) {
      profitMap[fgItem].consumptionCost += Math.abs(
        Number(e.costAmountActual) || 0,
      );
    }
  }
  const profitByItem = Object.values(profitMap)
    .map((p) => {
      const sellingPrice = salesPriceMap[p.itemNo] || 0;
      const totalRevenue = sellingPrice * p.outputQty;
      const profitAmount = totalRevenue - p.consumptionCost;
      const profitMargin =
        totalRevenue > 0
          ? Math.round((profitAmount / totalRevenue) * 100)
          : null;
      return {
        ...p,
        sellingPrice,
        totalRevenue,
        profitAmount,
        profitMargin,
        costPerUnit: p.outputQty > 0 ? Math.round(p.consumptionCost / p.outputQty) : 0,
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 20);

  // ── Detail: Profit by Project (ละเอียด) ──
  // Cost = consumption only, Revenue = selling price × qty
  const projItemMap = {};
  for (const e of entries) {
    if (e.entryType !== "Output") continue;
    const order = orderMap[e.documentNo];
    const projCode = order?.dimension2Code || e.globalDimension2Code || "ไม่ระบุ";
    const projName = order?.dimension2Name || e.globalDimension2Name || projCode;
    const itemNo = e.itemNo || "ไม่ระบุ";
    const key = `${projCode}::${itemNo}`;
    if (!projItemMap[key])
      projItemMap[key] = {
        projectCode: projCode,
        projectName: projName,
        itemNo,
        description: e.itemDescription,
        category: itemLookup[e.itemNo]?.itemCategoryCode || "-",
        outputQty: 0,
        consumptionCost: 0,
      };
    projItemMap[key].outputQty += Number(e.quantity) || 0;
  }
  // Add consumption cost per project per FG item
  for (const e of entries) {
    if (e.entryType !== "Consumption") continue;
    const order = orderMap[e.documentNo];
    if (!order) continue;
    const projCode = order.dimension2Code || e.globalDimension2Code || "ไม่ระบุ";
    const fgItem = order.sourceNo;
    const key = `${projCode}::${fgItem}`;
    if (projItemMap[key]) {
      projItemMap[key].consumptionCost += Math.abs(Number(e.costAmountActual) || 0);
    }
  }

  // Build sales revenue per project per item from salesLines
  const salesByProjItem = {};
  for (const sl of salesLines) {
    if (!sl.lineObjectNumber || !sl.unitPrice) continue;
    const projCode = sl.projectCode || "ไม่ระบุ";
    const key = `${projCode}::${sl.lineObjectNumber}`;
    if (!salesByProjItem[key])
      salesByProjItem[key] = {
        soQty: 0,
        soRevenue: 0,
        unitPrice: Number(sl.unitPrice) || 0,
        shippedQty: 0,
      };
    salesByProjItem[key].soQty += Number(sl.quantity) || 0;
    salesByProjItem[key].soRevenue += (Number(sl.unitPrice) || 0) * (Number(sl.quantity) || 0);
    salesByProjItem[key].shippedQty += Number(sl.quantityShipped) || 0;
    // Keep the latest unitPrice
    if ((Number(sl.unitPrice) || 0) > 0) {
      salesByProjItem[key].unitPrice = Number(sl.unitPrice);
    }
  }

  // Merge into profitByProject
  const projSummary = {};
  for (const pi of Object.values(projItemMap)) {
    const salesKey = `${pi.projectCode}::${pi.itemNo}`;
    const sales = salesByProjItem[salesKey] || {};
    const unitPrice = sales.unitPrice || salesPriceMap[pi.itemNo] || 0;
    const totalCost = pi.consumptionCost;
    const revenue = unitPrice * pi.outputQty;
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : null;

    const item = {
      itemNo: pi.itemNo,
      description: pi.description,
      category: pi.category,
      outputQty: pi.outputQty,
      soQty: sales.soQty || 0,
      shippedQty: sales.shippedQty || 0,
      unitPrice,
      costPerUnit: pi.outputQty > 0 ? Math.round(totalCost / pi.outputQty) : 0,
      totalCost,
      revenue,
      profit,
      margin,
    };

    if (!projSummary[pi.projectCode])
      projSummary[pi.projectCode] = {
        projectCode: pi.projectCode,
        projectName: pi.projectName,
        totalCost: 0,
        totalRevenue: 0,
        totalProfit: 0,
        items: [],
      };
    projSummary[pi.projectCode].totalCost += totalCost;
    projSummary[pi.projectCode].totalRevenue += revenue;
    projSummary[pi.projectCode].totalProfit += profit;
    projSummary[pi.projectCode].items.push(item);
  }
  const profitByProject = Object.values(projSummary)
    .map((p) => ({
      ...p,
      margin: p.totalRevenue > 0 ? Math.round((p.totalProfit / p.totalRevenue) * 100) : null,
      items: p.items.sort((a, b) => b.revenue - a.revenue),
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    totalOrders,
    releasedOrders,
    finishedOrders,
    totalOutputQty,
    totalConsumptionCost,
    totalRevenue,
    totalProfit,
    profitMargin,
    wipValue,
    onTimeRate,
    avgLeadTime,
    costVariance,
    overdueCount,
    ordersByStatus,
    costByProject,
    dailyTrend,
    topOutputItems,
    wipByOrder,
    topConsumedItems,
    costByDepartment,
    onTimeTrend,
    leadTimeTrend,
    overdueOrders,
    employeeSpecialization,
    fgByProductType,
    profitByItem,
    profitByProject,
    wipDetail,
  };
}

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const [allOrders, allEntries, salesLines, items] = await Promise.all([
      fetchAll(auth.supabase, "bcProductionOrders"),
      fetchAll(auth.supabase, "bcItemLedgerEntries", "entryNo"),
      fetchAll(auth.supabase, "bcSalesOrderLines"),
      fetchAll(auth.supabase, "bcItems"),
    ]);

    const orderMap = {};
    for (const o of allOrders) {
      orderMap[o.id] = o;
    }

    const itemLookup = {};
    for (const it of items) {
      itemLookup[it.id] = it;
    }

    const salesPriceMap = {};
    for (const sl of salesLines) {
      if (sl.lineObjectNumber && sl.unitPrice > 0) {
        salesPriceMap[sl.lineObjectNumber] = Number(sl.unitPrice);
      }
    }

    const today = new Date().toISOString().slice(0, 10);

    // ── Split by WPC ──
    const wpcOrders = allOrders.filter((o) => o.dimension1Code === "WPC");
    const otherOrders = allOrders.filter((o) => o.dimension1Code !== "WPC");

    const wpcEntries = allEntries.filter((e) => {
      return getDept(orderMap[e.documentNo]) === "WPC";
    });
    const otherEntries = allEntries.filter((e) => {
      return getDept(orderMap[e.documentNo]) !== "WPC";
    });

    const wpc = buildDashboard(wpcOrders, wpcEntries, orderMap, itemLookup, salesPriceMap, salesLines, today);
    const other = buildDashboard(otherOrders, otherEntries, orderMap, itemLookup, salesPriceMap, salesLines, today);

    return Response.json({ wpc, other });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
