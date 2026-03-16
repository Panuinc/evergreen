import { withAuth } from "@/app/api/_lib/auth";

const PAGE_SIZE = 1000;

async function fetchAll(supabase, table, orderBy) {
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
    const [allOrders, salesLines, items] = await Promise.all([
      fetchAll(auth.supabase, "bcProductionOrder", "bcProductionOrderExternalId"),
      fetchAll(auth.supabase, "bcSalesOrderLine", "bcSalesOrderLineExternalId"),
      fetchAll(auth.supabase, "bcItem", "bcItemExternalId"),
    ]);

    const itemLookup = {};
    for (const it of items) {
      itemLookup[it.bcItemExternalId] = it;
    }

    // Production orders grouped by source item number
    const poBySourceNo = {};
    for (const o of allOrders) {
      const src = o.bcProductionOrderSourceNo;
      if (!src) continue;
      if (!poBySourceNo[src]) poBySourceNo[src] = [];
      poBySourceNo[src].push({
        orderNo: o.bcProductionOrderExternalId,
        status: o.bcProductionOrderStatus,
        quantity: Number(o.bcProductionOrderQuantity) || 0,
        dueDate: o.bcProductionOrderDueDate,
      });
    }

    // SO lines with outstanding qty, grouped by item number
    const fgCoverageMap = {};
    for (const sl of salesLines) {
      const itemNo = sl.bcSalesOrderLineObjectNumber;
      if (!itemNo) continue;
      if (sl.bcSalesOrderLineType && sl.bcSalesOrderLineType !== "Item") continue;
      const outstanding = Number(sl.bcSalesOrderLineOutstandingQuantity) || 0;
      if (outstanding <= 0) continue;

      if (!fgCoverageMap[itemNo]) {
        fgCoverageMap[itemNo] = {
          itemNo,
          description: sl.bcSalesOrderLineDescription,
          category: itemLookup[itemNo]?.bcItemCategoryCode || "-",
          soQty: 0,
          soOutstandingQty: 0,
          shippedQty: 0,
          soLineCount: 0,
        };
      }
      fgCoverageMap[itemNo].soQty += Number(sl.bcSalesOrderLineQuantity) || 0;
      fgCoverageMap[itemNo].soOutstandingQty += outstanding;
      fgCoverageMap[itemNo].shippedQty += Number(sl.bcSalesOrderLineQuantityShipped) || 0;
      fgCoverageMap[itemNo].soLineCount++;
    }

    const fgCoverage = Object.values(fgCoverageMap)
      .map((fg) => {
        const pos = poBySourceNo[fg.itemNo] || [];
        const poTotalQty = pos.reduce((sum, po) => sum + po.quantity, 0);
        const statuses = [...new Set(pos.map((po) => po.status))];
        return {
          ...fg,
          hasProductionOrder: pos.length > 0,
          poCount: pos.length,
          poTotalQty,
          poStatuses: statuses,
          productionOrders: pos,
        };
      })
      .sort(
        (a, b) =>
          a.hasProductionOrder - b.hasProductionOrder ||
          b.soOutstandingQty - a.soOutstandingQty,
      );

    return Response.json({ fgCoverage });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
