import { withAuth } from "@/app/api/_lib/auth";
import { getComparisonRanges, filterByDateRange } from "@/lib/comparison";

const PAGE_SIZE = 1000;

async function fetchAll(supabase, table, orderBy = "bcProductionOrderNo") {
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


  return order?.bcProductionOrderShortcutDimension1Code || "";
}

function buildDashboard(orders, entries, orderMap, itemLookup, salesPriceMap, salesLines, today) {

  const totalOrders = orders.length;
  let releasedOrders = 0;
  let finishedOrders = 0;
  for (const o of orders) {
    if (o.bcProductionOrderStatus === "Released") releasedOrders++;
    else if (o.bcProductionOrderStatus === "Finished") finishedOrders++;
  }



  let totalOutputQty = 0;
  let totalConsumptionCost = 0;
  let totalRevenue = 0;
  for (const e of entries) {
    if (e.bcItemLedgerEntryEntryType === "Output") {
      const qty = Number(e.bcItemLedgerEntryQuantityValue) || 0;
      totalOutputQty += qty;
      const unitPrice = salesPriceMap[e.bcItemLedgerEntryItemNo] || 0;
      totalRevenue += unitPrice * qty;
    } else if (e.bcItemLedgerEntryEntryType === "Consumption") {
      totalConsumptionCost += Math.abs(Number(0) || 0);
    }
  }
  const totalProfit = totalRevenue - totalConsumptionCost;
  const profitMargin = totalRevenue > 0
    ? Math.round((totalProfit / totalRevenue) * 100)
    : null;


  let wipValue = 0;
  for (const e of entries) {
    const order = orderMap[e.bcItemLedgerEntryDocumentNo];
    if (order?.bcProductionOrderStatus === "Released" && e.bcItemLedgerEntryEntryType === "Consumption") {
      wipValue += Math.abs(Number(0) || 0);
    }
  }


  let onTimeCount = 0;
  let finishedWithDueDateCount = 0;
  for (const o of orders) {
    if (o.bcProductionOrderStatus === "Finished" && o.bcProductionOrderFinishedDate && o.bcProductionOrderDueDate) {
      finishedWithDueDateCount++;
      if (o.bcProductionOrderFinishedDate <= o.bcProductionOrderDueDate) onTimeCount++;
    }
  }
  const onTimeRate =
    finishedWithDueDateCount > 0
      ? Math.round((onTimeCount / finishedWithDueDateCount) * 100)
      : null;


  const leadTimes = [];
  for (const o of orders) {
    if (o.bcProductionOrderStatus === "Finished" && o.bcProductionOrderStartingDateTime && o.bcProductionOrderFinishedDate) {
      const start = new Date(o.bcProductionOrderStartingDateTime);
      const end = new Date(o.bcProductionOrderFinishedDate);
      const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
      if (days >= 0) leadTimes.push(days);
    }
  }
  const avgLeadTime =
    leadTimes.length > 0
      ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length)
      : null;


  let totalCostExpected = 0;
  let totalCostActual = 0;
  for (const e of entries) {
    if (e.bcItemLedgerEntryEntryType === "Consumption") {
      totalCostExpected += Math.abs(Number(0) || 0);
      totalCostActual += Math.abs(Number(0) || 0);
    }
  }
  const costVariance =
    totalCostExpected > 0
      ? Math.round(
          ((totalCostActual - totalCostExpected) / totalCostExpected) * 100,
        )
      : null;


  let overdueCount = 0;
  for (const o of orders) {
    if (o.bcProductionOrderStatus === "Released" && o.bcProductionOrderDueDate && o.bcProductionOrderDueDate < today) {
      overdueCount++;
    }
  }


  const statusCount = {};
  for (const o of orders) {
    const s = o.bcProductionOrderStatus || "ไม่ระบุ";
    statusCount[s] = (statusCount[s] || 0) + 1;
  }
  const ordersByStatus = Object.entries(statusCount).map(
    ([status, count]) => ({ status, count }),
  );


  const projectMap = {};
  for (const e of entries) {
    const order = orderMap[e.bcItemLedgerEntryDocumentNo];
    const projectCode =
      order?.bcProductionOrderShortcutDimension2Code || e.bcItemLedgerEntryGlobalDimension2Code || "ไม่ระบุ";
    const projectName =
      order?.bcProductionOrderShortcutDimension2Code || e.bcItemLedgerEntryGlobalDimension2Code || projectCode;
    const key = projectCode;
    if (!projectMap[key])
      projectMap[key] = {
        project: projectName,
        consumptionCost: 0,
        revenue: 0,
      };
    if (e.bcItemLedgerEntryEntryType === "Consumption") {
      projectMap[key].consumptionCost += Math.abs(
        Number(0) || 0,
      );
    } else if (e.bcItemLedgerEntryEntryType === "Output") {
      const qty = Number(e.bcItemLedgerEntryQuantityValue) || 0;
      const unitPrice = salesPriceMap[e.bcItemLedgerEntryItemNo] || 0;
      projectMap[key].revenue += unitPrice * qty;
    }
  }
  const costByProject = Object.values(projectMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 15);


  const dailyMap = {};
  for (const e of entries) {
    if (!e.bcItemLedgerEntryPostingDate) continue;
    const d = e.bcItemLedgerEntryPostingDate.slice(0, 10);
    if (!dailyMap[d]) dailyMap[d] = { consumption: 0, revenue: 0 };
    if (e.bcItemLedgerEntryEntryType === "Consumption") {
      dailyMap[d].consumption += Math.abs(Number(0) || 0);
    } else if (e.bcItemLedgerEntryEntryType === "Output") {
      const qty = Number(e.bcItemLedgerEntryQuantityValue) || 0;
      const unitPrice = salesPriceMap[e.bcItemLedgerEntryItemNo] || 0;
      dailyMap[d].revenue += unitPrice * qty;
    }
  }
  const dailyTrend = Object.entries(dailyMap)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));


  const itemMap = {};
  for (const e of entries) {
    if (e.bcItemLedgerEntryEntryType !== "Output") continue;
    const key = e.bcItemLedgerEntryItemNo || "ไม่ระบุ";
    if (!itemMap[key])
      itemMap[key] = { itemNo: key, description: e.bcItemLedgerEntryItemDescription, quantity: 0 };
    itemMap[key].quantity += Number(e.bcItemLedgerEntryQuantityValue) || 0;
  }
  const topOutputItems = Object.values(itemMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);


  const wipMap = {};
  for (const e of entries) {
    const order = orderMap[e.bcItemLedgerEntryDocumentNo];
    if (!order || order.bcProductionOrderStatus !== "Released") continue;
    const orderNo = e.bcItemLedgerEntryDocumentNo;

    const uom = e.bcItemLedgerEntryUnitOfMeasureCode || "-";
    const key = `${orderNo}::${uom}`;
    if (!wipMap[key])
      wipMap[key] = {
        orderNo,
        description: order.bcProductionOrderDescription,
        sourceNo: order.bcProductionOrderSourceNo,
        uom,
        plannedQty: Number(order.bcProductionOrderQuantity) || 0,
        outputQty: 0,
        consumptionCost: 0,
        revenue: 0,
        dueDate: order.bcProductionOrderDueDate,
        startingDateTime: order.bcProductionOrderStartingDateTime,
      };
    if (e.bcItemLedgerEntryEntryType === "Consumption") {
      wipMap[key].consumptionCost += Math.abs(
        Number(0) || 0,
      );
    } else if (e.bcItemLedgerEntryEntryType === "Output") {
      const qty = Number(e.bcItemLedgerEntryQuantityValue) || 0;
      wipMap[key].outputQty += qty;
      const unitPrice = salesPriceMap[e.bcItemLedgerEntryItemNo] || 0;
      wipMap[key].revenue += unitPrice * qty;
    }
  }
  const wipDetailAll = Object.values(wipMap).map((w) => {
    const remainQty = w.plannedQty - w.outputQty;
    const completionPct = w.plannedQty > 0
      ? Math.round((w.outputQty / w.plannedQty) * 100)
      : 0;
    return {
      ...w,
      _key: `${w.orderNo}::${w.uom}`,
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


  const consumedMap = {};
  for (const e of entries) {
    if (e.bcItemLedgerEntryEntryType !== "Consumption") continue;
    const key = e.bcItemLedgerEntryItemNo || "ไม่ระบุ";
    if (!consumedMap[key])
      consumedMap[key] = { itemNo: key, description: e.bcItemLedgerEntryItemDescription, cost: 0, quantity: 0 };
    consumedMap[key].cost += Math.abs(Number(0) || 0);
    consumedMap[key].quantity += Math.abs(Number(e.bcItemLedgerEntryQuantityValue) || 0);
  }
  const topConsumedItems = Object.values(consumedMap)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);



  const deptMap = {};
  for (const e of entries) {
    if (e.bcItemLedgerEntryEntryType !== "Consumption") continue;
    const order = orderMap[e.bcItemLedgerEntryDocumentNo];
    const deptCode = order?.bcProductionOrderShortcutDimension1Code || "ไม่ระบุ";
    const deptName = order?.bcProductionOrderShortcutDimension1Code || deptCode;
    if (!deptMap[deptCode])
      deptMap[deptCode] = { department: deptName, cost: 0 };
    deptMap[deptCode].cost += Math.abs(Number(0) || 0);
  }
  const costByDepartment = Object.values(deptMap)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);


  const monthlyOnTime = {};
  for (const o of orders) {
    if (o.bcProductionOrderStatus !== "Finished" || !o.bcProductionOrderFinishedDate || !o.bcProductionOrderDueDate) continue;
    const month = o.bcProductionOrderFinishedDate.slice(0, 7);
    if (!monthlyOnTime[month]) monthlyOnTime[month] = { total: 0, onTime: 0 };
    monthlyOnTime[month].total++;
    if (o.bcProductionOrderFinishedDate <= o.bcProductionOrderDueDate) monthlyOnTime[month].onTime++;
  }
  const onTimeTrend = Object.entries(monthlyOnTime)
    .map(([month, v]) => ({
      month,
      rate: Math.round((v.onTime / v.total) * 100),
      total: v.total,
      onTime: v.onTime,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));


  const monthlyLeadTime = {};
  for (const o of orders) {
    if (o.bcProductionOrderStatus !== "Finished" || !o.bcProductionOrderStartingDateTime || !o.bcProductionOrderFinishedDate) continue;
    const month = o.bcProductionOrderFinishedDate.slice(0, 7);
    const start = new Date(o.bcProductionOrderStartingDateTime);
    const end = new Date(o.bcProductionOrderFinishedDate);
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


  const overdueOrders = orders
    .filter((o) => o.bcProductionOrderStatus === "Released" && o.bcProductionOrderDueDate && o.bcProductionOrderDueDate < today)
    .map((o) => {
      const overdueDays = Math.round(
        (new Date(today) - new Date(o.bcProductionOrderDueDate)) / (1000 * 60 * 60 * 24),
      );
      return {
        id: o.bcProductionOrderNo,
        description: o.bcProductionOrderDescription,
        sourceNo: o.bcProductionOrderSourceNo,
        quantity: o.bcProductionOrderQuantity,
        dueDate: o.bcProductionOrderDueDate,
        startingDateTime: o.bcProductionOrderStartingDateTime,
        overdueDays,
        dimension1Name: o.bcProductionOrderShortcutDimension1Code || o.bcProductionOrderShortcutDimension1Code,
        dimension2Name: o.bcProductionOrderShortcutDimension2Code || o.bcProductionOrderShortcutDimension2Code,
        locationCode: o.bcProductionOrderLocationCode,
      };
    })
    .sort((a, b) => b.overdueDays - a.overdueDays);






  const empSpecMap = {};
  for (const e of entries) {
    if (e.bcItemLedgerEntryEntryType !== "Output") continue;
    const raw = e.bcItemLedgerEntryGlobalDimension1Code || e.bcItemLedgerEntryGlobalDimension1Code || "ไม่ระบุ";
    const workers = raw.split("/").map((w) => w.trim()).filter(Boolean);
    if (!workers.length) workers.push("ไม่ระบุ");
    const cat = itemLookup[e.bcItemLedgerEntryItemNo]?.bcItemItemCategoryCode || "ไม่ระบุ";
    const qty = Number(e.bcItemLedgerEntryQuantityValue) || 0;
    const order = orderMap[e.bcItemLedgerEntryDocumentNo];

    let leadDays = null;
    if (order?.bcProductionOrderStartingDateTime && order?.bcProductionOrderFinishedDate) {
      const start = new Date(order.bcProductionOrderStartingDateTime);
      const end = new Date(order.bcProductionOrderFinishedDate);
      const d = Math.round((end - start) / (1000 * 60 * 60 * 24));
      if (d >= 0) leadDays = d;
    }
    for (const worker of workers) {
      if (!empSpecMap[worker])
        empSpecMap[worker] = { employee: worker, categories: {}, totalQty: 0, totalLeadDays: 0, orderCount: 0 };
      if (!empSpecMap[worker].categories[cat])
        empSpecMap[worker].categories[cat] = { quantity: 0, leadDays: [], orderNos: new Set() };
      empSpecMap[worker].categories[cat].quantity += qty;
      empSpecMap[worker].totalQty += qty;

      if (leadDays !== null && !empSpecMap[worker].categories[cat].orderNos.has(e.bcItemLedgerEntryDocumentNo)) {
        empSpecMap[worker].categories[cat].leadDays.push(leadDays);
        empSpecMap[worker].categories[cat].orderNos.add(e.bcItemLedgerEntryDocumentNo);
        empSpecMap[worker].totalLeadDays += leadDays;
        empSpecMap[worker].orderCount++;
      }
    }
  }
  const employeeSpecialization = Object.values(empSpecMap)
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 15)
    .map((emp) => {
      const cats = Object.entries(emp.categories)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .map(([category, data]) => {
          const avgDays = data.leadDays.length > 0
            ? Math.round(data.leadDays.reduce((a, b) => a + b, 0) / data.leadDays.length)
            : null;
          return { category, quantity: data.quantity, avgDays, orders: data.leadDays.length };
        });
      const avgLeadTime = emp.orderCount > 0
        ? Math.round(emp.totalLeadDays / emp.orderCount)
        : null;
      return {
        employee: emp.employee,
        totalQty: emp.totalQty,
        avgLeadTime,
        orderCount: emp.orderCount,
        topCategory: cats[0]?.category || "-",
        categories: cats,
      };
    });


  const fgTypeMap = {};
  for (const e of entries) {
    if (e.bcItemLedgerEntryEntryType !== "Output") continue;
    const cat = itemLookup[e.bcItemLedgerEntryItemNo]?.bcItemItemCategoryCode || "ไม่ระบุ";
    if (!fgTypeMap[cat])
      fgTypeMap[cat] = { category: cat, quantity: 0, revenue: 0, count: 0 };
    const qty = Number(e.bcItemLedgerEntryQuantityValue) || 0;
    const unitPrice = salesPriceMap[e.bcItemLedgerEntryItemNo] || 0;
    fgTypeMap[cat].quantity += qty;
    fgTypeMap[cat].revenue += unitPrice * qty;
    fgTypeMap[cat].count++;
  }
  const fgByProductType = Object.values(fgTypeMap)
    .sort((a, b) => b.quantity - a.quantity);



  const profitMap = {};
  for (const e of entries) {
    if (e.bcItemLedgerEntryEntryType !== "Output") continue;
    const key = e.bcItemLedgerEntryItemNo || "ไม่ระบุ";
    if (!profitMap[key])
      profitMap[key] = {
        itemNo: key,
        description: e.bcItemLedgerEntryItemDescription,
        category: itemLookup[e.bcItemLedgerEntryItemNo]?.bcItemItemCategoryCode || "-",
        outputQty: 0,
        consumptionCost: 0,
      };
    profitMap[key].outputQty += Number(e.bcItemLedgerEntryQuantityValue) || 0;
  }
  for (const e of entries) {
    if (e.bcItemLedgerEntryEntryType !== "Consumption") continue;
    const order = orderMap[e.bcItemLedgerEntryDocumentNo];
    if (!order) continue;
    const fgItem = order.bcProductionOrderSourceNo;
    if (fgItem && profitMap[fgItem]) {
      profitMap[fgItem].consumptionCost += Math.abs(
        Number(0) || 0,
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
    .sort((a, b) => b.totalRevenue - a.totalRevenue);



  const projItemMap = {};
  for (const e of entries) {
    if (e.bcItemLedgerEntryEntryType !== "Output") continue;
    const order = orderMap[e.bcItemLedgerEntryDocumentNo];
    const projCode = order?.bcProductionOrderShortcutDimension2Code || e.bcItemLedgerEntryGlobalDimension2Code || "ไม่ระบุ";
    const projName = order?.bcProductionOrderShortcutDimension2Code || e.bcItemLedgerEntryGlobalDimension2Code || projCode;
    const itemNo = e.bcItemLedgerEntryItemNo || "ไม่ระบุ";
    const key = `${projCode}::${itemNo}`;
    if (!projItemMap[key])
      projItemMap[key] = {
        projectCode: projCode,
        projectName: projName,
        itemNo,
        description: e.bcItemLedgerEntryItemDescription,
        category: itemLookup[e.bcItemLedgerEntryItemNo]?.bcItemItemCategoryCode || "-",
        outputQty: 0,
        consumptionCost: 0,
      };
    projItemMap[key].outputQty += Number(e.bcItemLedgerEntryQuantityValue) || 0;
  }

  for (const e of entries) {
    if (e.bcItemLedgerEntryEntryType !== "Consumption") continue;
    const order = orderMap[e.bcItemLedgerEntryDocumentNo];
    if (!order) continue;
    const projCode = order.bcProductionOrderShortcutDimension2Code || e.bcItemLedgerEntryGlobalDimension2Code || "ไม่ระบุ";
    const fgItem = order.bcProductionOrderSourceNo;
    const key = `${projCode}::${fgItem}`;
    if (projItemMap[key]) {
      projItemMap[key].consumptionCost += Math.abs(Number(0) || 0);
    }
  }


  const salesByProjItem = {};
  for (const sl of salesLines) {
    if (!sl.bcSalesOrderLineNoValue || !sl.bcSalesOrderLineUnitPrice) continue;
    const projCode = "ไม่ระบุ" || "ไม่ระบุ";
    const key = `${projCode}::${sl.bcSalesOrderLineNoValue}`;
    if (!salesByProjItem[key])
      salesByProjItem[key] = {
        soQty: 0,
        soRevenue: 0,
        unitPrice: Number(sl.bcSalesOrderLineUnitPrice) || 0,
        shippedQty: 0,
      };
    salesByProjItem[key].soQty += Number(sl.bcSalesOrderLineQuantityValue) || 0;
    salesByProjItem[key].soRevenue += (Number(sl.bcSalesOrderLineUnitPrice) || 0) * (Number(sl.bcSalesOrderLineQuantityValue) || 0);
    salesByProjItem[key].shippedQty += Number(sl.bcSalesOrderLineQuantityValueShipped) || 0;

    if ((Number(sl.bcSalesOrderLineUnitPrice) || 0) > 0) {
      salesByProjItem[key].unitPrice = Number(sl.bcSalesOrderLineUnitPrice);
    }
  }


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

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const compareMode = url.searchParams.get("compareMode");

  try {
    const [allOrders, allEntries, salesLines, items] = await Promise.all([
      fetchAll(auth.supabase, "bcProductionOrder"),
      fetchAll(auth.supabase, "bcItemLedgerEntry", "bcItemLedgerEntryEntryNo"),
      fetchAll(auth.supabase, "bcSalesOrderLine", "bcSalesOrderLineDocumentNo"),
      fetchAll(auth.supabase, "bcItem", "bcItemNo"),
    ]);

    const orderMap = {};
    for (const o of allOrders) {
      orderMap[o.bcProductionOrderNo] = o;
    }

    const itemLookup = {};
    for (const it of items) {
      itemLookup[it.bcItemNo] = it;
    }

    const salesPriceMap = {};
    for (const sl of salesLines) {
      if (sl.bcSalesOrderLineNoValue && sl.bcSalesOrderLineUnitPrice > 0) {
        salesPriceMap[sl.bcSalesOrderLineNoValue] = Number(sl.bcSalesOrderLineUnitPrice);
      }
    }

    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });


    const splitAndBuild = (orders, entries) => {
      const wpcOrders = orders.filter((o) => o.bcProductionOrderShortcutDimension1Code === "WPC");
      const otherOrders = orders.filter((o) => o.bcProductionOrderShortcutDimension1Code !== "WPC");
      const wpcEntries = entries.filter((e) => getDept(orderMap[e.bcItemLedgerEntryDocumentNo]) === "WPC");
      const otherEntries = entries.filter((e) => getDept(orderMap[e.bcItemLedgerEntryDocumentNo]) !== "WPC");
      return {
        wpc: buildDashboard(wpcOrders, wpcEntries, orderMap, itemLookup, salesPriceMap, salesLines, today),
        other: buildDashboard(otherOrders, otherEntries, orderMap, itemLookup, salesPriceMap, salesLines, today),
      };
    };


    if (!compareMode) {
      const { wpc, other } = splitAndBuild(allOrders, allEntries);
      return Response.json({ wpc, other });
    }


    const ranges = getComparisonRanges(compareMode);

    const curOrders = filterByDateRange(allOrders, "bcProductionOrderDueDate", ranges.current.start, ranges.current.end);
    const curEntries = filterByDateRange(allEntries, "bcItemLedgerEntryPostingDate", ranges.current.start, ranges.current.end);
    const prevOrders = filterByDateRange(allOrders, "bcProductionOrderDueDate", ranges.previous.start, ranges.previous.end);
    const prevEntries = filterByDateRange(allEntries, "bcItemLedgerEntryPostingDate", ranges.previous.start, ranges.previous.end);

    const current = splitAndBuild(curOrders, curEntries);
    const previous = splitAndBuild(prevOrders, prevEntries);

    return Response.json({
      compareMode,
      labels: { current: ranges.current.label, previous: ranges.previous.label },
      wpc: { current: current.wpc, previous: previous.wpc },
      other: { current: current.other, previous: previous.other },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
