"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { getFinancePeriodRanges } from "@/lib/comparison";
import { get, authFetch } from "@/lib/apiClient";
import { COGS_OVERRIDE_ACCOUNTS, INTEREST_ACCOUNTS, ADMIN_OVERRIDE_ACCOUNTS } from "@/modules/finance/glAccountMap";


function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
function fmtMonth(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  return `${THAI_MONTHS[parseInt(m) - 1]} ${(parseInt(y) + 543) % 100}`;
}


function parseNum(val) {
  if (val === "" || val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  return Number(String(val).replace(/,/g, "")) || 0;
}


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

const OVERRIDE_COGS = { name: "ต้นทุนขาย (โสหุ้ย)", nameEn: "COGS (Overhead)", group: "cogs", sub: "cogs" };
const OVERRIDE_INTEREST = { name: "ต้นทุนทางการเงิน", nameEn: "Finance Costs", group: "expense", sub: "interest" };
const OVERRIDE_ADMIN = { name: "ค่าใช้จ่ายในการบริหาร", nameEn: "Admin Expenses", group: "expense", sub: "admin" };

function getCategory(accountNumber) {
  if (!accountNumber) return null;
  if (COGS_OVERRIDE_ACCOUNTS.has(accountNumber)) return OVERRIDE_COGS;
  if (INTEREST_ACCOUNTS.has(accountNumber)) return OVERRIDE_INTEREST;
  if (ADMIN_OVERRIDE_ACCOUNTS.has(accountNumber)) return OVERRIDE_ADMIN;
  const prefix = accountNumber?.substring(0, 2);
  return ACCOUNT_CATEGORIES[prefix] || null;
}


function computeFinancials(trialBalanceData) {
  if (!trialBalanceData || !trialBalanceData.length) return null;
  const posting = trialBalanceData.filter((t) => t.accountType === "Posting");

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


  const currentAssets = g("assets:current").debit - g("assets:current").credit;
  const noncurrentAssets = g("assets:noncurrent").debit - g("assets:noncurrent").credit;
  const totalAssets = currentAssets + noncurrentAssets;

  const currentLiabilities = g("liabilities:current").credit - g("liabilities:current").debit;
  const noncurrentLiabilities = g("liabilities:noncurrent").credit - g("liabilities:noncurrent").debit;
  const totalLiabilities = currentLiabilities + noncurrentLiabilities;

  const shareCapital = g("equity:capital").credit - g("equity:capital").debit;
  const retainedEarnings = g("equity:retained").credit - g("equity:retained").debit;
  const totalEquity = shareCapital + retainedEarnings;


  const salesRevenue = g("revenue:sales").credit - g("revenue:sales").debit;
  const serviceRevenue = g("revenue:service").credit - g("revenue:service").debit;
  const otherIncome = g("revenue:other").credit - g("revenue:other").debit;
  const totalRevenue = salesRevenue + serviceRevenue + otherIncome;


  const rawCogs = g("cogs:cogs").debit - g("cogs:cogs").credit;
  let inventoryDeduction = 0;
  const inventoryAccounts = {};
  for (const t of posting) {
    if (t.number?.startsWith("115")) {
      const bal = parseNum(t.balanceAtDateDebit) - parseNum(t.balanceAtDateCredit);
      inventoryDeduction += bal;
      if (Math.abs(bal) > 0.01) {
        inventoryAccounts[t.number] = { name: t.display, balance: bal };
      }
    }
  }
  const cogs = rawCogs - inventoryDeduction;
  const grossProfit = totalRevenue - cogs;

  const sellingExpense = g("expense:selling").debit - g("expense:selling").credit;
  const adminExpense = g("expense:admin").debit - g("expense:admin").credit;
  const interestExpense = g("expense:interest").debit - g("expense:interest").credit;
  const operatingProfit = grossProfit - sellingExpense - adminExpense;
  const totalExpense = sellingExpense + adminExpense + interestExpense;
  const netIncome = grossProfit - totalExpense;


  const currentRatio = currentLiabilities ? currentAssets / currentLiabilities : 0;
  const debtToEquity = totalEquity ? totalLiabilities / totalEquity : 0;
  const grossMargin = totalRevenue ? (grossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue ? (netIncome / totalRevenue) * 100 : 0;
  const workingCapital = currentAssets - currentLiabilities;

  return {
    currentAssets, noncurrentAssets, totalAssets,
    currentLiabilities, noncurrentLiabilities, totalLiabilities,
    shareCapital, retainedEarnings, totalEquity,
    salesRevenue, serviceRevenue, otherIncome, totalRevenue,
    cogs, grossProfit,
    sellingExpense, adminExpense, interestExpense, operatingProfit, totalExpense, netIncome,
    currentRatio, debtToEquity, grossMargin, netMargin, workingCapital,
    inventoryBalance: inventoryDeduction,
    inventoryAccounts,
    groups,
    totalAccounts: trialBalanceData.length,
    postingAccounts: posting.length,
  };
}

export function useFinanceDashboard() {
  const [trialBalance, setTrialBalance] = useState([]);
  const [prevTrialBalance, setPrevTrialBalance] = useState([]);
  const [agedReceivables, setAgedReceivables] = useState([]);
  const [agedPayables, setAgedPayables] = useState([]);
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [loading, setLoading] = useState(true);




  const now = new Date();
  const [periodType, setPeriodType] = useState("year");
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [compareEnabled, setCompareEnabled] = useState(false);


  const periodRanges = useMemo(() => {
    const periodValue = { year: selectedYear, quarter: selectedQuarter, month: selectedMonth };
    return getFinancePeriodRanges(periodType, periodValue);
  }, [periodType, selectedYear, selectedQuarter, selectedMonth]);


  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodType, selectedYear, selectedQuarter, selectedMonth, compareEnabled]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const ranges = periodRanges;


      const fetches = [
        get("/api/finance/trialBalance").catch(() => []),
        get("/api/finance/agedReceivables").catch(() => []),
        get("/api/finance/agedPayables").catch(() => []),
        get("/api/finance/salesInvoices?status=Open&expand=false").catch(() => []),
        get("/api/finance/purchaseInvoices?status=Open&expand=false").catch(() => []),
      ];


      if (compareEnabled) {
        fetches.push(
          get("/api/finance/trialBalance").catch(() => []),
        );
      }

      const results = await Promise.all(fetches);
      const [tb, ar, ap, si, pi] = results;

      setTrialBalance(tb);
      setAgedReceivables(ar);
      setAgedPayables(ap);
      setSalesInvoices(si);
      setPurchaseInvoices(pi);
      setPrevTrialBalance(compareEnabled ? results[5] : []);
    } catch (error) {
      toast.error("โหลดข้อมูลรายงานการเงินล้มเหลว");
    } finally {
      setLoading(false);
    }
  };




  const financials = useMemo(() => computeFinancials(trialBalance), [trialBalance]);
  const prevFinancials = useMemo(() => computeFinancials(prevTrialBalance), [prevTrialBalance]);


  const comparisonData = useMemo(() => {
    if (!compareEnabled || !financials || !prevFinancials) return null;
    return {
      labels: periodRanges,
      previous: prevFinancials,
    };
  }, [compareEnabled, financials, prevFinancials, periodRanges]);


  const incomeComparisonChart = useMemo(() => {
    if (!compareEnabled || !financials || !prevFinancials) return [];
    return [
      { name: "รายได้ขาย", current: financials.salesRevenue, previous: prevFinancials.salesRevenue },
      { name: "รายได้บริการ", current: financials.serviceRevenue, previous: prevFinancials.serviceRevenue },
      { name: "รายได้อื่น", current: financials.otherIncome, previous: prevFinancials.otherIncome },
      { name: "ต้นทุนขาย", current: financials.cogs, previous: prevFinancials.cogs },
      { name: "ค่าใช้จ่ายขาย", current: financials.sellingExpense, previous: prevFinancials.sellingExpense },
      { name: "ค่าใช้จ่ายบริหาร", current: financials.adminExpense, previous: prevFinancials.adminExpense },
      { name: "กำไรขั้นต้น", current: financials.grossProfit, previous: prevFinancials.grossProfit },
      { name: "กำไรสุทธิ", current: financials.netIncome, previous: prevFinancials.netIncome },
    ];
  }, [compareEnabled, financials, prevFinancials]);


  const bsComparisonChart = useMemo(() => {
    if (!compareEnabled || !financials || !prevFinancials) return [];
    return [
      { name: "สินทรัพย์หมุนเวียน", current: financials.currentAssets, previous: prevFinancials.currentAssets },
      { name: "สินทรัพย์ไม่หมุนเวียน", current: financials.noncurrentAssets, previous: prevFinancials.noncurrentAssets },
      { name: "หนี้สินหมุนเวียน", current: financials.currentLiabilities, previous: prevFinancials.currentLiabilities },
      { name: "หนี้สินไม่หมุนเวียน", current: financials.noncurrentLiabilities, previous: prevFinancials.noncurrentLiabilities },
      { name: "ส่วนของเจ้าของ", current: financials.totalEquity, previous: prevFinancials.totalEquity },
    ];
  }, [compareEnabled, financials, prevFinancials]);


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




  const [selectedAging, setSelectedAging] = useState(null);
  const { isOpen: isAgingOpen, onOpen: onAgingOpen, onClose: onAgingClose } = useDisclosure();

  const openAgingDetail = useCallback((item, type) => {
    setSelectedAging({ item, type });
    onAgingOpen();
  }, [onAgingOpen]);

  const agingInvoices = selectedAging
    ? (selectedAging.type === "ar"
      ? arInvoiceMap[selectedAging.item.customerNumber] || []
      : apInvoiceMap[selectedAging.item.vendorNumber] || [])
    : [];




  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const runAiAnalysis = useCallback(async (overrideFinancials) => {
    const fin = overrideFinancials || financials;
    if (!fin) return;
    setAiLoading(true);
    setAiAnalysis("");


    const snapshot = {
      financials: [
        `สินทรัพย์รวม: ${fmt(fin.totalAssets)} (หมุนเวียน ${fmt(fin.currentAssets)}, ไม่หมุนเวียน ${fmt(fin.noncurrentAssets)})`,
        `หนี้สินรวม: ${fmt(fin.totalLiabilities)} (หมุนเวียน ${fmt(fin.currentLiabilities)}, ไม่หมุนเวียน ${fmt(fin.noncurrentLiabilities)})`,
        `ส่วนของเจ้าของ: ${fmt(fin.totalEquity)} (ทุน ${fmt(fin.shareCapital)}, กำไรสะสม ${fmt(fin.retainedEarnings)})`,
        `เงินทุนหมุนเวียน (Working Capital): ${fmt(fin.workingCapital)}`,
        `รายได้รวม: ${fmt(fin.totalRevenue)} (ขาย ${fmt(fin.salesRevenue)}, บริการ ${fmt(fin.serviceRevenue)}, อื่น ${fmt(fin.otherIncome)})`,
        `ต้นทุนขาย: ${fmt(fin.cogs)}`,
        `กำไรขั้นต้น: ${fmt(fin.grossProfit)}`,
        `ค่าใช้จ่ายขาย: ${fmt(fin.sellingExpense)}, ค่าใช้จ่ายบริหาร: ${fmt(fin.adminExpense)}`,
        `กำไรก่อนต้นทุนทางการเงิน: ${fmt(fin.operatingProfit)}`,
        `ต้นทุนทางการเงิน (ดอกเบี้ย): ${fmt(fin.interestExpense)}`,
        `กำไรสุทธิก่อนภาษี: ${fmt(fin.netIncome)}`,
      ].join("\n"),
      ratios: [
        `Current Ratio: ${fin.currentRatio.toFixed(2)} (เกณฑ์: ≥2 ดี, 1-2 พอใช้, <1 เสี่ยง)`,
        `D/E Ratio: ${fin.debtToEquity.toFixed(2)} (เกณฑ์: ≤1 ดี, 1-2 พอใช้, >2 เสี่ยง)`,
        `Gross Margin: ${fin.grossMargin.toFixed(1)}% (เกณฑ์: ≥30% ดี, 15-30% พอใช้)`,
        `Net Margin: ${fin.netMargin.toFixed(1)}% (เกณฑ์: ≥10% ดี, 5-10% พอใช้)`,
      ].join("\n"),
      ar: arTotals
        ? [
            `ยอดรวม: ${fmt(arTotals.balanceDue)} จำนวน ${arChartData.length} ราย`,
            `ปัจจุบัน: ${fmt(arTotals.current)}, งวด1: ${fmt(arTotals.period1)}, งวด2: ${fmt(arTotals.period2)}, งวด3+: ${fmt(arTotals.period3)}`,
            arConcentration ? `Top 5 concentration: ${arConcentration.top5Pct.toFixed(0)}% (${fmt(arConcentration.top5Total)})` : "",
            `ลูกค้า Top 10:`,
            ...arChartData.slice(0, 10).map((r) => `  - ${r.name} (${r.customerNumber}): รวม ${fmt(r.balanceDue)}, ปัจจุบัน ${fmt(r.current)}, ค้าง1 ${fmt(r.period1)}, ค้าง2 ${fmt(r.period2)}, ค้าง3+ ${fmt(r.period3)}`),
          ].filter(Boolean).join("\n")
        : "ไม่มีข้อมูล",
      ap: apTotals
        ? [
            `ยอดรวม: ${fmt(Math.abs(apTotals.balanceDue))} จำนวน ${apChartData.length} ราย`,
            `ปัจจุบัน: ${fmt(Math.abs(apTotals.current))}, งวด1: ${fmt(Math.abs(apTotals.period1))}, งวด2: ${fmt(Math.abs(apTotals.period2))}, งวด3+: ${fmt(Math.abs(apTotals.period3))}`,
            `เจ้าหนี้ Top 10:`,
            ...apChartData.slice(0, 10).map((p) => `  - ${p.name} (${p.vendorNumber}): รวม ${fmt(Math.abs(p.balanceDue))}`),
          ].join("\n")
        : "ไม่มีข้อมูล",
      arTrend: arTrendByMonth.length
        ? arTrendByMonth.map((m) => `${fmtMonth(m.month)}: ${m.count} ใบ, ยอด ${fmt(m.total)}, ค้าง ${fmt(m.remaining)}`).join("\n")
        : "ไม่มีข้อมูล",
      apTrend: apTrendByMonth.length
        ? apTrendByMonth.map((m) => `${fmtMonth(m.month)}: ${m.count} ใบ, ยอด ${fmt(m.total)}`).join("\n")
        : "ไม่มีข้อมูล",
      arBands: arOverdueBands.some((b) => b.count > 0)
        ? arOverdueBands.map((b) => `${b.name}: ${b.count} ใบ, ยอด ${fmt(b.total)}, ค้าง ${fmt(b.remaining)}`).join("\n")
        : "ไม่มีข้อมูล",
      apBands: apOverdueBands.some((b) => b.count > 0)
        ? apOverdueBands.map((b) => `${b.name}: ${b.count} ใบ, ยอด ${fmt(b.total)}`).join("\n")
        : "ไม่มีข้อมูล",
    };

    try {
      const res = await authFetch("/api/finance/aiAnalysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          try {
            const json = JSON.parse(line.slice(6));
            const content = json.choices?.[0]?.delta?.content;
            if (content) setAiAnalysis((prev) => prev + content);
          } catch {}
        }
      }
    } catch (err) {
      setAiAnalysis(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  }, [financials, arTotals, apTotals, arChartData, apChartData, arConcentration, arTrendByMonth, apTrendByMonth, arOverdueBands, apOverdueBands]);




  const [cashFlowAnalysis, setCashFlowAnalysis] = useState("");
  const [cashFlowLoading, setCashFlowLoading] = useState(false);

  const runCashFlowForecast = useCallback(async () => {
    if (!financials) return;
    setCashFlowLoading(true);
    setCashFlowAnalysis("");

    const snapshot = {
      financials: [
        `สินทรัพย์หมุนเวียน: ${fmt(financials.currentAssets)}`,
        `หนี้สินหมุนเวียน: ${fmt(financials.currentLiabilities)}`,
        `เงินทุนหมุนเวียน (Working Capital): ${fmt(financials.workingCapital)}`,
        `รายได้รวม: ${fmt(financials.totalRevenue)}`,
        `ค่าใช้จ่ายรวม: ${fmt(financials.totalExpense + financials.cogs)}`,
        `กำไรสุทธิ: ${fmt(financials.netIncome)}`,
      ].join("\n"),
      ratios: [
        `Current Ratio: ${financials.currentRatio.toFixed(2)}`,
        `D/E Ratio: ${financials.debtToEquity.toFixed(2)}`,
        `Gross Margin: ${financials.grossMargin.toFixed(1)}%`,
        `Net Margin: ${financials.netMargin.toFixed(1)}%`,
      ].join("\n"),
      ar: arTotals
        ? `ยอดรวม: ${fmt(arTotals.balanceDue)} | ปัจจุบัน: ${fmt(arTotals.current)} | 1-30วัน: ${fmt(arTotals.period1)} | 31-60วัน: ${fmt(arTotals.period2)} | 60+วัน: ${fmt(arTotals.period3)}`
        : "ไม่มีข้อมูล",
      ap: apTotals
        ? `ยอดรวม: ${fmt(Math.abs(apTotals.balanceDue))} | ปัจจุบัน: ${fmt(Math.abs(apTotals.current))} | 1-30วัน: ${fmt(Math.abs(apTotals.period1))} | 31-60วัน: ${fmt(Math.abs(apTotals.period2))} | 60+วัน: ${fmt(Math.abs(apTotals.period3))}`
        : "ไม่มีข้อมูล",
      arBands: arOverdueBands.some((b) => b.count > 0)
        ? arOverdueBands.map((b) => `${b.name}: ${b.count} ใบ, ยอด ${fmt(b.total)}, ค้าง ${fmt(b.remaining)}`).join("\n")
        : "ไม่มีข้อมูล",
      apBands: apOverdueBands.some((b) => b.count > 0)
        ? apOverdueBands.map((b) => `${b.name}: ${b.count} ใบ, ยอด ${fmt(b.total)}`).join("\n")
        : "ไม่มีข้อมูล",
      monthlyTrend: [
        ...(arTrendByMonth.length
          ? [`AR รายเดือน:`, ...arTrendByMonth.map((m) => `  ${fmtMonth(m.month)}: ${m.count} ใบ, ยอด ${fmt(m.total)}, ค้าง ${fmt(m.remaining)}`)]
          : []),
        ...(apTrendByMonth.length
          ? [`AP รายเดือน:`, ...apTrendByMonth.map((m) => `  ${fmtMonth(m.month)}: ${m.count} ใบ, ยอด ${fmt(m.total)}`)]
          : []),
      ].join("\n") || "ไม่มีข้อมูล",
    };

    try {
      const res = await authFetch("/api/finance/aiCashFlow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          try {
            const json = JSON.parse(line.slice(6));
            const content = json.choices?.[0]?.delta?.content;
            if (content) setCashFlowAnalysis((prev) => prev + content);
          } catch {}
        }
      }
    } catch (err) {
      setCashFlowAnalysis(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setCashFlowLoading(false);
    }
  }, [financials, arTotals, apTotals, arOverdueBands, apOverdueBands, arTrendByMonth, apTrendByMonth]);

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
    selectedAging, isAgingOpen, onAgingClose, openAgingDetail, agingInvoices,
    aiAnalysis, aiLoading, runAiAnalysis,
    cashFlowAnalysis, cashFlowLoading, runCashFlowForecast,
    reload: loadAll,

    periodType, setPeriodType,
    selectedYear, setSelectedYear,
    selectedQuarter, setSelectedQuarter,
    selectedMonth, setSelectedMonth,
    compareEnabled, setCompareEnabled,
    periodRanges,
    comparisonData,
    prevFinancials,
    incomeComparisonChart,
    bsComparisonChart,
  };
}
