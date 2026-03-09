"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useFinanceDashboard } from "@/modules/finance/hooks/useFinanceDashboard";
import { useGlMonthlyData } from "@/modules/finance/hooks/useGlMonthlyData";
import FinanceDashboardView from "@/modules/finance/components/FinanceDashboardView";
import { INVENTORY_ACCOUNTS } from "@/modules/finance/glAccountMap";

const INV_OVERRIDE_KEY = (year) => `chh_inventory_override_${year}`;


function pnlMap(rows) {
  const m = {};
  for (const r of rows) if (r.key) m[r.key] = r.total || 0;
  return m;
}

export default function FinanceDashboardPage() {
  const hook = useFinanceDashboard();


  const gl = useGlMonthlyData(hook.selectedYear);


  const [inventoryOverride, setInventoryOverride] = useState(() => {
    try {
      const stored = localStorage.getItem(INV_OVERRIDE_KEY(hook.selectedYear));
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(INV_OVERRIDE_KEY(hook.selectedYear));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInventoryOverride(stored ? JSON.parse(stored) : null);
    } catch { setInventoryOverride(null); }
  }, [hook.selectedYear]);

  const onSaveInventoryOverride = useCallback((values) => {
    localStorage.setItem(INV_OVERRIDE_KEY(hook.selectedYear), JSON.stringify(values));
    setInventoryOverride(values);
  }, [hook.selectedYear]);

  const onClearInventoryOverride = useCallback(() => {
    localStorage.removeItem(INV_OVERRIDE_KEY(hook.selectedYear));
    setInventoryOverride(null);
  }, [hook.selectedYear]);



  const inventoryAdjustment = useMemo(() => {
    const pnl = pnlMap(gl.monthlyPnL);
    const rawGlCogs = pnl.cogs || 0;
    if (!rawGlCogs) return 0;


    if (inventoryOverride) {
      const { beginningInventory = 0, endingInventory = 0 } = inventoryOverride;
      const targetCogs = rawGlCogs + beginningInventory - endingInventory;
      const adj = rawGlCogs - targetCogs;
      return adj > 0 ? adj : 0;
    }


    const tbCogs = hook.financials?.cogs;
    if (tbCogs == null) return 0;
    const diff = rawGlCogs - tbCogs;
    return diff > 0 ? diff : 0;
  }, [gl.monthlyPnL, hook.financials, inventoryOverride]);


  const financials = useMemo(() => {
    const tb = hook.financials;
    if (!tb) return null;

    const pnl = pnlMap(gl.monthlyPnL);
    if (!gl.monthlyPnL.length) return tb;


    const salesRevenue = pnl.salesRevenue || 0;
    const serviceRevenue = pnl.serviceRevenue || 0;
    const otherIncome = pnl.otherIncome || 0;
    const totalRevenue = pnl.totalRevenue || 0;
    const rawGlCogs = pnl.cogs || 0;
    const cogs = rawGlCogs - inventoryAdjustment;
    const grossProfit = totalRevenue - cogs;
    const sellingExpense = pnl.selling || 0;
    const adminExpense = pnl.admin || 0;
    const interestExpense = pnl.interest || 0;
    const operatingProfit = grossProfit - sellingExpense - adminExpense;
    const totalExpense = sellingExpense + adminExpense + interestExpense;
    const netIncome = grossProfit - totalExpense;


    const currentRatio = tb.currentLiabilities ? tb.currentAssets / tb.currentLiabilities : 0;
    const debtToEquity = tb.totalEquity ? tb.totalLiabilities / tb.totalEquity : 0;
    const grossMargin = totalRevenue ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue ? (netIncome / totalRevenue) * 100 : 0;
    const workingCapital = tb.currentAssets - tb.currentLiabilities;

    return {
      currentAssets: tb.currentAssets, noncurrentAssets: tb.noncurrentAssets, totalAssets: tb.totalAssets,
      currentLiabilities: tb.currentLiabilities, noncurrentLiabilities: tb.noncurrentLiabilities, totalLiabilities: tb.totalLiabilities,
      shareCapital: tb.shareCapital, retainedEarnings: tb.retainedEarnings, totalEquity: tb.totalEquity,
      salesRevenue, serviceRevenue, otherIncome, totalRevenue,
      cogs, rawGlCogs, inventoryAdj: inventoryAdjustment,
      grossProfit, sellingExpense, adminExpense, interestExpense, operatingProfit,
      totalExpense, netIncome,
      currentRatio, debtToEquity, grossMargin, netMargin, workingCapital,
      inventoryAccounts: tb.inventoryAccounts,
      groups: tb.groups, totalAccounts: tb.totalAccounts, postingAccounts: tb.postingAccounts,
    };
  }, [hook.financials, gl.monthlyPnL, inventoryAdjustment]);


  const monthlyPnL = useMemo(() => {
    if (!gl.monthlyPnL.length || !inventoryAdjustment) return gl.monthlyPnL;
    return gl.monthlyPnL.map((row) => {
      switch (row.key) {
        case "cogs":
          return { ...row, total: row.total - inventoryAdjustment };
        case "grossProfit":
        case "operatingProfit":
        case "netProfit":
          return { ...row, total: row.total + inventoryAdjustment };
        default:
          return row;
      }
    });
  }, [gl.monthlyPnL, inventoryAdjustment]);


  const cogsDetail = useMemo(() => {
    if (!gl.cogsDetail.length || !inventoryAdjustment) return gl.cogsDetail;
    const tbInvAccounts = hook.financials?.inventoryAccounts || {};


    const replaced = gl.cogsDetail.map((row) => {
      for (const inv of INVENTORY_ACCOUNTS) {
        if (row.key === inv.key && tbInvAccounts[inv.account]) {
          return { ...row, total: -tbInvAccounts[inv.account].balance };
        }
      }
      return row;
    });


    let endInvSum = 0;
    for (const row of replaced) {
      if (row.type === "deduction") endInvSum += row.total || 0;
    }


    return replaced.map((row) => {
      if (row.key === "endingInventory") {
        return { ...row, total: endInvSum };
      }
      if (row.key === "cogsTotal") {
        return { ...row, total: row.total - inventoryAdjustment };
      }
      return row;
    });
  }, [gl.cogsDetail, inventoryAdjustment, hook.financials]);






  const isWaterfallData = useMemo(() => {
    if (!financials) return [];
    return [
      { name: "รายได้ขาย", value: financials.salesRevenue, color: "#17C964" },
      { name: "รายได้บริการ", value: financials.serviceRevenue, color: "#17C964" },
      { name: "รายได้อื่น", value: financials.otherIncome > 0 ? financials.otherIncome : 0, color: "#17C964" },
      { name: "ต้นทุนขาย", value: -financials.cogs, color: "#F31260" },
      { name: "ค่าใช้จ่ายขาย", value: -financials.sellingExpense, color: "#F5A524" },
      { name: "ค่าใช้จ่ายบริหาร", value: -financials.adminExpense, color: "#F97316" },
      { name: "ดอกเบี้ยจ่าย", value: -financials.interestExpense, color: "#7828C8" },
    ].filter((d) => d.value !== 0);
  }, [financials]);

  const expenseBreakdown = useMemo(() => {
    if (!financials) return [];
    const data = [];
    if (financials.cogs > 0) data.push({ name: "ต้นทุนขาย", value: financials.cogs, color: "#F31260" });
    if (financials.sellingExpense > 0) data.push({ name: "ค่าใช้จ่ายขาย", value: financials.sellingExpense, color: "#F5A524" });
    if (financials.adminExpense > 0) data.push({ name: "ค่าใช้จ่ายบริหาร", value: financials.adminExpense, color: "#F97316" });
    if (financials.interestExpense > 0) data.push({ name: "ดอกเบี้ยจ่าย", value: financials.interestExpense, color: "#7828C8" });
    return data;
  }, [financials]);

  return (
    <FinanceDashboardView
      loading={hook.loading}
      financials={financials}
      bsChartData={hook.bsChartData}
      isWaterfallData={isWaterfallData}
      expenseBreakdown={expenseBreakdown}
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
      runAiAnalysis={() => hook.runAiAnalysis(financials)}
      reload={hook.reload}

      selectedYear={hook.selectedYear}
      setSelectedYear={hook.setSelectedYear}

      inventoryOverride={inventoryOverride}
      onSaveInventoryOverride={onSaveInventoryOverride}
      onClearInventoryOverride={onClearInventoryOverride}

      glLoading={gl.loading}
      glError={gl.error}
      monthlyPnL={monthlyPnL}
      cogsDetail={cogsDetail}
      sellingDetail={gl.sellingDetail}
      adminDetail={gl.adminDetail}
      interestDetail={gl.interestDetail}
      revenueDetail={gl.revenueDetail}
      monthlyChartData={gl.monthlyChartData}
      cogsChartData={gl.cogsChartData}
      compYears={gl.compYears}
      revenueTrend={gl.revenueTrend}
      profitTrend={gl.profitTrend}
      trendYearKeys={gl.trendYearKeys}

      cashFlowAnalysis={hook.cashFlowAnalysis}
      cashFlowLoading={hook.cashFlowLoading}
      runCashFlowForecast={hook.runCashFlowForecast}
    />
  );
}
