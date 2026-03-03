"use client";

import { useFinanceDashboard } from "@/modules/finance/hooks/useFinanceDashboard";
import { useGlMonthlyData } from "@/modules/finance/hooks/useGlMonthlyData";
import FinanceDashboardView from "@/modules/finance/components/FinanceDashboardView";

export default function FinanceDashboardPage() {
  const hook = useFinanceDashboard();

  // GL monthly data — uses same selectedYear as period selector
  const gl = useGlMonthlyData(hook.selectedYear);

  return (
    <FinanceDashboardView
      loading={hook.loading}
      financials={hook.financials}
      bsChartData={hook.bsChartData}
      isWaterfallData={hook.isWaterfallData}
      expenseBreakdown={hook.expenseBreakdown}
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
