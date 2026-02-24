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

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const entries = await fetchAllEntries(auth.supabase);

    // Group by orderNo
    const orderMap = {};
    for (const e of entries) {
      const k = e.orderNo;
      if (!k) continue;
      if (!orderMap[k]) {
        orderMap[k] = {
          orderNo: k,
          consumptionCost: 0,
          outputCost: 0,
          consumptionCount: 0,
          outputCount: 0,
          totalQty: 0,
          outputQty: 0,
          materials: new Set(),
          outputs: new Set(),
          locations: new Set(),
          dim1: null,
          dim2: null,
          firstDate: e.postingDate,
          lastDate: e.postingDate,
          createdBy: e.createdBy || "-",
          hasOpen: false,
        };
      }
      const o = orderMap[k];

      if (e.entryType === "Consumption") {
        o.consumptionCost += abs(e.costAmountActual);
        o.consumptionCount++;
        o.totalQty += abs(e.quantity);
        if (e.itemNo) o.materials.add(e.itemNo);
      }
      if (e.entryType === "Output") {
        o.outputCost += abs(e.costAmountActual);
        o.outputCount++;
        o.outputQty += abs(e.quantity);
        if (e.itemNo) o.outputs.add(e.itemNo);
      }
      if (e.locationCode) o.locations.add(e.locationCode);
      if (!o.dim1 && e.globalDimension1Code) o.dim1 = e.globalDimension1Code;
      if (!o.dim2 && e.globalDimension2Code) o.dim2 = e.globalDimension2Code;
      if (e.postingDate && e.postingDate < o.firstDate) o.firstDate = e.postingDate;
      if (e.postingDate && e.postingDate > o.lastDate) o.lastDate = e.postingDate;
      if (e.open) o.hasOpen = true;
    }

    const orders = Object.values(orderMap)
      .map((o) => ({
        orderNo: o.orderNo,
        consumptionCost: Math.round(o.consumptionCost),
        outputCost: Math.round(o.outputCost),
        consumptionCount: o.consumptionCount,
        outputCount: o.outputCount,
        totalQty: Math.round(o.totalQty * 100) / 100,
        outputQty: Math.round(o.outputQty * 100) / 100,
        materialsCount: o.materials.size,
        outputsCount: o.outputs.size,
        locations: [...o.locations].join(", "),
        dim1: o.dim1 || "-",
        dim2: o.dim2 || "-",
        firstDate: o.firstDate,
        lastDate: o.lastDate,
        createdBy: o.createdBy,
        yieldRate: o.consumptionCost > 0 ? Math.round((o.outputCost / o.consumptionCost) * 1000) / 10 : 0,
        status: o.hasOpen ? "เปิด" : "ปิด",
      }))
      .sort((a, b) => b.consumptionCost - a.consumptionCost);

    return Response.json(orders);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
