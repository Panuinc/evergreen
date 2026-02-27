"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  getTrialBalance,
  getAgedReceivables,
  getAgedPayables,
  getSalesInvoices,
  getPurchaseInvoices,
} from "@/actions/finance";

// BC returns numbers as comma-formatted strings like "4,857.97" or empty strings
function parseNum(val) {
  if (val === "" || val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  return Number(String(val).replace(/,/g, "")) || 0;
}

// Thai Chart of Accounts prefix mapping
const ACCOUNT_CATEGORIES = {
  "11": { name: "สินทรัพย์หมุนเวียน", nameEn: "Current Assets", group: "assets", sub: "current" },
  "12": { name: "สินทรัพย์ไม่หมุนเวียน", nameEn: "Non-current Assets", group: "assets", sub: "noncurrent" },
  "21": { name: "หนี้สินหมุนเวียน", nameEn: "Current Liabilities", group: "liabilities", sub: "current" },
  "22": { name: "หนี้สินไม่หมุนเวียน", nameEn: "Non-current Liabilities", group: "liabilities", sub: "noncurrent" },
  "31": { name: "ทุนจดทะเบียน", nameEn: "Share Capital", group: "equity", sub: "capital" },
  "33": { name: "กำไรสะสม", nameEn: "Retained Earnings", group: "equity", sub: "retained" },
  "41": { name: "รายได้จากการขาย", nameEn: "Sales Revenue", group: "revenue", sub: "sales" },
  "42": { name: "รายได้จากบริการ", nameEn: "Service Revenue", group: "revenue", sub: "service" },
  "43": { name: "รายได้อื่น", nameEn: "Other Income", group: "revenue", sub: "other" },
  "51": { name: "ต้นทุนขาย", nameEn: "COGS", group: "cogs", sub: "cogs" },
  "52": { name: "ค่าใช้จ่ายในการขาย", nameEn: "Selling Expenses", group: "expense", sub: "selling" },
  "53": { name: "ค่าใช้จ่ายในการบริหาร", nameEn: "Admin Expenses", group: "expense", sub: "admin" },
};

function getCategory(accountNumber) {
  const prefix = accountNumber?.substring(0, 2);
  return ACCOUNT_CATEGORIES[prefix] || null;
}

export function useFinanceDashboard() {
  const [trialBalance, setTrialBalance] = useState([]);
  const [agedReceivables, setAgedReceivables] = useState([]);
  const [agedPayables, setAgedPayables] = useState([]);
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [tb, ar, ap, si, pi] = await Promise.all([
        getTrialBalance().catch(() => []),
        getAgedReceivables().catch(() => []),
        getAgedPayables().catch(() => []),
        getSalesInvoices("Open", false).catch(() => []),
        getPurchaseInvoices("Open", false).catch(() => []),
      ]);
      setTrialBalance(tb);
      setAgedReceivables(ar);
      setAgedPayables(ap);
      setSalesInvoices(si);
      setPurchaseInvoices(pi);
    } catch (error) {
      toast.error("โหลดข้อมูลรายงานการเงินล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════
  // DIMENSION 1: Financial Statements (derived from Trial Balance)
  // ═══════════════════════════════════════
  const financials = useMemo(() => {
    if (!trialBalance.length) return null;
    const posting = trialBalance.filter((t) => t.accountType === "Posting");

    // Group by account category
    const groups = {};
    for (const t of posting) {
      const cat = getCategory(t.number);
      if (!cat) continue;
      const key = cat.group + ":" + cat.sub;
      if (!groups[key]) groups[key] = { ...cat, debit: 0, credit: 0, accounts: [] };
      const d = parseNum(t.balanceAtDateDebit);
      const c = parseNum(t.balanceAtDateCredit);
      groups[key].debit += d;
      groups[key].credit += c;
      if (d > 0 || c > 0) {
        groups[key].accounts.push({ number: t.number, display: t.display, debit: d, credit: c });
      }
    }

    const g = (key) => groups[key] || { debit: 0, credit: 0, accounts: [] };

    // Balance Sheet
    const currentAssets = g("assets:current").debit - g("assets:current").credit;
    const noncurrentAssets = g("assets:noncurrent").debit - g("assets:noncurrent").credit;
    const totalAssets = currentAssets + noncurrentAssets;

    const currentLiabilities = g("liabilities:current").credit - g("liabilities:current").debit;
    const noncurrentLiabilities = g("liabilities:noncurrent").credit - g("liabilities:noncurrent").debit;
    const totalLiabilities = currentLiabilities + noncurrentLiabilities;

    const shareCapital = g("equity:capital").credit - g("equity:capital").debit;
    const retainedEarnings = g("equity:retained").credit - g("equity:retained").debit;
    const totalEquity = shareCapital + retainedEarnings;

    // Income Statement
    const salesRevenue = g("revenue:sales").credit - g("revenue:sales").debit;
    const serviceRevenue = g("revenue:service").credit - g("revenue:service").debit;
    const otherIncome = g("revenue:other").credit - g("revenue:other").debit;
    const totalRevenue = salesRevenue + serviceRevenue + otherIncome;

    const cogs = g("cogs:cogs").debit - g("cogs:cogs").credit;
    const grossProfit = totalRevenue - cogs;

    const sellingExpense = g("expense:selling").debit - g("expense:selling").credit;
    const adminExpense = g("expense:admin").debit - g("expense:admin").credit;
    const totalExpense = sellingExpense + adminExpense;
    const netIncome = grossProfit - totalExpense;

    // Financial Ratios
    const currentRatio = currentLiabilities ? currentAssets / currentLiabilities : 0;
    const debtToEquity = totalEquity ? totalLiabilities / totalEquity : 0;
    const grossMargin = totalRevenue ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue ? (netIncome / totalRevenue) * 100 : 0;
    const workingCapital = currentAssets - currentLiabilities;

    return {
      // Balance Sheet
      currentAssets, noncurrentAssets, totalAssets,
      currentLiabilities, noncurrentLiabilities, totalLiabilities,
      shareCapital, retainedEarnings, totalEquity,
      // Income Statement
      salesRevenue, serviceRevenue, otherIncome, totalRevenue,
      cogs, grossProfit,
      sellingExpense, adminExpense, totalExpense, netIncome,
      // Ratios
      currentRatio, debtToEquity, grossMargin, netMargin, workingCapital,
      // Detail groups
      groups,
      totalAccounts: trialBalance.length,
      postingAccounts: posting.length,
    };
  }, [trialBalance]);

  // Balance Sheet chart (Assets breakdown)
  const bsChartData = useMemo(() => {
    if (!financials) return [];
    return [
      { name: "เงินสดและลูกหนี้", nameEn: "Cash & AR", value: Math.max(0, financials.currentAssets), color: "#006FEE" },
      { name: "สินทรัพย์ถาวร (สุทธิ)", nameEn: "Fixed Assets", value: Math.max(0, financials.noncurrentAssets), color: "#7828C8" },
      { name: "หนี้สินหมุนเวียน", nameEn: "Current Liabilities", value: Math.max(0, financials.currentLiabilities), color: "#F5A524" },
      { name: "หนี้สินระยะยาว", nameEn: "Long-term Debt", value: Math.max(0, financials.noncurrentLiabilities), color: "#F31260" },
      { name: "ส่วนของเจ้าของ", nameEn: "Equity", value: Math.max(0, financials.totalEquity), color: "#17C964" },
    ].filter((d) => d.value > 0);
  }, [financials]);

  // Income Statement waterfall
  const isWaterfallData = useMemo(() => {
    if (!financials) return [];
    return [
      { name: "รายได้ขาย", value: financials.salesRevenue, color: "#17C964" },
      { name: "รายได้บริการ", value: financials.serviceRevenue, color: "#17C964" },
      { name: "รายได้อื่น", value: financials.otherIncome > 0 ? financials.otherIncome : 0, color: "#17C964" },
      { name: "ต้นทุนขาย", value: -financials.cogs, color: "#F31260" },
      { name: "ค่าใช้จ่ายขาย", value: -financials.sellingExpense, color: "#F5A524" },
      { name: "ค่าใช้จ่ายบริหาร", value: -financials.adminExpense, color: "#F97316" },
    ].filter((d) => d.value !== 0);
  }, [financials]);

  // Expense breakdown for pie chart
  const expenseBreakdown = useMemo(() => {
    if (!financials) return [];
    const data = [];
    if (financials.cogs > 0) data.push({ name: "ต้นทุนขาย", value: financials.cogs, color: "#F31260" });
    if (financials.sellingExpense > 0) data.push({ name: "ค่าใช้จ่ายขาย", value: financials.sellingExpense, color: "#F5A524" });
    if (financials.adminExpense > 0) data.push({ name: "ค่าใช้จ่ายบริหาร", value: financials.adminExpense, color: "#F97316" });
    return data;
  }, [financials]);

  // Top accounts by balance (for drill-down)
  const topAccounts = useMemo(() => {
    if (!trialBalance.length) return [];
    return trialBalance
      .filter((t) => t.accountType === "Posting")
      .map((t) => {
        const d = parseNum(t.balanceAtDateDebit);
        const c = parseNum(t.balanceAtDateCredit);
        const cat = getCategory(t.number);
        return { number: t.number, display: t.display, debit: d, credit: c, net: d - c, category: cat?.name || "อื่นๆ", group: cat?.group || "other" };
      })
      .filter((t) => t.debit > 0 || t.credit > 0)
      .sort((a, b) => (Math.abs(b.debit) + Math.abs(b.credit)) - (Math.abs(a.debit) + Math.abs(a.credit)))
      .slice(0, 15);
  }, [trialBalance]);

  // ═══════════════════════════════════════
  // DIMENSION 2: Receivables Analytics
  // ═══════════════════════════════════════
  const arChartData = useMemo(() => {
    if (!agedReceivables.length) return [];
    return agedReceivables
      .filter((r) => r.customerNumber && parseNum(r.balanceDue) !== 0)
      .map((r) => ({
        name: r.name || r.customerNumber,
        customerNumber: r.customerNumber,
        balanceDue: parseNum(r.balanceDue),
        current: parseNum(r.currentAmount),
        period1: parseNum(r.period1Amount),
        period2: parseNum(r.period2Amount),
        period3: parseNum(r.period3Amount),
      }))
      .sort((a, b) => b.balanceDue - a.balanceDue);
  }, [agedReceivables]);

  const arTotals = useMemo(() => {
    const totalRow = agedReceivables.find((r) => !r.customerNumber && r.name === "Total");
    if (totalRow) {
      return {
        balanceDue: parseNum(totalRow.balanceDue),
        current: parseNum(totalRow.currentAmount),
        period1: parseNum(totalRow.period1Amount),
        period2: parseNum(totalRow.period2Amount),
        period3: parseNum(totalRow.period3Amount),
      };
    }
    if (!arChartData.length) return null;
    return arChartData.reduce(
      (acc, r) => ({ balanceDue: acc.balanceDue + r.balanceDue, current: acc.current + r.current, period1: acc.period1 + r.period1, period2: acc.period2 + r.period2, period3: acc.period3 + r.period3 }),
      { balanceDue: 0, current: 0, period1: 0, period2: 0, period3: 0 },
    );
  }, [agedReceivables, arChartData]);

  // AR concentration risk (top 5 as % of total)
  const arConcentration = useMemo(() => {
    if (!arChartData.length || !arTotals) return null;
    const top5 = arChartData.slice(0, 5);
    const top5Total = top5.reduce((s, r) => s + r.balanceDue, 0);
    return {
      top5Pct: (top5Total / arTotals.balanceDue) * 100,
      top5Total,
      top5,
      overdueRatio: arTotals.balanceDue ? ((arTotals.period2 + arTotals.period3) / arTotals.balanceDue) * 100 : 0,
    };
  }, [arChartData, arTotals]);

  const arAgingPie = useMemo(() => {
    if (!arTotals) return [];
    const data = [];
    if (arTotals.current) data.push({ name: "ปัจจุบัน", value: arTotals.current, color: "#17C964" });
    if (arTotals.period1) data.push({ name: "1-30 วัน", value: arTotals.period1, color: "#F5A524" });
    if (arTotals.period2) data.push({ name: "31-60 วัน", value: arTotals.period2, color: "#F97316" });
    if (arTotals.period3) data.push({ name: "60+ วัน", value: arTotals.period3, color: "#F31260" });
    return data;
  }, [arTotals]);

  // ═══════════════════════════════════════
  // DIMENSION 3: Payables Analytics
  // ═══════════════════════════════════════
  const apChartData = useMemo(() => {
    if (!agedPayables.length) return [];
    return agedPayables
      .filter((p) => p.vendorNumber && parseNum(p.balanceDue) !== 0)
      .map((p) => ({
        name: p.name || p.vendorNumber,
        vendorNumber: p.vendorNumber,
        balanceDue: parseNum(p.balanceDue),
        current: parseNum(p.currentAmount),
        period1: parseNum(p.period1Amount),
        period2: parseNum(p.period2Amount),
        period3: parseNum(p.period3Amount),
      }))
      .sort((a, b) => Math.abs(b.balanceDue) - Math.abs(a.balanceDue));
  }, [agedPayables]);

  const apTotals = useMemo(() => {
    const totalRow = agedPayables.find((p) => !p.vendorNumber && p.name === "Total");
    if (totalRow) {
      return {
        balanceDue: parseNum(totalRow.balanceDue),
        current: parseNum(totalRow.currentAmount),
        period1: parseNum(totalRow.period1Amount),
        period2: parseNum(totalRow.period2Amount),
        period3: parseNum(totalRow.period3Amount),
      };
    }
    if (!apChartData.length) return null;
    return apChartData.reduce(
      (acc, p) => ({ balanceDue: acc.balanceDue + p.balanceDue, current: acc.current + p.current, period1: acc.period1 + p.period1, period2: acc.period2 + p.period2, period3: acc.period3 + p.period3 }),
      { balanceDue: 0, current: 0, period1: 0, period2: 0, period3: 0 },
    );
  }, [agedPayables, apChartData]);

  const apAgingPie = useMemo(() => {
    if (!apTotals) return [];
    const data = [];
    if (apTotals.current) data.push({ name: "ปัจจุบัน", value: Math.abs(apTotals.current), color: "#17C964" });
    if (apTotals.period1) data.push({ name: "1-30 วัน", value: Math.abs(apTotals.period1), color: "#F5A524" });
    if (apTotals.period2) data.push({ name: "31-60 วัน", value: Math.abs(apTotals.period2), color: "#F97316" });
    if (apTotals.period3) data.push({ name: "60+ วัน", value: Math.abs(apTotals.period3), color: "#F31260" });
    return data;
  }, [apTotals]);

  // ═══════════════════════════════════════
  // DIMENSION 4: Invoice Details (grouped by customer/vendor)
  // ═══════════════════════════════════════
  const arInvoiceMap = useMemo(() => {
    const map = {};
    const today = new Date();
    for (const inv of salesInvoices) {
      if (!inv.customerNumber) continue;
      if (!map[inv.customerNumber]) map[inv.customerNumber] = [];
      const due = new Date(inv.dueDate);
      const daysOverdue = inv.dueDate && inv.dueDate !== "0001-01-01"
        ? Math.floor((today - due) / 86400000)
        : 0;
      map[inv.customerNumber].push({
        number: inv.number,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        totalAmountIncludingTax: inv.totalAmountIncludingTax,
        remainingAmount: inv.remainingAmount,
        daysOverdue: Math.max(0, daysOverdue),
      });
    }
    // Sort each customer's invoices by days overdue desc
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => b.daysOverdue - a.daysOverdue);
    }
    return map;
  }, [salesInvoices]);

  const apInvoiceMap = useMemo(() => {
    const map = {};
    const today = new Date();
    for (const inv of purchaseInvoices) {
      if (!inv.vendorNumber) continue;
      if (!map[inv.vendorNumber]) map[inv.vendorNumber] = [];
      const due = new Date(inv.dueDate);
      const daysOverdue = inv.dueDate && inv.dueDate !== "0001-01-01"
        ? Math.floor((today - due) / 86400000)
        : 0;
      map[inv.vendorNumber].push({
        number: inv.number,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        totalAmountIncludingTax: inv.totalAmountIncludingTax,
        daysOverdue: Math.max(0, daysOverdue),
      });
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => b.daysOverdue - a.daysOverdue);
    }
    return map;
  }, [purchaseInvoices]);

  // ═══════════════════════════════════════
  // DIMENSION 5: Trend Analysis
  // ═══════════════════════════════════════

  // AR trend — outstanding invoices grouped by invoice month
  const arTrendByMonth = useMemo(() => {
    const map = {};
    for (const inv of salesInvoices) {
      const month = inv.invoiceDate?.substring(0, 7);
      if (!month) continue;
      if (!map[month]) map[month] = { month, count: 0, total: 0, remaining: 0 };
      map[month].count++;
      map[month].total += inv.totalAmountIncludingTax || 0;
      map[month].remaining += inv.remainingAmount || 0;
    }
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [salesInvoices]);

  // AP trend — outstanding invoices grouped by invoice month
  const apTrendByMonth = useMemo(() => {
    const map = {};
    for (const inv of purchaseInvoices) {
      const month = inv.invoiceDate?.substring(0, 7);
      if (!month) continue;
      if (!map[month]) map[month] = { month, count: 0, total: 0 };
      map[month].count++;
      map[month].total += Math.abs(inv.totalAmountIncludingTax || 0);
    }
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [purchaseInvoices]);

  // AR overdue bands (based on due date)
  const arOverdueBands = useMemo(() => {
    const bands = [
      { name: "ยังไม่ถึงกำหนด", count: 0, total: 0, remaining: 0, color: "#17C964" },
      { name: "1-30 วัน", count: 0, total: 0, remaining: 0, color: "#F5A524" },
      { name: "31-60 วัน", count: 0, total: 0, remaining: 0, color: "#F97316" },
      { name: "61-90 วัน", count: 0, total: 0, remaining: 0, color: "#F31260" },
      { name: "90+ วัน", count: 0, total: 0, remaining: 0, color: "#920B3A" },
    ];
    const today = new Date();
    for (const inv of salesInvoices) {
      if (!inv.dueDate || inv.dueDate === "0001-01-01") continue;
      const days = Math.floor((today - new Date(inv.dueDate)) / 86400000);
      const idx = days <= 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : days <= 90 ? 3 : 4;
      bands[idx].count++;
      bands[idx].total += inv.totalAmountIncludingTax || 0;
      bands[idx].remaining += inv.remainingAmount || 0;
    }
    return bands;
  }, [salesInvoices]);

  // AP overdue bands
  const apOverdueBands = useMemo(() => {
    const bands = [
      { name: "ยังไม่ถึงกำหนด", count: 0, total: 0, color: "#17C964" },
      { name: "1-30 วัน", count: 0, total: 0, color: "#F5A524" },
      { name: "31-60 วัน", count: 0, total: 0, color: "#F97316" },
      { name: "61-90 วัน", count: 0, total: 0, color: "#F31260" },
      { name: "90+ วัน", count: 0, total: 0, color: "#920B3A" },
    ];
    const today = new Date();
    for (const inv of purchaseInvoices) {
      if (!inv.dueDate || inv.dueDate === "0001-01-01") continue;
      const days = Math.floor((today - new Date(inv.dueDate)) / 86400000);
      const idx = days <= 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : days <= 90 ? 3 : 4;
      bands[idx].count++;
      bands[idx].total += Math.abs(inv.totalAmountIncludingTax || 0);
    }
    return bands;
  }, [purchaseInvoices]);

  return {
    loading,
    trialBalance,
    financials,
    bsChartData,
    isWaterfallData,
    expenseBreakdown,
    topAccounts,
    arChartData, arTotals, arConcentration, arAgingPie, arInvoiceMap,
    apChartData, apTotals, apAgingPie, apInvoiceMap,
    arTrendByMonth, apTrendByMonth, arOverdueBands, apOverdueBands,
    reload: loadAll,
  };
}
