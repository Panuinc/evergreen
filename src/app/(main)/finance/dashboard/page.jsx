"use client";

import { useFinanceDashboard } from "@/hooks/finance/useFinanceDashboard";
import FinanceDashboardView from "@/components/finance/FinanceDashboardView";

export default function FinanceDashboardPage() {
  const hook = useFinanceDashboard();

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
    />
  );
}
