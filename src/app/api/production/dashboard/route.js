import { withAuth } from "@/app/api/_lib/auth";

const PAGE_SIZE = 1000;

async function fetchAllEntries(supabase) {
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("bcItemLedgerEntries")
      .select("*")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

function abs(val) {
  return Math.abs(parseFloat(val) || 0);
}

function topN(map, n = 10) {
  return Object.values(map)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, n);
}

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const entries = await fetchAllEntries(auth.supabase);
    const consumption = entries.filter((e) => e.entryType === "Consumption");
    const output = entries.filter((e) => e.entryType === "Output");

    // ═══ KPI ═══
    const uniqueOrders = new Set(entries.map((e) => e.orderNo).filter(Boolean));
    const uniqueItems = new Set(consumption.map((e) => e.itemNo).filter(Boolean));
    const uniqueFG = new Set(output.map((e) => e.itemNo).filter(Boolean));
    const uniqueLocations = new Set(entries.map((e) => e.locationCode).filter(Boolean));
    const totalConsumptionCost = consumption.reduce((s, e) => s + abs(e.costAmountActual), 0);
    const totalOutputCost = output.reduce((s, e) => s + abs(e.costAmountActual), 0);

    // ═══ 1. Daily trend (count + cost) ═══
    const dailyMap = {};
    for (const e of entries) {
      if (!e.postingDate) continue;
      if (!dailyMap[e.postingDate]) {
        dailyMap[e.postingDate] = { date: e.postingDate, consumption: 0, output: 0, cost: 0 };
      }
      if (e.entryType === "Consumption") {
        dailyMap[e.postingDate].consumption++;
        dailyMap[e.postingDate].cost += abs(e.costAmountActual);
      }
      if (e.entryType === "Output") dailyMap[e.postingDate].output++;
    }
    const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // ═══ 2. Monthly comparison ═══
    const monthlyMap = {};
    for (const e of entries) {
      if (!e.postingDate) continue;
      const m = e.postingDate.substring(0, 7);
      if (!monthlyMap[m]) monthlyMap[m] = { month: m, consumption: 0, output: 0, cost: 0, orders: new Set() };
      if (e.entryType === "Consumption") {
        monthlyMap[m].consumption++;
        monthlyMap[m].cost += abs(e.costAmountActual);
      }
      if (e.entryType === "Output") monthlyMap[m].output++;
      if (e.orderNo) monthlyMap[m].orders.add(e.orderNo);
    }
    const monthlyComparison = Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({ month: m.month, consumption: m.consumption, output: m.output, cost: m.cost, orders: m.orders.size }));

    // ═══ 3. Cost by production line (Dim1) — top groups ═══
    const dim1Map = {};
    for (const e of consumption) {
      const raw = e.globalDimension1Code || "ไม่ระบุ";
      const key = raw.split("/")[0].trim();
      if (!dim1Map[key]) dim1Map[key] = { line: key, cost: 0, count: 0 };
      dim1Map[key].cost += abs(e.costAmountActual);
      dim1Map[key].count++;
    }
    const costByLine = Object.values(dim1Map).sort((a, b) => b.cost - a.cost).slice(0, 10);

    // ═══ 4. Top consumed materials by cost ═══
    const matMap = {};
    for (const e of consumption) {
      const k = e.itemNo || "unknown";
      if (!matMap[k]) matMap[k] = { itemNo: k, description: e.description || k, qty: 0, cost: 0, count: 0 };
      matMap[k].qty += abs(e.quantity);
      matMap[k].cost += abs(e.costAmountActual);
      matMap[k].count++;
    }
    const topMaterials = topN(matMap);

    // ═══ 5. Top output FG by quantity ═══
    const fgMap = {};
    for (const e of output) {
      const k = e.itemNo || "unknown";
      if (!fgMap[k]) fgMap[k] = { itemNo: k, description: e.description || k, qty: 0, cost: 0, count: 0 };
      fgMap[k].qty += abs(e.quantity);
      fgMap[k].cost += abs(e.costAmountActual);
      fgMap[k].count++;
    }
    const topOutputItems = Object.values(fgMap).sort((a, b) => b.qty - a.qty).slice(0, 10);

    // ═══ 6. Cost by project (Dim2) ═══
    const projMap = {};
    for (const e of consumption) {
      const k = e.globalDimension2Code || "ไม่ระบุ";
      if (!projMap[k]) projMap[k] = { project: k, cost: 0, count: 0 };
      projMap[k].cost += abs(e.costAmountActual);
      projMap[k].count++;
    }
    const costByProject = topN(projMap);

    // ═══ 7. Top production orders by cost ═══
    const orderMap = {};
    for (const e of consumption) {
      const k = e.orderNo || "unknown";
      if (!orderMap[k]) orderMap[k] = { orderNo: k, cost: 0, items: 0, date: e.postingDate };
      orderMap[k].cost += abs(e.costAmountActual);
      orderMap[k].items++;
    }
    const costByOrder = topN(orderMap);

    // ═══ 8. Consumption by location ═══
    const locMap = {};
    for (const e of consumption) {
      const k = e.locationCode || "ไม่ระบุ";
      if (!locMap[k]) locMap[k] = { location: k, count: 0, cost: 0 };
      locMap[k].count++;
      locMap[k].cost += abs(e.costAmountActual);
    }
    const consumptionByLocation = Object.values(locMap).sort((a, b) => b.cost - a.cost);

    // ═══ 9. By operator (createdBy) ═══
    const opMap = {};
    for (const e of entries) {
      const k = e.createdBy || "ไม่ระบุ";
      if (!opMap[k]) opMap[k] = { name: k, consumption: 0, output: 0, cost: 0 };
      if (e.entryType === "Consumption") {
        opMap[k].consumption++;
        opMap[k].cost += abs(e.costAmountActual);
      }
      if (e.entryType === "Output") opMap[k].output++;
    }
    const byOperator = Object.values(opMap).sort((a, b) => b.cost - a.cost);

    // ═══ 10. Source FG → material cost ═══
    const srcMap = {};
    for (const e of consumption) {
      const k = e.sourceNo || "unknown";
      if (!srcMap[k]) srcMap[k] = { sourceNo: k, description: (e.sourceDescription || "").substring(0, 60), cost: 0, items: 0 };
      srcMap[k].cost += abs(e.costAmountActual);
      srcMap[k].items++;
    }
    const topSourceProducts = topN(srcMap, 15);

    // ═══ 11. Unit of measure breakdown ═══
    const uomMap = {};
    for (const e of entries) {
      const k = e.unitOfMeasureCode || "ไม่ระบุ";
      uomMap[k] = (uomMap[k] || 0) + 1;
    }
    const unitOfMeasure = Object.entries(uomMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // ═══ 12. Unit cost per output item ═══
    const unitCostMap = {};
    for (const e of output) {
      const k = e.itemNo || "unknown";
      if (!unitCostMap[k]) unitCostMap[k] = { itemNo: k, description: e.description || k, totalCost: 0, totalQty: 0 };
      unitCostMap[k].totalCost += abs(e.costAmountActual);
      unitCostMap[k].totalQty += abs(e.quantity);
    }
    const unitCostAnalysis = Object.values(unitCostMap)
      .map((d) => ({ ...d, unitCost: d.totalQty > 0 ? Math.round(d.totalCost / d.totalQty) : 0 }))
      .sort((a, b) => b.unitCost - a.unitCost)
      .slice(0, 15);

    // ═══ 13. Yield rate per order (output cost / consumption cost) ═══
    const yieldMap = {};
    for (const e of entries) {
      const k = e.orderNo;
      if (!k) continue;
      if (!yieldMap[k]) yieldMap[k] = { orderNo: k, consumptionCost: 0, outputCost: 0 };
      if (e.entryType === "Consumption") yieldMap[k].consumptionCost += abs(e.costAmountActual);
      if (e.entryType === "Output") yieldMap[k].outputCost += abs(e.costAmountActual);
    }
    const yieldByOrder = Object.values(yieldMap)
      .filter((d) => d.consumptionCost > 0)
      .map((d) => ({ ...d, yieldRate: parseFloat(((d.outputCost / d.consumptionCost) * 100).toFixed(1)) }))
      .sort((a, b) => b.consumptionCost - a.consumptionCost)
      .slice(0, 15);

    // ═══ 14. Expected vs Actual cost variance ═══
    const varMap = {};
    for (const e of consumption) {
      const k = e.itemNo || "unknown";
      if (!varMap[k]) varMap[k] = { itemNo: k, description: e.description || k, expected: 0, actual: 0 };
      varMap[k].expected += abs(e.costAmountExpected);
      varMap[k].actual += abs(e.costAmountActual);
    }
    const costVariance = Object.values(varMap)
      .map((d) => ({ ...d, variance: d.actual - d.expected }))
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
      .slice(0, 15);

    // ═══ 15. Production heatmap (by day of week) ═══
    const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    const heatCons = [0, 0, 0, 0, 0, 0, 0];
    const heatOut = [0, 0, 0, 0, 0, 0, 0];
    for (const e of entries) {
      if (!e.postingDate) continue;
      const day = new Date(e.postingDate).getDay();
      if (e.entryType === "Consumption") heatCons[day]++;
      if (e.entryType === "Output") heatOut[day]++;
    }
    const productionHeatmap = dayNames.map((name, i) => ({
      day: name,
      consumption: heatCons[i],
      output: heatOut[i],
      total: heatCons[i] + heatOut[i],
    }));

    // ═══ 16. Order breakdown (top 10 detail) ═══
    const brkMap = {};
    for (const e of entries) {
      const k = e.orderNo;
      if (!k) continue;
      if (!brkMap[k]) brkMap[k] = { orderNo: k, consumptionCost: 0, outputCost: 0, consumptionCount: 0, outputCount: 0, materials: new Set(), outputs: new Set(), firstDate: e.postingDate, lastDate: e.postingDate };
      if (e.entryType === "Consumption") {
        brkMap[k].consumptionCost += abs(e.costAmountActual);
        brkMap[k].consumptionCount++;
        if (e.itemNo) brkMap[k].materials.add(e.itemNo);
      }
      if (e.entryType === "Output") {
        brkMap[k].outputCost += abs(e.costAmountActual);
        brkMap[k].outputCount++;
        if (e.itemNo) brkMap[k].outputs.add(e.itemNo);
      }
      if (e.postingDate < brkMap[k].firstDate) brkMap[k].firstDate = e.postingDate;
      if (e.postingDate > brkMap[k].lastDate) brkMap[k].lastDate = e.postingDate;
    }
    const orderBreakdown = Object.values(brkMap)
      .sort((a, b) => b.consumptionCost - a.consumptionCost)
      .slice(0, 10)
      .map((d) => ({ orderNo: d.orderNo, consumptionCost: d.consumptionCost, outputCost: d.outputCost, consumptionCount: d.consumptionCount, outputCount: d.outputCount, materials: d.materials.size, outputs: d.outputs.size, firstDate: d.firstDate, lastDate: d.lastDate }));

    // ═══ 17. WIP (open entries / remaining qty) ═══
    const wipEntries = entries.filter((e) => e.open === true || (parseFloat(e.remainingQuantity) || 0) !== 0);
    const wipMap = {};
    for (const e of wipEntries) {
      const k = e.itemNo || "unknown";
      if (!wipMap[k]) wipMap[k] = { itemNo: k, description: e.description || k, remaining: 0, count: 0, cost: 0 };
      wipMap[k].remaining += parseFloat(e.remainingQuantity) || 0;
      wipMap[k].count++;
      wipMap[k].cost += abs(e.costAmountActual);
    }
    const wipItems = Object.values(wipMap).sort((a, b) => b.cost - a.cost).slice(0, 15);

    // ═══ 18. Bin analysis ═══
    const binMap = {};
    for (const e of entries) {
      const k = e.bwkBinCode || "ไม่ระบุ";
      if (!binMap[k]) binMap[k] = { bin: k, count: 0, cost: 0 };
      binMap[k].count++;
      binMap[k].cost += abs(e.costAmountActual);
    }
    const binAnalysis = Object.values(binMap).sort((a, b) => b.count - a.count);

    return Response.json({
      // KPI
      totalOrders: uniqueOrders.size,
      consumptionCount: consumption.length,
      outputCount: output.length,
      uniqueMaterials: uniqueItems.size,
      uniqueFG: uniqueFG.size,
      totalLocations: uniqueLocations.size,
      totalConsumptionCost,
      totalOutputCost,
      wipCount: wipEntries.length,
      // Charts
      dailyTrend,
      monthlyComparison,
      costByLine,
      topMaterials,
      topOutputItems,
      costByProject,
      costByOrder,
      consumptionByLocation,
      byOperator,
      topSourceProducts,
      unitOfMeasure,
      unitCostAnalysis,
      yieldByOrder,
      costVariance,
      productionHeatmap,
      orderBreakdown,
      wipItems,
      binAnalysis,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
