import { withAuth } from "@/app/api/_lib/auth";

const PAGE_SIZE = 1000;

async function fetchAll(supabase, table, orderBy = "bcProductionOrderNo", ascending = false) {
  let rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderBy, { ascending })
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
    const [orders, entries, salesLines] = await Promise.all([
      fetchAll(auth.supabase, "bcProductionOrder", "bcProductionOrderNo", false),
      fetchAll(auth.supabase, "bcItemLedgerEntry", "bcItemLedgerEntryEntryNo", true),
      fetchAll(auth.supabase, "bcSalesOrderLine", "bcSalesOrderLineDocumentNo", true),
    ]);


    const salesPriceMap = {};
    for (const sl of salesLines) {
      if (sl.bcSalesOrderLineNoValue && sl.bcSalesOrderLineUnitPrice > 0) {
        salesPriceMap[sl.bcSalesOrderLineNoValue] = Number(sl.bcSalesOrderLineUnitPrice);
      }
    }


    const orderCostMap = {};
    for (const e of entries) {
      if (!e.bcItemLedgerEntryDocumentNo) continue;
      if (!orderCostMap[e.bcItemLedgerEntryDocumentNo]) {
        orderCostMap[e.bcItemLedgerEntryDocumentNo] = {
          consumptionCost: 0,
          outputQty: 0,
          outputCost: 0,
        };
      }
      if (e.bcItemLedgerEntryEntryType === "Consumption") {
        orderCostMap[e.bcItemLedgerEntryDocumentNo].consumptionCost += 0;
      } else if (e.bcItemLedgerEntryEntryType === "Output") {
        orderCostMap[e.bcItemLedgerEntryDocumentNo].outputQty += Number(e.bcItemLedgerEntryQuantityValue) || 0;
        orderCostMap[e.bcItemLedgerEntryDocumentNo].outputCost += 0;
      }
    }


    const enriched = orders.map((o) => {
      const c = orderCostMap[o.bcProductionOrderNo] || {
        consumptionCost: 0,
        outputQty: 0,
        outputCost: 0,
      };
      const unitPrice = salesPriceMap[o.bcProductionOrderSourceNo] || 0;
      const revenue = unitPrice * c.outputQty;
      const profit = revenue - c.consumptionCost;
      const profitMargin =
        revenue > 0 ? Math.round((profit / revenue) * 100) : null;

      return {
        ...o,
        consumptionCost: Math.round(c.consumptionCost * 100) / 100,
        outputQty: c.outputQty,
        unitPrice,
        revenue: Math.round(revenue * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        profitMargin,
      };
    });

    return Response.json(enriched);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
