import { withAuth } from "@/app/api/_lib/auth";

const PAGE_SIZE = 1000;

async function fetchAll(supabase, table, orderBy = "id", ascending = false) {
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
      fetchAll(auth.supabase, "bcProductionOrders", "id", false),
      fetchAll(auth.supabase, "bcItemLedgerEntries", "entryNo", true),
      fetchAll(auth.supabase, "bcSalesOrderLines", "id", true),
    ]);

    // Build sales price map: itemNo → latest unitPrice
    const salesPriceMap = {};
    for (const sl of salesLines) {
      if (sl.lineObjectNumber && sl.unitPrice > 0) {
        salesPriceMap[sl.lineObjectNumber] = Number(sl.unitPrice);
      }
    }

    // Aggregate cost & output per production order
    const orderCostMap = {};
    for (const e of entries) {
      if (!e.documentNo) continue;
      if (!orderCostMap[e.documentNo]) {
        orderCostMap[e.documentNo] = {
          consumptionCost: 0,
          outputQty: 0,
          outputCost: 0,
        };
      }
      if (e.entryType === "Consumption") {
        orderCostMap[e.documentNo].consumptionCost += Math.abs(
          Number(e.costAmountActual) || 0,
        );
      } else if (e.entryType === "Output") {
        orderCostMap[e.documentNo].outputQty += Number(e.quantity) || 0;
        orderCostMap[e.documentNo].outputCost += Number(e.costAmountActual) || 0;
      }
    }

    // Enrich orders with cost, revenue, profit
    const enriched = orders.map((o) => {
      const c = orderCostMap[o.id] || {
        consumptionCost: 0,
        outputQty: 0,
        outputCost: 0,
      };
      const unitPrice = salesPriceMap[o.sourceNo] || 0;
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
