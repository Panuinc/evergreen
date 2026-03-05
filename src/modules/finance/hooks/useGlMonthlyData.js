"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { getGlMonthlySummary } from "@/modules/finance/actions";
import {
  classifyAccount,
  computeAdjustedCogs,
  computeMonthlyPnL,
  computeCogsDetail,
  computeExpenseDetail,
  computeRevenueDetail,
  CAL_MONTHS,
  CAL_MONTHS_SHORT,
} from "@/modules/finance/glAccountMap";

const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

/**
 * Convert GL monthly summary (server-aggregated) → { byAccount, monthlyTotals }.
 * Input format: { "41000-01": { name, months: { "01": { debit, credit }, ... } }, ... }
 */
function aggregateGlSummary(summary) {
  const byAccount = {};

  for (const [acct, info] of Object.entries(summary)) {
    const cat = classifyAccount(acct);
    const isCredit = ["salesRevenue", "serviceRevenue", "otherIncome", "liabilities", "equity"].includes(cat);

    byAccount[acct] = {
      account: acct,
      name: info.name || acct,
      category: cat,
      months: {},
      total: 0,
    };

    for (const [month, { debit, credit }] of Object.entries(info.months || {})) {
      const net = isCredit ? (credit - debit) : (debit - credit);
      byAccount[acct].months[month] = (byAccount[acct].months[month] || 0) + net;
      byAccount[acct].total += net;
    }
  }

  // Compute monthly totals by category
  const monthlyTotals = {};
  for (const acctData of Object.values(byAccount)) {
    const cat = acctData.category;
    if (!monthlyTotals[cat]) {
      monthlyTotals[cat] = { months: {}, total: 0 };
      for (const m of MONTHS) monthlyTotals[cat].months[m] = 0;
    }
    for (const m of MONTHS) {
      monthlyTotals[cat].months[m] += acctData.months[m] || 0;
    }
    monthlyTotals[cat].total += acctData.total;
  }

  return { byAccount, monthlyTotals };
}

/**
 * Build key→total maps from compute functions for comparison columns.
 */
function buildCompMaps(byAccount, monthlyTotals) {
  const toMap = (rows) => {
    const m = {};
    for (const r of rows) if (r.key) m[r.key] = r.total || 0;
    return m;
  };
  return {
    pnl: toMap(computeMonthlyPnL(byAccount, monthlyTotals)),
    cogs: toMap(computeCogsDetail(byAccount)),
    selling: toMap(computeExpenseDetail(byAccount, "selling")),
    admin: toMap(computeExpenseDetail(byAccount, "admin")),
    interest: toMap(computeExpenseDetail(byAccount, "interest")),
    revenue: toMap(computeRevenueDetail(byAccount)),
  };
}

/**
 * Hook to fetch monthly GL entry summaries for 3 years and compute financial breakdowns.
 * Fetches 3 API calls (1 per year) instead of 36 monthly TBs.
 * @param {number} year - Primary fiscal year (AD)
 * @param {boolean} enabled - Only fetch when true
 */
export function useGlMonthlyData(year, enabled = true) {
  const [allYearsData, setAllYearsData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const years = useMemo(() => [year - 2, year - 1, year], [year]);

  useEffect(() => {
    if (!year || !enabled) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Fetch GL monthly summary for each of 3 years (3 parallel calls)
        const results = await Promise.all(
          years.map((y) => getGlMonthlySummary(y)),
        );

        if (!cancelled) {
          const data = {};
          years.forEach((y, i) => { data[y] = results[i]; });
          setAllYearsData(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          toast.error("โหลดข้อมูล GL ล้มเหลว: " + e.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [year, years, enabled]);

  // Aggregate each year's data
  const yearlyAggregates = useMemo(() => {
    const result = {};
    for (const y of years) {
      if (allYearsData[y] && typeof allYearsData[y] === "object" && !Array.isArray(allYearsData[y])) {
        result[y] = aggregateGlSummary(allYearsData[y]);
      } else {
        result[y] = { byAccount: {}, monthlyTotals: {} };
      }
    }
    return result;
  }, [allYearsData, years]);

  // Primary year data
  const { byAccount, monthlyTotals } = yearlyAggregates[year] || { byAccount: {}, monthlyTotals: {} };

  const monthlyPnL = useMemo(
    () => computeMonthlyPnL(byAccount, monthlyTotals),
    [byAccount, monthlyTotals],
  );

  const cogsDetail = useMemo(
    () => computeCogsDetail(byAccount),
    [byAccount],
  );

  const sellingDetail = useMemo(
    () => computeExpenseDetail(byAccount, "selling"),
    [byAccount],
  );

  const adminDetail = useMemo(
    () => computeExpenseDetail(byAccount, "admin"),
    [byAccount],
  );

  const interestDetail = useMemo(
    () => computeExpenseDetail(byAccount, "interest"),
    [byAccount],
  );

  const revenueDetail = useMemo(
    () => computeRevenueDetail(byAccount),
    [byAccount],
  );

  // Summary chart data for monthly trend (primary year, fiscal month order)
  const monthlyChartData = useMemo(() => {
    if (!monthlyPnL.length) return [];
    const revRow = monthlyPnL.find((r) => r.key === "totalRevenue");
    const cogsRow = monthlyPnL.find((r) => r.key === "cogs");
    const netRow = monthlyPnL.find((r) => r.key === "netProfit");
    return CAL_MONTHS.map((m, i) => ({
      month: CAL_MONTHS_SHORT[i],
      revenue: revRow?.months[m] || 0,
      cogs: cogsRow?.months[m] || 0,
      netProfit: netRow?.months[m] || 0,
    }));
  }, [monthlyPnL]);

  // COGS composition chart data (stacked bar, fiscal month order)
  const cogsChartData = useMemo(() => {
    if (!cogsDetail.length) return [];
    const materialKeys = ["rawMaterials", "supplies", "purchaseDiscounts", "importFreight", "importDuties", "otherImport"];
    const laborKeys = ["laborDaily", "laborSubcontract", "laborOutsource", "laborPainting", "laborMfg"];

    return CAL_MONTHS.map((m, i) => {
      let materials = 0, labor = 0, overhead = 0;
      for (const row of cogsDetail) {
        if (row.type !== "item") continue;
        const val = row.months[m] || 0;
        if (materialKeys.includes(row.key)) materials += val;
        else if (laborKeys.includes(row.key)) labor += val;
        else overhead += val;
      }
      return {
        month: CAL_MONTHS_SHORT[i],
        วัตถุดิบ: materials,
        แรงงาน: labor,
        โสหุ้ยการผลิต: overhead,
      };
    });
  }, [cogsDetail]);

  // Comparison years: key→total maps for table comparison columns
  const compYears = useMemo(() => {
    return [year - 1, year - 2].map((y) => {
      const agg = yearlyAggregates[y] || { byAccount: {}, monthlyTotals: {} };
      return { year: y, ...buildCompMaps(agg.byAccount, agg.monthlyTotals) };
    });
  }, [yearlyAggregates, year]);

  // ─── Multi-year trend chart data (for CEO line charts, fiscal month order) ───
  const { revenueTrend, profitTrend } = useMemo(() => {
    const revTrend = CAL_MONTHS.map((m, i) => {
      const point = { month: CAL_MONTHS_SHORT[i] };
      for (const y of years) {
        const agg = yearlyAggregates[y];
        if (!agg) continue;
        const mt = (cat) => agg.monthlyTotals[cat] || { months: {}, total: 0 };
        const rev = (mt("salesRevenue").months[m] || 0)
          + (mt("serviceRevenue").months[m] || 0)
          + (mt("otherIncome").months[m] || 0);
        point[y + 543] = rev;
      }
      return point;
    });

    const pTrend = CAL_MONTHS.map((m, i) => {
      const point = { month: CAL_MONTHS_SHORT[i] };
      for (const y of years) {
        const agg = yearlyAggregates[y];
        if (!agg) continue;
        const mt = (cat) => agg.monthlyTotals[cat] || { months: {}, total: 0 };
        const rev = (mt("salesRevenue").months[m] || 0)
          + (mt("serviceRevenue").months[m] || 0)
          + (mt("otherIncome").months[m] || 0);
        const adjCogs = computeAdjustedCogs(agg.byAccount, agg.monthlyTotals);
        const cogs = adjCogs.months[m] || 0;
        const selling = mt("selling").months[m] || 0;
        const admin = mt("admin").months[m] || 0;
        const interest = mt("interest").months[m] || 0;
        const net = rev - cogs - selling - admin - interest;
        point[y + 543] = net;
      }
      return point;
    });

    return { revenueTrend: revTrend, profitTrend: pTrend };
  }, [yearlyAggregates, years]);

  const trendYearKeys = useMemo(
    () => years.map((y) => String(y + 543)),
    [years],
  );

  // Sum of 115xx account totals from GL (0 if unclosed year has no inventory entries)
  const glInventoryNet = useMemo(() => {
    let total = 0;
    for (const [acct, data] of Object.entries(byAccount)) {
      if (acct.startsWith("115")) total += data.total;
    }
    return total;
  }, [byAccount]);

  // 51200-00 (beginning inventory) total from GL
  const glBeginInvTotal = useMemo(
    () => byAccount["51200-00"]?.total || 0,
    [byAccount],
  );

  return {
    loading,
    error,
    byAccount,
    monthlyTotals,
    monthlyPnL,
    glInventoryNet,
    glBeginInvTotal,
    cogsDetail,
    sellingDetail,
    adminDetail,
    interestDetail,
    revenueDetail,
    monthlyChartData,
    cogsChartData,
    compYears,
    revenueTrend,
    profitTrend,
    trendYearKeys,
    years,
  };
}
