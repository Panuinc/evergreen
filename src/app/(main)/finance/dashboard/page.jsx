"use client";

import { useMemo } from "react";
import { useFinanceDashboard } from "@/modules/finance/hooks/useFinanceDashboard";
import { useGlMonthlyData } from "@/modules/finance/hooks/useGlMonthlyData";
import FinanceDashboardView from "@/modules/finance/components/FinanceDashboardView";

/**
 * Extract year totals from monthlyPnL rows (GL-based, year-filtered).
 * Returns a map: key → total (e.g. "salesRevenue" → 1234567.89)
 */
function pnlMap(rows) {
  const m = {};
  for (const r of rows) if (r.key) m[r.key] = r.total || 0;
  return m;
}

export default function FinanceDashboardPage() {
  const hook = useFinanceDashboard();

  // GL monthly data — uses same selectedYear as period selector
  const gl = useGlMonthlyData(hook.selectedYear);

  // ─── Merge financials: balance sheet from TB + income statement from GL ───
  // TB has no date filter → balance sheet is always current (correct).
  // Income statement fields must come from GL (year-filtered) to match the year selector.
  const financials = useMemo(() => {
    const tb = hook.financials;
    if (!tb) return null;

    const pnl = pnlMap(gl.monthlyPnL);
    // If GL hasn't loaded yet, fall back to TB-based values
    if (!gl.monthlyPnL.length) return tb;

    // Income statement from GL
    const salesRevenue = pnl.salesRevenue || 0;
    const serviceRevenue = pnl.serviceRevenue || 0;
    const otherIncome = pnl.otherIncome || 0;
    const totalRevenue = pnl.totalRevenue || 0;

    // ─── COGS: apply TB inventory fallback for unclosed years ───
    // For unclosed fiscal years, GL has no inventory journal entries
    // (51200-00 = 0 and 115xx = 0). The raw COGS from GL is just
    // production costs without any inventory deduction.
    // In this case, use the TB inventory balance to adjust COGS.
    const glCogs = pnl.cogs || 0;
    const glInvNet = gl.glInventoryNet || 0;
    const glBeginInv = gl.glBeginInvTotal || 0;
    const tbInventory = tb.inventoryBalance || 0;
    const glHasInventoryData = Math.abs(glInvNet) > 1000 || Math.abs(glBeginInv) > 1000;
    const cogs = glHasInventoryData ? glCogs : (glCogs - tbInventory);

    const grossProfit = totalRevenue - cogs;
    const sellingExpense = pnl.selling || 0;
    const adminExpense = pnl.admin || 0;
    const interestExpense = pnl.interest || 0;
    const totalExpense = sellingExpense + adminExpense;
    const operatingProfit = grossProfit - totalExpense;
    const netIncome = operatingProfit - interestExpense;

    // Ratios (recomputed with GL income + TB balance sheet)
    const currentRatio = tb.currentLiabilities ? tb.currentAssets / tb.currentLiabilities : 0;
    const debtToEquity = tb.totalEquity ? tb.totalLiabilities / tb.totalEquity : 0;
    const grossMargin = totalRevenue ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue ? (netIncome / totalRevenue) * 100 : 0;
    const workingCapital = tb.currentAssets - tb.currentLiabilities;

    return {
      // Balance sheet from TB (point-in-time, no date filter needed)
      currentAssets: tb.currentAssets,
      noncurrentAssets: tb.noncurrentAssets,
      totalAssets: tb.totalAssets,
      currentLiabilities: tb.currentLiabilities,
      noncurrentLiabilities: tb.noncurrentLiabilities,
      totalLiabilities: tb.totalLiabilities,
      shareCapital: tb.shareCapital,
      retainedEarnings: tb.retainedEarnings,
      totalEquity: tb.totalEquity,
      // Income statement from GL (year-filtered)
      salesRevenue,
      serviceRevenue,
      otherIncome,
      totalRevenue,
      cogs,
      grossProfit,
      sellingExpense,
      adminExpense,
      interestExpense,
      operatingProfit,
      totalExpense,
      netIncome,
      // Ratios
      currentRatio,
      debtToEquity,
      grossMargin,
      netMargin,
      workingCapital,
      // Metadata
      groups: tb.groups,
      totalAccounts: tb.totalAccounts,
      postingAccounts: tb.postingAccounts,
    };
  }, [hook.financials, gl.monthlyPnL, gl.glInventoryNet, gl.glBeginInvTotal]);

  // ─── Recompute derived visualizations from merged financials ───
  const isWaterfallData = useMemo(() => {
    if (!financials) return [];
    return [
      { name: "รายได้ขาย", value: financials.salesRevenue, color: "#17C964" },
      { name: "รายได้บริการ", value: financials.serviceRevenue, color: "#17C964" },
      { name: "รายได้อื่น", value: financials.otherIncome > 0 ? financials.otherIncome : 0, color: "#17C964" },
      { name: "ต้นทุนขาย", value: -financials.cogs, color: "#F31260" },
      { name: "ค่าใช้จ่ายขาย", value: -financials.sellingExpense, color: "#F5A524" },
      { name: "ค่าใช้จ่ายบริหาร", value: -financials.adminExpense, color: "#F97316" },
      { name: "ดอกเบี้ยจ่าย", value: -financials.interestExpense, color: "#9353D3" },
    ].filter((d) => d.value !== 0);
  }, [financials]);

  const expenseBreakdown = useMemo(() => {
    if (!financials) return [];
    const data = [];
    if (financials.cogs > 0) data.push({ name: "ต้นทุนขาย", value: financials.cogs, color: "#F31260" });
    if (financials.sellingExpense > 0) data.push({ name: "ค่าใช้จ่ายขาย", value: financials.sellingExpense, color: "#F5A524" });
    if (financials.adminExpense > 0) data.push({ name: "ค่าใช้จ่ายบริหาร", value: financials.adminExpense, color: "#F97316" });
    if (financials.interestExpense > 0) data.push({ name: "ดอกเบี้ยจ่าย", value: financials.interestExpense, color: "#9353D3" });
    return data;
  }, [financials]);

  return (
    <FinanceDashboardView
      loading={hook.loading}
      financials={financials}
      bsChartData={hook.bsChartData}
      isWaterfallData={isWaterfallData}
      expenseBreakdown={expenseBreakdown}
      topAccounts={hook.topAccounts}
      arChartData={hook.arChartData}
      arTotals={hook.arTotals}
      arConcentration={hook.arConcentration}
      arAgingPie={hook.arAgingPie}
      arInvoiceMap={hook.arInvoiceMap}
      apChartData={hook.apChartData}
      apTotals={hook.apTotals}
      apAgingPie={hook.apAgingPie}
      apInvoiceMap={hook.apInvoiceMap}
      arTrendByMonth={hook.arTrendByMonth}
      apTrendByMonth={hook.apTrendByMonth}
      arOverdueBands={hook.arOverdueBands}
      apOverdueBands={hook.apOverdueBands}
      selectedAging={hook.selectedAging}
      isAgingOpen={hook.isAgingOpen}
      onAgingClose={hook.onAgingClose}
      openAgingDetail={hook.openAgingDetail}
      agingInvoices={hook.agingInvoices}
      aiAnalysis={hook.aiAnalysis}
      aiLoading={hook.aiLoading}
      runAiAnalysis={hook.runAiAnalysis}
      reload={hook.reload}
      // Year selector
      selectedYear={hook.selectedYear}
      setSelectedYear={hook.setSelectedYear}
      // GL Monthly Data props
      glLoading={gl.loading}
      glError={gl.error}
      monthlyPnL={gl.monthlyPnL}
      cogsDetail={gl.cogsDetail}
      sellingDetail={gl.sellingDetail}
      adminDetail={gl.adminDetail}
      revenueDetail={gl.revenueDetail}
      monthlyChartData={gl.monthlyChartData}
      cogsChartData={gl.cogsChartData}
      compYears={gl.compYears}
      revenueTrend={gl.revenueTrend}
      profitTrend={gl.profitTrend}
      trendYearKeys={gl.trendYearKeys}
    />
  );
}
