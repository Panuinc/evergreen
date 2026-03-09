"use client";

import { useCallback, useState } from "react";
import {
  Card, CardBody, CardHeader, Chip, Tooltip,
  Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Select, SelectItem,
} from "@heroui/react";
import { Eye, Info, BotMessageSquare, RefreshCw, Download } from "lucide-react";
import * as XLSX from "xlsx";
import MonthlyPnLTable from "./MonthlyPnLTable";
import CogsDetailTable from "./CogsDetailTable";
import ExpenseDetailTable from "./ExpenseDetailTable";
import RevenueDetailTable from "./RevenueDetailTable";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DataTable from "@/components/ui/DataTable";
import {
  LineChart, Line,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import Loading from "@/components/ui/Loading";

// ─── Formatting helpers ───

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

function fmtShort(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}

function fmtDate(d) {
  if (!d || d === "0001-01-01") return "-";
  return new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" });
}

function daysOverdueColor(days) {
  if (days <= 0) return "text-success";
  if (days <= 30) return "text-warning";
  if (days <= 60) return "text-orange-500";
  return "text-danger";
}

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
function fmtMonth(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  return `${THAI_MONTHS[parseInt(m) - 1]} ${(parseInt(y) + 543) % 100}`;
}

// ─── Helpers for account detail modal ───

/**
 * Extract and sort accounts from financials.groups for modal display.
 */
function getGroupAccounts(groups, keys, normalSide = "debit") {
  if (!groups) return [];
  const all = [];
  for (const k of keys) {
    const g = groups[k];
    if (!g?.accounts) continue;
    for (const a of g.accounts) {
      const bal = normalSide === "debit" ? a.debit - a.credit : a.credit - a.debit;
      if (Math.abs(bal) > 0.01) all.push({ ...a, bal, groupKey: k, groupName: g.name });
    }
  }
  all.sort((a, b) => Math.abs(b.bal) - Math.abs(a.bal));
  return all;
}

// ─── Export Calculation Report ───

function exportCalculationReport(financials, selectedYear) {
  if (!financials) return;
  const f = financials;
  const beYear = selectedYear + 543;
  const wb = XLSX.utils.book_new();

  // ═══ Sheet 1: KPI Summary ═══
  const kpiRows = [
    ["รายงานวิธีคำนวณ KPI — Dashboard การเงิน CHH"],
    [`ปี ค.ศ. ${selectedYear} (พ.ศ. ${beYear})`],
    [],
    ["หมวด", "ชื่อ KPI", "ที่มาข้อมูล", "สูตรคำนวณ", "การคำนวณ", "ค่าที่ได้", "หมายเหตุ"],
    // Financial Position (from TB)
    ["ฐานะการเงิน", "สินทรัพย์รวม", "Trial Balance → trialBalances API",
      "สินทรัพย์หมุนเวียน (11xx) + ไม่หมุนเวียน (12xx)",
      `${fmt(f.currentAssets)} + ${fmt(f.noncurrentAssets)}`, fmt(f.totalAssets),
      "ยอดเดบิต − เครดิต ของบัญชีหมวด 1 (Posting)"],
    ["ฐานะการเงิน", "หนี้สินรวม", "Trial Balance → trialBalances API",
      "หนี้สินหมุนเวียน (21xx) + ไม่หมุนเวียน (22xx)",
      `${fmt(f.currentLiabilities)} + ${fmt(f.noncurrentLiabilities)}`, fmt(f.totalLiabilities),
      "ยอดเครดิต − เดบิต ของบัญชีหมวด 2"],
    ["ฐานะการเงิน", "ส่วนของเจ้าของ", "Trial Balance → trialBalances API",
      "ทุนจดทะเบียน (31xx) + กำไรสะสม (33xx)",
      `${fmt(f.shareCapital)} + ${fmt(f.retainedEarnings)}`, fmt(f.totalEquity),
      "ยอดเครดิต − เดบิต ของบัญชีหมวด 3"],
    ["ฐานะการเงิน", "เงินทุนหมุนเวียน", "Trial Balance → trialBalances API",
      "สินทรัพย์หมุนเวียน (11xx) − หนี้สินหมุนเวียน (21xx)",
      `${fmt(f.currentAssets)} − ${fmt(f.currentLiabilities)}`, fmt(f.workingCapital),
      "Working Capital: ยิ่งมากยิ่งดี"],
    [],
    // Income Statement (from TB filtered by year)
    ["งบกำไรขาดทุน", "รายได้รวม", "Trial Balance (กรองตามปี)",
      "ขาย (41xx) + บริการ (42xx) + อื่น (43xx)",
      `${fmt(f.salesRevenue)} + ${fmt(f.serviceRevenue)} + ${fmt(f.otherIncome)}`, fmt(f.totalRevenue),
      "ยอดเครดิต − เดบิต ของบัญชีหมวด 4"],
    ["งบกำไรขาดทุน", "ต้นทุนขาย", "GL Entries + Inventory Adj",
      "ต้นทุนผลิต (51xx + โสหุ้ย) − หัก สินค้าคงเหลือ (115xx)",
      `${fmt(f.cogs)}`, fmt(f.cogs),
      "51xx + โสหุ้ยการผลิต (52000-09, 53200-xx, 53400-xx) | TB 115xx หักเป็น inventory"],
    ["งบกำไรขาดทุน", "กำไรขั้นต้น", "คำนวณ",
      "รายได้รวม − ต้นทุนขาย",
      `${fmt(f.totalRevenue)} − ${fmt(f.cogs)}`, fmt(f.grossProfit),
      `Gross Margin = ${f.grossMargin.toFixed(1)}%`],
    ["งบกำไรขาดทุน", "กำไรก่อนต้นทุนทางการเงิน", "คำนวณ",
      "กำไรขั้นต้น − ค่าใช้จ่ายขาย − ค่าใช้จ่ายบริหาร",
      `${fmt(f.grossProfit)} − ${fmt(f.sellingExpense)} − ${fmt(f.adminExpense)}`,
      fmt(f.operatingProfit), "Operating Profit ก่อนหักดอกเบี้ย"],
    ["งบกำไรขาดทุน", "ต้นทุนทางการเงิน", "GL Entries",
      "ดอกเบี้ยจ่าย (53710-xx)",
      `${fmt(f.interestExpense)}`, fmt(f.interestExpense),
      "แยกจากค่าใช้จ่ายบริหาร ตาม Manager Account"],
    ["งบกำไรขาดทุน", "กำไรสุทธิก่อนภาษี", "คำนวณ",
      "กำไรก่อนต้นทุนทางการเงิน − ดอกเบี้ยจ่าย",
      `${fmt(f.operatingProfit)} − ${fmt(f.interestExpense)}`,
      fmt(f.netIncome), `Net Margin = ${f.netMargin.toFixed(1)}%`],
    [],
    // Financial Ratios
    ["อัตราส่วนทางการเงิน", "Current Ratio", "Trial Balance",
      "สินทรัพย์หมุนเวียน ÷ หนี้สินหมุนเวียน",
      `${fmt(f.currentAssets)} ÷ ${fmt(f.currentLiabilities)}`, f.currentRatio.toFixed(2),
      "≥ 2 = ดี, 1-2 = พอใช้, < 1 = เสี่ยง"],
    ["อัตราส่วนทางการเงิน", "D/E Ratio", "Trial Balance",
      "หนี้สินรวม ÷ ส่วนของเจ้าของ",
      `${fmt(f.totalLiabilities)} ÷ ${fmt(f.totalEquity)}`, f.debtToEquity.toFixed(2),
      "≤ 1 = ดี, 1-2 = พอใช้, > 2 = เสี่ยง"],
    ["อัตราส่วนทางการเงิน", "Gross Margin", "GL Entries",
      "(กำไรขั้นต้น ÷ รายได้รวม) × 100",
      `(${fmt(f.grossProfit)} ÷ ${fmt(f.totalRevenue)}) × 100`, `${f.grossMargin.toFixed(1)}%`,
      "≥ 30% = ดี, 15-30% = พอใช้"],
    ["อัตราส่วนทางการเงิน", "Net Margin", "GL Entries",
      "(กำไรสุทธิ ÷ รายได้รวม) × 100",
      `(${fmt(f.netIncome)} ÷ ${fmt(f.totalRevenue)}) × 100`, `${f.netMargin.toFixed(1)}%`,
      "≥ 10% = ดี, 5-10% = พอใช้"],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(kpiRows);
  ws1["!cols"] = [{ wch: 22 }, { wch: 28 }, { wch: 32 }, { wch: 48 }, { wch: 48 }, { wch: 20 }, { wch: 55 }];
  // Merge title row
  ws1["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }];
  XLSX.utils.book_append_sheet(wb, ws1, "สรุป KPI");

  // ═══ Sheet 2: Account Details ═══
  const detailRows = [
    ["รายบัญชีแยกตามกลุ่ม KPI"],
    [],
  ];

  const groupDefs = [
    { title: "สินทรัพย์หมุนเวียน (11xx)", keys: ["assets:current"], side: "debit" },
    { title: "สินทรัพย์ไม่หมุนเวียน (12xx)", keys: ["assets:noncurrent"], side: "debit" },
    { title: "หนี้สินหมุนเวียน (21xx)", keys: ["liabilities:current"], side: "credit" },
    { title: "หนี้สินไม่หมุนเวียน (22xx)", keys: ["liabilities:noncurrent"], side: "credit" },
    { title: "ทุนจดทะเบียน (31xx)", keys: ["equity:capital"], side: "credit" },
    { title: "กำไรสะสม (33xx)", keys: ["equity:retained"], side: "credit" },
    { title: "รายได้จากการขาย (41xx)", keys: ["revenue:sales"], side: "credit" },
    { title: "รายได้จากบริการ (42xx)", keys: ["revenue:service"], side: "credit" },
    { title: "รายได้อื่น (43xx)", keys: ["revenue:other"], side: "credit" },
    { title: "ต้นทุนขาย (51xx + โสหุ้ยการผลิต)", keys: ["cogs:cogs"], side: "debit" },
    { title: "ค่าใช้จ่ายในการขาย (52xx)", keys: ["expense:selling"], side: "debit" },
    { title: "ค่าใช้จ่ายในการบริหาร (53xx)", keys: ["expense:admin"], side: "debit" },
    { title: "ต้นทุนทางการเงิน (53710-xx)", keys: ["expense:interest"], side: "debit" },
  ];

  for (const gd of groupDefs) {
    const accounts = getGroupAccounts(f.groups, gd.keys, gd.side);
    if (!accounts.length) continue;
    detailRows.push([gd.title]);
    detailRows.push(["เลขบัญชี", "ชื่อบัญชี", "ยอดเดบิต", "ยอดเครดิต", "ยอดสุทธิ"]);
    let groupTotal = 0;
    for (const a of accounts) {
      detailRows.push([a.number, a.display, a.debit, a.credit, a.bal]);
      groupTotal += a.bal;
    }
    detailRows.push(["", `รวม ${gd.title}`, "", "", groupTotal]);
    detailRows.push([]);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(detailRows);
  ws2["!cols"] = [{ wch: 14 }, { wch: 40 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  ws2["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
  XLSX.utils.book_append_sheet(wb, ws2, "รายบัญชี");

  // ═══ Sheet 3: Account Classification ═══
  const overrideRows = [
    ["กฎการจัดหมวดบัญชี (Account Classification)"],
    [],
    ["โสหุ้ยการผลิต → ต้นทุนขาย (Manufacturing Overhead → COGS)"],
    [],
    ["ประเภท", "เลขบัญชี", "ชื่อบัญชี", "จากหมวดเดิม", "ย้ายเข้าหมวด"],
    ["โสหุ้ยการผลิต", "52000-09", "ค่าเช่าโรงงาน", "52xx ค่าใช้จ่ายขาย", "ต้นทุนขาย"],
    ["โสหุ้ยการผลิต", "53200-06", "ซ่อมบำรุง-อาคาร", "53xx ค่าใช้จ่ายบริหาร", "ต้นทุนขาย"],
    ["โสหุ้ยการผลิต", "53200-08", "ซ่อมบำรุง-เครื่องจักร", "53xx ค่าใช้จ่ายบริหาร", "ต้นทุนขาย"],
    ["โสหุ้ยการผลิต", "53200-13", "ซ่อมบำรุง-อาคารโรงงาน", "53xx ค่าใช้จ่ายบริหาร", "ต้นทุนขาย"],
    ["โสหุ้ยการผลิต", "53200-14", "ค่าน้ำมันรถโฟล์คลิฟท์", "53xx ค่าใช้จ่ายบริหาร", "ต้นทุนขาย"],
    ["โสหุ้ยการผลิต", "53400-01", "ค่าเสื่อมราคา-อาคาร", "53xx ค่าใช้จ่ายบริหาร", "ต้นทุนขาย"],
    ["โสหุ้ยการผลิต", "53400-02", "ค่าเสื่อมราคา-เครื่องจักร", "53xx ค่าใช้จ่ายบริหาร", "ต้นทุนขาย"],
    ["โสหุ้ยการผลิต", "53900-14", "ค่าแรงบวกกลับ", "53xx ค่าใช้จ่ายบริหาร", "ต้นทุนขาย"],
    [],
    ["หมายเหตุ: 53710-xx ดอกเบี้ยจ่ายแยกเป็น 'ต้นทุนทางการเงิน' ตาม Manager Account"],
    ["หมายเหตุ: 52000-10 ค่าเช่ายานพาหนะ ย้ายจากค่าใช้จ่ายขาย → ค่าใช้จ่ายบริหาร ตาม Manager Account"],
    [],
    [],
    ["ผังบัญชีหลัก (Thai Chart of Accounts)"],
    [],
    ["เลขนำหน้า", "หมวดบัญชี", "ประเภท", "ด้านปกติ"],
    ["11xx", "สินทรัพย์หมุนเวียน", "สินทรัพย์", "เดบิต"],
    ["12xx", "สินทรัพย์ไม่หมุนเวียน", "สินทรัพย์", "เดบิต"],
    ["21xx", "หนี้สินหมุนเวียน", "หนี้สิน", "เครดิต"],
    ["22xx", "หนี้สินไม่หมุนเวียน", "หนี้สิน", "เครดิต"],
    ["31xx", "ทุนจดทะเบียน", "ส่วนของเจ้าของ", "เครดิต"],
    ["33xx", "กำไรสะสม", "ส่วนของเจ้าของ", "เครดิต"],
    ["41xx", "รายได้จากการขาย", "รายได้", "เครดิต"],
    ["42xx", "รายได้จากบริการ", "รายได้", "เครดิต"],
    ["43xx", "รายได้อื่น", "รายได้", "เครดิต"],
    ["51xx", "ต้นทุนขาย", "ค่าใช้จ่าย", "เดบิต"],
    ["52xx", "ค่าใช้จ่ายในการขาย", "ค่าใช้จ่าย", "เดบิต"],
    ["53xx", "ค่าใช้จ่ายในการบริหาร", "ค่าใช้จ่าย", "เดบิต"],
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(overrideRows);
  ws3["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 40 }, { wch: 36 }, { wch: 28 }];
  ws3["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
  XLSX.utils.book_append_sheet(wb, ws3, "กฎจัดหมวด");

  // ═══ Sheet 4: COGS Structure ═══
  const cogsRows = [
    ["โครงสร้างต้นทุนขาย (COGS) — ตาม Excel CFO"],
    [],
    ["ลำดับ", "รายการ", "เลขบัญชี", "ยอด (ถ้ามี)", "หมายเหตุ"],
  ];
  const cogsAccounts = getGroupAccounts(f.groups, ["cogs:cogs"], "debit");
  const cogsLookup = {};
  for (const a of cogsAccounts) cogsLookup[a.number] = a;

  const structure = [
    { label: "สินค้าคงเหลือต้นงวด", account: "51200-00" },
    { label: "ซื้อวัตถุดิบและอุปกรณ์", account: "51400-01" },
    { label: "วัสดุสิ้นเปลือง", account: "51400-02" },
    { label: "ส่วนลดรับ", account: "51400-03" },
    { label: "ค่าระวางและค่าขนส่ง", account: "51410-01" },
    { label: "ค่าอากรขาเข้า", account: "51410-02" },
    { label: "ค่าใช้จ่ายนำเข้าอื่นๆ", account: "51410-03, 51410-04" },
    { label: "ค่าจ้างแรงงานรายวัน", account: "51420-01" },
    { label: "ค่าจ้างแรงงานช่างเหมา", account: "51420-02" },
    { label: "ค่าจ้างแรงงานนอก", account: "51420-03" },
    { label: "ค่าจ้างแรงงานช่างเหมา (ทำสี)", account: "51420-04" },
    { label: "ค่าจ้างทำของ", account: "51420-05" },
    { label: "ค่าบริการ", account: "51430-01" },
    { label: "── โสหุ้ยการผลิต (Manufacturing Overhead) ──", account: "" },
    { label: "ค่าเช่าโรงงาน", account: "52000-09", note: "52xx → ต้นทุน" },
    { label: "ซ่อมบำรุง-อาคารและสิ่งปลูกสร้าง", account: "53200-06", note: "53xx → ต้นทุน" },
    { label: "ซ่อมบำรุง-เครื่องจักร", account: "53200-08", note: "53xx → ต้นทุน" },
    { label: "ซ่อมบำรุง-อาคารโรงงาน", account: "53200-13", note: "53xx → ต้นทุน" },
    { label: "ค่าน้ำมันรถโฟล์คลิฟท์", account: "53200-14", note: "53xx → ต้นทุน" },
    { label: "ค่าเสื่อมราคา-อาคารและสิ่งปลูกสร้าง", account: "53400-01", note: "53xx → ต้นทุน" },
    { label: "ค่าเสื่อมราคา-เครื่องจักร", account: "53400-02", note: "53xx → ต้นทุน" },
    { label: "ค่าแรงบวกกลับ", account: "53900-14", note: "53xx → ต้นทุน" },
    { label: "── หัก: สินค้าคงเหลือปลายงวด ──", account: "" },
    { label: "วัตถุดิบคงเหลือ", account: "11500-01", note: "หักจาก TB" },
    { label: "สินค้าระหว่างผลิต", account: "11500-02", note: "หักจาก TB" },
    { label: "สินค้าสำเร็จรูป", account: "11500-03", note: "หักจาก TB" },
  ];

  structure.forEach((s, i) => {
    const a = cogsLookup[s.account?.split(",")[0]?.trim()];
    cogsRows.push([i + 1, s.label, s.account, a ? a.bal : "", s.note || ""]);
  });
  cogsRows.push([]);
  cogsRows.push(["", "สูตรต้นทุนขาย:", "", "", ""]);
  cogsRows.push(["", "ต้นทุนขาย = (ต้นทุนผลิต − สินค้าคงเหลือต้นงวด 51200) − สินค้าคงเหลือปลายงวด (115xx)", "", "", ""]);
  cogsRows.push(["", `ต้นทุนขายสุทธิ = ${fmt(f.cogs)}`, "", "", ""]);

  const ws4 = XLSX.utils.aoa_to_sheet(cogsRows);
  ws4["!cols"] = [{ wch: 8 }, { wch: 40 }, { wch: 22 }, { wch: 18 }, { wch: 24 }];
  ws4["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
  XLSX.utils.book_append_sheet(wb, ws4, "โครงสร้างต้นทุน");

  XLSX.writeFile(wb, `วิธีคำนวณ-KPI-${beYear}.xlsx`);
}

// ─── Sub-components ───

function KpiCard({ title, value, unit, color = "default", subtitle, tooltip, onDetail }) {
  const colorClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    default: "",
  };
  const card = (
    <Card
      shadow="none"
      isPressable={!!onDetail}
      onPress={onDetail}
      className={`border border-border ${tooltip ? "cursor-help" : ""} ${onDetail ? "hover:border-primary/50 transition-colors" : ""}`}
    >
      <CardBody className="gap-1">
        <div className="flex items-center gap-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          {tooltip && <Info size={10} className="text-muted-foreground" />}
        </div>
        <div className="flex items-baseline gap-1">
          <p className={`text-sm font-light ${colorClass[color] || ""}`}>{value}</p>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </CardBody>
    </Card>
  );
  if (!tooltip) return card;
  return <Tooltip content={tooltip} placement="bottom" delay={200} closeDelay={0}>{card}</Tooltip>;
}

function RatioCard({ title, value, subtitle, status, tooltip, previousValue, onDetail }) {
  const statusColor = {
    good: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    neutral: "text-muted-foreground",
  };
  const card = (
    <Card
      shadow="none"
      isPressable={!!onDetail}
      onPress={onDetail}
      className={`border border-border ${tooltip ? "cursor-help" : ""} ${onDetail ? "hover:border-primary/50 transition-colors" : ""}`}
    >
      <CardBody className="gap-1">
        <div className="flex items-center gap-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          {tooltip && <Info size={10} className="text-muted-foreground" />}
        </div>
        <p className={`text-sm font-light ${statusColor[status] || ""}`}>{value}</p>
        {previousValue != null && (
          <p className="text-sm text-muted-foreground">ปีก่อน: {previousValue}</p>
        )}
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </CardBody>
    </Card>
  );
  if (!tooltip) return card;
  return <Tooltip content={tooltip} placement="bottom" delay={200} closeDelay={0}>{card}</Tooltip>;
}

function ChartCard({ title, children, chip }) {
  return (
    <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-light">{title}</p>
          {chip && <Chip size="md" variant="flat" color={chip.color}>{chip.label}</Chip>}
        </div>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

// ─── Table column constants ───

const arAgingColumns = [
  { name: "ลูกค้า", uid: "name", sortable: true },
  { name: "รหัส", uid: "customerNumber", sortable: true },
  { name: "ปัจจุบัน", uid: "current", sortable: true },
  { name: "งวด 1", uid: "period1", sortable: true },
  { name: "งวด 2", uid: "period2", sortable: true },
  { name: "งวด 3+", uid: "period3", sortable: true },
  { name: "รวม", uid: "balanceDue", sortable: true },
  { name: "ใบแจ้งหนี้", uid: "actions" },
];

const apAgingColumns = [
  { name: "เจ้าหนี้", uid: "name", sortable: true },
  { name: "รหัส", uid: "vendorNumber", sortable: true },
  { name: "ปัจจุบัน", uid: "current", sortable: true },
  { name: "งวด 1", uid: "period1", sortable: true },
  { name: "งวด 2", uid: "period2", sortable: true },
  { name: "งวด 3+", uid: "period3", sortable: true },
  { name: "รวม", uid: "balanceDue", sortable: true },
  { name: "ใบแจ้งหนี้", uid: "actions" },
];


// ─── Main View Component ───

export default function FinanceDashboardView({
  loading,
  financials,
  bsChartData,
  isWaterfallData,
  expenseBreakdown,
  arChartData,
  arTotals,
  arConcentration,
  arAgingPie,
  arInvoiceMap,
  apChartData,
  apTotals,
  apAgingPie,
  apInvoiceMap,
  arTrendByMonth,
  apTrendByMonth,
  arOverdueBands,
  apOverdueBands,
  selectedAging,
  isAgingOpen,
  onAgingClose,
  openAgingDetail,
  agingInvoices,
  aiAnalysis,
  aiLoading,
  runAiAnalysis,
  reload,
  // Year selector
  selectedYear,
  setSelectedYear,
  // Inventory override
  inventoryOverride,
  onSaveInventoryOverride,
  onClearInventoryOverride,
  // GL Monthly Data props
  glLoading,
  glError,
  monthlyPnL,
  cogsDetail,
  sellingDetail,
  adminDetail,
  interestDetail,
  revenueDetail,
  monthlyChartData,
  cogsChartData,
  compYears,
  // CEO trend charts
  revenueTrend,
  profitTrend,
  trendYearKeys,
  // Cash Flow Forecast
  cashFlowAnalysis,
  cashFlowLoading,
  runCashFlowForecast,
}) {

  // ─── renderCell callbacks ───

  const arAgingRenderCell = useCallback((item, key) => {
    switch (key) {
      case "name":
        return <span className="font-light">{item.name}</span>;
      case "customerNumber":
        return <span className="font-mono text-muted-foreground">{item.customerNumber}</span>;
      case "current":
        return <span className="text-success">{fmt(item.current)}</span>;
      case "period1":
        return <span className="text-warning">{fmt(item.period1)}</span>;
      case "period2":
        return <span className="text-warning">{fmt(item.period2)}</span>;
      case "period3":
        return <span className="text-danger">{fmt(item.period3)}</span>;
      case "balanceDue":
        return <span className="font-light">{fmt(item.balanceDue)}</span>;
      case "actions": {
        const count = (arInvoiceMap[item.customerNumber] || []).length;
        return count > 0 ? (
          <Button variant="flat" size="md" onPress={() => openAgingDetail(item, "ar")}>
            <Eye size={14} /> {count} ใบ
          </Button>
        ) : <span className="text-muted-foreground">-</span>;
      }
      default:
        return item[key] || "-";
    }
  }, [arInvoiceMap, openAgingDetail]);

  const apAgingRenderCell = useCallback((item, key) => {
    switch (key) {
      case "name":
        return <span className="font-light">{item.name}</span>;
      case "vendorNumber":
        return <span className="font-mono text-muted-foreground">{item.vendorNumber}</span>;
      case "current":
        return <span className="text-success">{fmt(Math.abs(item.current))}</span>;
      case "period1":
        return <span className="text-warning">{fmt(Math.abs(item.period1))}</span>;
      case "period2":
        return <span className="text-warning">{fmt(Math.abs(item.period2))}</span>;
      case "period3":
        return <span className="text-danger">{fmt(Math.abs(item.period3))}</span>;
      case "balanceDue":
        return <span className="font-light">{fmt(Math.abs(item.balanceDue))}</span>;
      case "actions": {
        const count = (apInvoiceMap[item.vendorNumber] || []).length;
        return count > 0 ? (
          <Button variant="bordered" size="md" onPress={() => openAgingDetail(item, "ap")}>
            <Eye size={14} /> {count} ใบ
          </Button>
        ) : <span className="text-muted-foreground">-</span>;
      }
      default:
        return item[key] || "-";
    }
  }, [apInvoiceMap, openAgingDetail]);

  // ─── KPI Detail Modal state ───
  const [kpiDetail, setKpiDetail] = useState(null); // { title, source, formula, calc, notes, groups, keys, normalSide }

  // ─── Loading state ───

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  // ─── Ratio status helpers ───

  const currentRatioStatus = !financials ? "neutral"
    : financials.currentRatio >= 2 ? "good"
    : financials.currentRatio >= 1 ? "warning"
    : "danger";

  const deStatus = !financials ? "neutral"
    : financials.debtToEquity <= 1 ? "good"
    : financials.debtToEquity <= 2 ? "warning"
    : "danger";

  const grossMarginStatus = !financials ? "neutral"
    : financials.grossMargin >= 30 ? "good"
    : financials.grossMargin >= 15 ? "warning"
    : "danger";

  const netMarginStatus = !financials ? "neutral"
    : financials.netMargin >= 10 ? "good"
    : financials.netMargin >= 5 ? "warning"
    : "danger";

  // Build year options for dropdown
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 4; y--) {
    yearOptions.push({ key: String(y), label: `${y + 543} (${y})` });
  }

  // Line chart colors for each year (oldest → newest: light → dark)
  const TREND_COLORS = ["#A1A1AA", "#F5A524", "#006FEE"]; // gray, amber, blue

  return (
    <div className="flex flex-col w-full gap-4">
      {/* ═══ Year Selector + Trend Charts ═══ */}
      <div className="flex items-center gap-3">
        <Select
          size="md"
          variant="bordered"
          className="w-44"
          aria-label="เลือกปีงบ"
          selectedKeys={[String(selectedYear)]}
          onSelectionChange={(keys) => {
            const val = [...keys][0];
            if (val) setSelectedYear(Number(val));
          }}
        >
          {yearOptions.map((opt) => (
            <SelectItem key={opt.key}>{opt.label}</SelectItem>
          ))}
        </Select>
        <span className="text-sm text-muted-foreground">
          แสดงข้อมูล 3 ปี: พ.ศ. {(selectedYear - 2) + 543}–{selectedYear + 543}
        </span>
        {glLoading && <Loading />}
        <div className="ml-auto">
          <Button
            variant="bordered"
            size="md"
            isDisabled={!financials}
            startContent={<Download size={14} />}
            onPress={() => exportCalculationReport(financials, selectedYear)}
          >
            Export วิธีคำนวณ
          </Button>
        </div>
      </div>

      {/* Revenue & Profit Trend Line Charts */}
      {trendYearKeys?.length > 0 && revenueTrend?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="แนวโน้มรายได้ (3 ปี)" chip={{ label: "Revenue", color: "primary" }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtShort} />
                <RechartsTooltip formatter={(v, name) => [fmt(v), `พ.ศ. ${name}`]} contentStyle={{ fontSize: 12 }} />
                <Legend formatter={(v) => `พ.ศ. ${v}`} />
                {trendYearKeys.map((beYear, i) => (
                  <Line
                    key={beYear}
                    type="monotone"
                    dataKey={beYear}
                    stroke={TREND_COLORS[i]}
                    strokeWidth={i === trendYearKeys.length - 1 ? 2.5 : 1.5}
                    strokeDasharray={i === trendYearKeys.length - 1 ? undefined : "5 3"}
                    dot={i === trendYearKeys.length - 1 ? { r: 3 } : false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="แนวโน้มกำไรสุทธิ (3 ปี)" chip={{ label: "Net Profit", color: "success" }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={profitTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtShort} />
                <RechartsTooltip formatter={(v, name) => [fmt(v), `พ.ศ. ${name}`]} contentStyle={{ fontSize: 12 }} />
                <Legend formatter={(v) => `พ.ศ. ${v}`} />
                {trendYearKeys.map((beYear, i) => (
                  <Line
                    key={beYear}
                    type="monotone"
                    dataKey={beYear}
                    stroke={TREND_COLORS[i]}
                    strokeWidth={i === trendYearKeys.length - 1 ? 2.5 : 1.5}
                    strokeDasharray={i === trendYearKeys.length - 1 ? undefined : "5 3"}
                    dot={i === trendYearKeys.length - 1 ? { r: 3 } : false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ═══ Section: ภาพรวม ═══ */}

      {/* Section 1: Financial Position KPIs — ข้อมูลจาก Trial Balance (งบทดลอง) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <KpiCard
              title="สินทรัพย์รวม"
              value={financials ? fmt(financials.totalAssets) : "-"}
              color="primary"
              subtitle={financials ? `หมุนเวียน ${fmt(financials.currentAssets)}` : ""}
              tooltip={financials && (
                <div className="px-1 py-1 max-w-xs">
                  <p className="text-tiny font-light">ที่มา: Trial Balance → API: trialBalances</p>
                  <p className="text-tiny font-light mt-1">สินทรัพย์หมุนเวียน (11xx) + ไม่หมุนเวียน (12xx)</p>
                  <p className="text-tiny text-muted-foreground">= {fmt(financials.currentAssets)} + {fmt(financials.noncurrentAssets)}</p>
                  <p className="text-tiny text-primary mt-1">คลิกเพื่อดูรายบัญชีทั้งหมด</p>
                </div>
              )}
              onDetail={financials ? () => setKpiDetail({
                title: "สินทรัพย์รวม",
                source: "Trial Balance → API: trialBalances",
                formula: "สินทรัพย์หมุนเวียน (11xx) + ไม่หมุนเวียน (12xx)",
                calc: `= ${fmt(financials.currentAssets)} + ${fmt(financials.noncurrentAssets)} = ${fmt(financials.totalAssets)}`,
                notes: "คำนวณ: ยอดเดบิต − ยอดเครดิต ของบัญชีหมวด 1 (accountType = Posting)",
                groups: true, keys: ["assets:current", "assets:noncurrent"], normalSide: "debit",
              }) : undefined}
            />
            <KpiCard
              title="หนี้สินรวม"
              value={financials ? fmt(financials.totalLiabilities) : "-"}
              color="danger"
              subtitle={financials ? `หมุนเวียน ${fmt(financials.currentLiabilities)}` : ""}
              tooltip={financials && (
                <div className="px-1 py-1 max-w-xs">
                  <p className="text-tiny font-light">ที่มา: Trial Balance → API: trialBalances</p>
                  <p className="text-tiny font-light mt-1">หนี้สินหมุนเวียน (21xx) + ไม่หมุนเวียน (22xx)</p>
                  <p className="text-tiny text-muted-foreground">= {fmt(financials.currentLiabilities)} + {fmt(financials.noncurrentLiabilities)}</p>
                  <p className="text-tiny text-primary mt-1">คลิกเพื่อดูรายบัญชีทั้งหมด</p>
                </div>
              )}
              onDetail={financials ? () => setKpiDetail({
                title: "หนี้สินรวม",
                source: "Trial Balance → API: trialBalances",
                formula: "หนี้สินหมุนเวียน (21xx) + ไม่หมุนเวียน (22xx)",
                calc: `= ${fmt(financials.currentLiabilities)} + ${fmt(financials.noncurrentLiabilities)} = ${fmt(financials.totalLiabilities)}`,
                notes: "คำนวณ: ยอดเครดิต − ยอดเดบิต ของบัญชีหมวด 2 (ด้านเครดิต = ปกติ)",
                groups: true, keys: ["liabilities:current", "liabilities:noncurrent"], normalSide: "credit",
              }) : undefined}
            />
            <KpiCard
              title="ส่วนของเจ้าของ"
              value={financials ? fmt(financials.totalEquity) : "-"}
              color="success"
              subtitle={financials ? `ทุน ${fmt(financials.shareCapital)}` : ""}
              tooltip={financials && (
                <div className="px-1 py-1 max-w-xs">
                  <p className="text-tiny font-light">ที่มา: Trial Balance → API: trialBalances</p>
                  <p className="text-tiny font-light mt-1">ทุนจดทะเบียน (31xx) + กำไรสะสม (33xx)</p>
                  <p className="text-tiny text-muted-foreground">= {fmt(financials.shareCapital)} + {fmt(financials.retainedEarnings)}</p>
                  <p className="text-tiny text-primary mt-1">คลิกเพื่อดูรายบัญชีทั้งหมด</p>
                </div>
              )}
              onDetail={financials ? () => setKpiDetail({
                title: "ส่วนของเจ้าของ",
                source: "Trial Balance → API: trialBalances",
                formula: "ทุนจดทะเบียน (31xx) + กำไรสะสม (33xx)",
                calc: `= ${fmt(financials.shareCapital)} + ${fmt(financials.retainedEarnings)} = ${fmt(financials.totalEquity)}`,
                notes: "คำนวณ: ยอดเครดิต − ยอดเดบิต ของบัญชีหมวด 3 (ด้านเครดิต = ปกติ)",
                groups: true, keys: ["equity:capital", "equity:retained"], normalSide: "credit",
              }) : undefined}
            />
            <KpiCard
              title="เงินทุนหมุนเวียน"
              value={financials ? fmt(financials.workingCapital) : "-"}
              color={financials && financials.workingCapital >= 0 ? "success" : "danger"}
              subtitle="Working Capital"
              tooltip={financials && (
                <div className="px-1 py-1 max-w-xs">
                  <p className="text-tiny font-light">ที่มา: Trial Balance → API: trialBalances</p>
                  <p className="text-tiny font-light mt-1">สินทรัพย์หมุนเวียน (11xx) − หนี้สินหมุนเวียน (21xx)</p>
                  <p className="text-tiny text-muted-foreground">= {fmt(financials.currentAssets)} − {fmt(financials.currentLiabilities)}</p>
                  <p className="text-tiny text-primary mt-1">คลิกเพื่อดูรายบัญชีทั้งหมด</p>
                </div>
              )}
              onDetail={financials ? () => setKpiDetail({
                title: "เงินทุนหมุนเวียน (Working Capital)",
                source: "Trial Balance → API: trialBalances",
                formula: "สินทรัพย์หมุนเวียน (11xx) − หนี้สินหมุนเวียน (21xx)",
                calc: `= ${fmt(financials.currentAssets)} − ${fmt(financials.currentLiabilities)} = ${fmt(financials.workingCapital)}`,
                notes: "ยิ่งมากยิ่งดี แสดงถึงสภาพคล่องของกิจการ",
                groups: true, keys: ["assets:current", "liabilities:current"], normalSide: "debit",
              }) : undefined}
            />
      </div>

      {/* Section 2: Income Statement KPIs — ข้อมูลจาก GL Entries (สมุดบัญชีแยกประเภท) กรองตามปี */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <KpiCard
              title="รายได้รวม"
              value={financials ? fmt(financials.totalRevenue) : "-"}
              color="success"
              subtitle={financials ? `ขาย ${fmt(financials.salesRevenue)}` : ""}
              tooltip={financials && (
                <div className="px-1 py-1 max-w-xs">
                  <p className="text-tiny font-light">ที่มา: GL Entries (กรองตามปี)</p>
                  <p className="text-tiny font-light mt-1">ขาย (41xx) + บริการ (42xx) + อื่น (43xx)</p>
                  <p className="text-tiny text-muted-foreground">= {fmt(financials.salesRevenue)} + {fmt(financials.serviceRevenue)} + {fmt(financials.otherIncome)}</p>
                  <p className="text-tiny text-primary mt-1">คลิกเพื่อดูรายบัญชีทั้งหมด</p>
                </div>
              )}
              onDetail={financials ? () => setKpiDetail({
                title: "รายได้รวม",
                source: "GL Entries → API: generalLedgerEntries (กรองตามปี)",
                formula: "รายได้ขาย (41xx) + บริการ (42xx) + อื่น (43xx)",
                calc: `= ${fmt(financials.salesRevenue)} + ${fmt(financials.serviceRevenue)} + ${fmt(financials.otherIncome)} = ${fmt(financials.totalRevenue)}`,
                notes: "คำนวณ: ยอดเครดิต − ยอดเดบิต ของบัญชีหมวด 4",
                groups: true, keys: ["revenue:sales", "revenue:service", "revenue:other"], normalSide: "credit",
              }) : undefined}
            />
            <KpiCard
              title="ต้นทุนขาย"
              value={financials ? fmt(financials.cogs) : "-"}
              color="warning"
              subtitle={financials ? `${financials.grossMargin.toFixed(1)}% Gross Margin` : ""}
              tooltip={financials && (
                <div className="px-1 py-1 max-w-xs">
                  <p className="text-tiny font-light">ที่มา: GL + TB Inventory Adjustment</p>
                  <p className="text-tiny font-light mt-1">ต้นทุนผลิต (GL) − สินค้าคงเหลือ (TB)</p>
                  <p className="text-tiny text-muted-foreground">= {fmt(financials.rawGlCogs)} − {fmt(financials.inventoryAdj)}</p>
                  <p className="text-tiny text-primary mt-1">คลิกเพื่อดูรายบัญชีทั้งหมด</p>
                </div>
              )}
              onDetail={financials ? () => setKpiDetail({
                title: "ต้นทุนขาย",
                source: "GL Entries + TB Inventory Adjustment",
                formula: "ต้นทุนผลิต (51xx + โสหุ้ย) − หัก สินค้าคงเหลือ (TB 115xx)",
                calc: `= ${fmt(financials.rawGlCogs)} − ${fmt(financials.inventoryAdj)} = ${fmt(financials.cogs)}`,
                notes: "51xx + โสหุ้ยการผลิต (52000-09, 53200-xx, 53400-xx, 53900-14)"
                  + (financials.inventoryAdj > 0 ? "\n* ปีที่ยังไม่ปิดบัญชี: GL ไม่มี 51200-00/115xx → ใช้ TB 115xx หักแทน" : ""),
                groups: true, keys: ["cogs:cogs"], normalSide: "debit",
                inventoryAccounts: financials.inventoryAccounts,
                inventoryTotal: financials.inventoryAdj,
              }) : undefined}
            />
            <KpiCard
              title="กำไรขั้นต้น"
              value={financials ? fmt(financials.grossProfit) : "-"}
              color={financials && financials.grossProfit >= 0 ? "success" : "danger"}
              tooltip={financials && (
                <div className="px-1 py-1 max-w-xs">
                  <p className="text-tiny font-light">ที่มา: GL (รายได้) − GL+TB (ต้นทุน)</p>
                  <p className="text-tiny font-light mt-1">รายได้รวม − ต้นทุนขายสุทธิ</p>
                  <p className="text-tiny text-muted-foreground">= {fmt(financials.totalRevenue)} − {fmt(financials.cogs)} = {fmt(financials.grossProfit)}</p>
                  <p className="text-tiny text-primary mt-1">คลิกเพื่อดูรายบัญชีทั้งหมด</p>
                </div>
              )}
              onDetail={financials ? () => setKpiDetail({
                title: "กำไรขั้นต้น (Gross Profit)",
                source: "GL Entries → API: generalLedgerEntries (กรองตามปี)",
                formula: "รายได้รวม (41-43xx) − ต้นทุนขาย (51xx + โสหุ้ย)",
                calc: `= ${fmt(financials.totalRevenue)} − ${fmt(financials.cogs)} = ${fmt(financials.grossProfit)}`,
                notes: `Gross Margin = ${financials.grossMargin.toFixed(1)}%`,
                groups: true, keys: ["revenue:sales", "revenue:service", "revenue:other", "cogs:cogs"], normalSide: "credit",
              }) : undefined}
            />
            <KpiCard
              title="กำไรสุทธิ"
              value={financials ? fmt(financials.netIncome) : "-"}
              color={financials && financials.netIncome >= 0 ? "success" : "danger"}
              subtitle={financials ? `${financials.netMargin.toFixed(1)}% Net Margin` : ""}
              tooltip={financials && (
                <div className="px-1 py-1 max-w-sm">
                  <p className="text-tiny font-light">ที่มา: GL Entries (กรองตามปี)</p>
                  <table className="text-tiny text-muted-foreground mt-1 w-full">
                    <tbody>
                      <tr><td>กำไรขั้นต้น</td><td className="text-right font-mono">{fmt(financials.grossProfit)}</td></tr>
                      <tr><td>52xx ค่าใช้จ่ายขาย</td><td className="text-right font-mono">({fmt(financials.sellingExpense)})</td></tr>
                      <tr><td>53xx ค่าใช้จ่ายบริหาร</td><td className="text-right font-mono">({fmt(financials.adminExpense)})</td></tr>
                      <tr><td>กำไรก่อนต้นทุนทางการเงิน</td><td className="text-right font-mono">{fmt(financials.operatingProfit)}</td></tr>
                      <tr><td>53710-xx ดอกเบี้ยจ่าย</td><td className="text-right font-mono">({fmt(financials.interestExpense)})</td></tr>
                      <tr className="font-light border-t border-border"><td>กำไรสุทธิ</td><td className="text-right font-mono">{fmt(financials.netIncome)}</td></tr>
                    </tbody>
                  </table>
                  <p className="text-tiny text-primary mt-1">คลิกเพื่อดูรายบัญชีทั้งหมด</p>
                </div>
              )}
              onDetail={financials ? () => setKpiDetail({
                title: "กำไรสุทธิก่อนภาษี",
                source: "GL Entries → API: generalLedgerEntries (กรองตามปี)",
                formula: "กำไรก่อนต้นทุนทางการเงิน − ดอกเบี้ยจ่าย (53710-xx)",
                calc: `= ${fmt(financials.operatingProfit)} − ${fmt(financials.interestExpense)} = ${fmt(financials.netIncome)}`,
                notes: "53710-xx ดอกเบี้ยจ่ายแยกเป็นต้นทุนทางการเงิน",
                groups: true, keys: ["expense:selling", "expense:admin", "expense:interest"], normalSide: "debit",
              }) : undefined}
            />
      </div>

      {/* Section 3: Financial Ratios — ที่มา: TB (งบดุล) + GL (งบกำไรขาดทุน) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RatioCard
          title="อัตราส่วนเงินทุนหมุนเวียน"
          value={financials ? financials.currentRatio.toFixed(2) : "-"}
          subtitle="Current Ratio (>2 ดี)"
          status={currentRatioStatus}
          previousValue={null}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-light">ที่มา: TB → API: trialBalances</p>
              <p className="text-tiny font-light mt-1">สินทรัพย์หมุนเวียน (11xx) ÷ หนี้สินหมุนเวียน (21xx)</p>
              <p className="text-tiny text-muted-foreground">= {fmt(financials.currentAssets)} ÷ {fmt(financials.currentLiabilities)}</p>
              <p className="text-tiny text-primary mt-1">คลิกเพื่อดูรายบัญชีทั้งหมด</p>
            </div>
          )}
          onDetail={financials ? () => setKpiDetail({
            title: "อัตราส่วนเงินทุนหมุนเวียน (Current Ratio)",
            source: "Trial Balance → API: trialBalances",
            formula: "สินทรัพย์หมุนเวียน (11xx) ÷ หนี้สินหมุนเวียน (21xx)",
            calc: `= ${fmt(financials.currentAssets)} ÷ ${fmt(financials.currentLiabilities)} = ${financials.currentRatio.toFixed(2)}`,
            notes: "≥ 2 = ดี, 1-2 = พอใช้, < 1 = เสี่ยง",
            groups: true, keys: ["assets:current", "liabilities:current"], normalSide: "debit",
          }) : undefined}
        />
        <RatioCard
          title="อัตราส่วนหนี้สินต่อทุน"
          value={financials ? financials.debtToEquity.toFixed(2) : "-"}
          subtitle="D/E Ratio (<1 ดี)"
          status={deStatus}
          previousValue={null}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-light">ที่มา: TB → API: trialBalances</p>
              <p className="text-tiny font-light mt-1">หนี้สินรวม (21xx+22xx) ÷ ส่วนของเจ้าของ (31xx+33xx)</p>
              <p className="text-tiny text-muted-foreground">= {fmt(financials.totalLiabilities)} ÷ {fmt(financials.totalEquity)}</p>
              <p className="text-tiny text-primary mt-1">คลิกเพื่อดูรายบัญชีทั้งหมด</p>
            </div>
          )}
          onDetail={financials ? () => setKpiDetail({
            title: "อัตราส่วนหนี้สินต่อทุน (D/E Ratio)",
            source: "Trial Balance → API: trialBalances",
            formula: "หนี้สินรวม (21xx+22xx) ÷ ส่วนของเจ้าของ (31xx+33xx)",
            calc: `= ${fmt(financials.totalLiabilities)} ÷ ${fmt(financials.totalEquity)} = ${financials.debtToEquity.toFixed(2)}`,
            notes: "≤ 1 = ดี, 1-2 = พอใช้, > 2 = เสี่ยง",
            groups: true, keys: ["liabilities:current", "liabilities:noncurrent", "equity:capital", "equity:retained"], normalSide: "credit",
          }) : undefined}
        />
        <RatioCard
          title="อัตรากำไรขั้นต้น"
          value={financials ? `${financials.grossMargin.toFixed(1)}%` : "-"}
          subtitle="Gross Margin (>30% ดี)"
          status={grossMarginStatus}
          previousValue={null}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-light">ที่มา: GL → API: generalLedgerEntries</p>
              <p className="text-tiny font-light mt-1">(กำไรขั้นต้น ÷ รายได้รวม) × 100</p>
              <p className="text-tiny text-muted-foreground">= ({fmt(financials.grossProfit)} ÷ {fmt(financials.totalRevenue)}) × 100</p>
              <p className="text-tiny text-primary mt-1">คลิกเพื่อดูรายบัญชีทั้งหมด</p>
            </div>
          )}
          onDetail={financials ? () => setKpiDetail({
            title: "อัตรากำไรขั้นต้น (Gross Margin)",
            source: "GL Entries → API: generalLedgerEntries (กรองตามปี)",
            formula: "(กำไรขั้นต้น ÷ รายได้รวม) × 100",
            calc: `= (${fmt(financials.grossProfit)} ÷ ${fmt(financials.totalRevenue)}) × 100 = ${financials.grossMargin.toFixed(1)}%`,
            notes: "รายได้: หมวด 4 (41-43xx) | ต้นทุน: หมวด 5 + โสหุ้ย\n≥ 30% = ดี, 15-30% = พอใช้",
            groups: true, keys: ["revenue:sales", "revenue:service", "revenue:other", "cogs:cogs"], normalSide: "credit",
          }) : undefined}
        />
        <RatioCard
          title="อัตรากำไรสุทธิ"
          value={financials ? `${financials.netMargin.toFixed(1)}%` : "-"}
          subtitle="Net Margin (>10% ดี)"
          status={netMarginStatus}
          previousValue={null}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-light">ที่มา: GL → API: generalLedgerEntries</p>
              <p className="text-tiny font-light mt-1">(กำไรสุทธิ ÷ รายได้รวม) × 100</p>
              <p className="text-tiny text-muted-foreground">= ({fmt(financials.netIncome)} ÷ {fmt(financials.totalRevenue)}) × 100</p>
              <p className="text-tiny text-primary mt-1">คลิกเพื่อดูรายบัญชีทั้งหมด</p>
            </div>
          )}
          onDetail={financials ? () => setKpiDetail({
            title: "อัตรากำไรสุทธิ (Net Margin)",
            source: "GL Entries → API: generalLedgerEntries (กรองตามปี)",
            formula: "(กำไรสุทธิ ÷ รายได้รวม) × 100",
            calc: `= (${fmt(financials.netIncome)} ÷ ${fmt(financials.totalRevenue)}) × 100 = ${financials.netMargin.toFixed(1)}%`,
            notes: "กำไรสุทธิ = รายได้ − ต้นทุน − ค่าใช้จ่ายขาย − ค่าใช้จ่ายบริหาร − ดอกเบี้ย\n≥ 10% = ดี, 5-10% = พอใช้",
            groups: true, keys: ["revenue:sales", "revenue:service", "revenue:other", "cogs:cogs", "expense:selling", "expense:admin", "expense:interest"], normalSide: "credit",
          }) : undefined}
        />
      </div>

      {/* Section 3.5: AI Analysis */}
      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="pb-0 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BotMessageSquare size={18} className="text-primary" />
            <p className="text-sm font-light">AI วิเคราะห์สถานะการเงิน</p>
            <Chip size="md" variant="flat" color="secondary">CFO Advisor</Chip>
          </div>
          <Button
            variant={aiAnalysis ? "bordered" : "solid"}
            color="primary"
            size="md"
            isLoading={aiLoading}
            isDisabled={!financials || aiLoading}
            onPress={runAiAnalysis}
            startContent={!aiLoading && (aiAnalysis ? <RefreshCw size={14} /> : <BotMessageSquare size={14} />)}
          >
            {aiAnalysis ? "วิเคราะห์ใหม่" : "เริ่มวิเคราะห์"}
          </Button>
        </CardHeader>
        <CardBody>
          {aiLoading && !aiAnalysis && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loading />
              <span className="text-sm text-muted-foreground">AI กำลังวิเคราะห์ข้อมูลการเงิน...</span>
            </div>
          )}
          {!aiAnalysis && !aiLoading && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              กดปุ่ม &quot;เริ่มวิเคราะห์&quot; เพื่อให้ AI วิเคราะห์สถานะการเงิน ให้คำแนะนำ และแผนปฏิบัติการ
            </p>
          )}
          {aiAnalysis && (
            <div className="prose prose-sm max-w-none dark:prose-invert text-foreground text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-2">
                      <table className="border-collapse w-full text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-default-100">{children}</thead>,
                  th: ({ children }) => (
                    <th className="border border-border px-3 py-1.5 text-left font-light text-foreground">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border px-3 py-1.5 text-foreground">{children}</td>
                  ),
                  tr: ({ children }) => <tr className="even:bg-default-50">{children}</tr>,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
                  li: ({ children }) => <li className="text-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="font-light text-foreground">{children}</strong>,
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="bg-default-100 rounded px-1 py-0.5 text-sm font-mono">{children}</code>
                    ) : (
                      <pre className="bg-default-100 rounded-lg p-3 overflow-x-auto my-2">
                        <code className="text-sm font-mono">{children}</code>
                      </pre>
                    ),
                }}
              >
                {aiAnalysis}
              </ReactMarkdown>
              {aiLoading && <Loading />}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Section 3.6: AI Cash Flow Forecast */}
      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="pb-0 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BotMessageSquare size={18} className="text-success" />
            <p className="text-sm font-light">AI พยากรณ์กระแสเงินสด</p>
            <Chip size="md" variant="flat" color="success">Cash Flow Advisor</Chip>
          </div>
          <Button
            variant={cashFlowAnalysis ? "bordered" : "solid"}
            color="success"
            size="md"
            isLoading={cashFlowLoading}
            isDisabled={!financials || cashFlowLoading}
            onPress={runCashFlowForecast}
            startContent={!cashFlowLoading && (cashFlowAnalysis ? <RefreshCw size={14} /> : <BotMessageSquare size={14} />)}
          >
            {cashFlowAnalysis ? "พยากรณ์ใหม่" : "เริ่มพยากรณ์"}
          </Button>
        </CardHeader>
        <CardBody>
          {cashFlowLoading && !cashFlowAnalysis && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loading />
              <span className="text-sm text-muted-foreground">AI กำลังพยากรณ์กระแสเงินสด...</span>
            </div>
          )}
          {!cashFlowAnalysis && !cashFlowLoading && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              กดปุ่ม &quot;เริ่มพยากรณ์&quot; เพื่อให้ AI วิเคราะห์สภาพคล่อง พยากรณ์กระแสเงินสด 30/60/90 วัน และแนะนำกลยุทธ์บริหารเงินสด
            </p>
          )}
          {cashFlowAnalysis && (
            <div className="prose prose-sm max-w-none dark:prose-invert text-foreground text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-2">
                      <table className="border-collapse w-full text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-default-100">{children}</thead>,
                  th: ({ children }) => (
                    <th className="border border-border px-3 py-1.5 text-left font-light text-foreground">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border px-3 py-1.5 text-foreground">{children}</td>
                  ),
                  tr: ({ children }) => <tr className="even:bg-default-50">{children}</tr>,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
                  li: ({ children }) => <li className="text-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="font-light text-foreground">{children}</strong>,
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="bg-default-100 rounded px-1 py-0.5 text-sm font-mono">{children}</code>
                    ) : (
                      <pre className="bg-default-100 rounded-lg p-3 overflow-x-auto my-2">
                        <code className="text-sm font-mono">{children}</code>
                      </pre>
                    ),
                }}
              >
                {cashFlowAnalysis}
              </ReactMarkdown>
              {cashFlowLoading && <Loading />}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Section 4: Balance Sheet & Expense Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="โครงสร้างทางการเงิน" chip={financials ? { label: `${financials.totalAccounts} บัญชี`, color: "primary" } : undefined}>
          {bsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={bsChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {bsChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <RechartsTooltip formatter={(v) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</p>
          )}
        </ChartCard>

        <ChartCard title="สัดส่วนค่าใช้จ่าย" chip={financials ? { label: `฿${fmt(financials.cogs + financials.totalExpense)}`, color: "warning" } : undefined}>
          {expenseBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {expenseBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <RechartsTooltip formatter={(v) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</p>
          )}
        </ChartCard>
      </div>

      {/* Section 5: Income Statement Waterfall */}
      <ChartCard title="งบกำไรขาดทุน (Revenue & Cost Breakdown)" chip={financials ? { label: financials.netIncome >= 0 ? "กำไร" : "ขาดทุน", color: financials.netIncome >= 0 ? "success" : "danger" } : undefined}>
        {isWaterfallData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={isWaterfallData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmtShort} />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="rounded-lg border border-border bg-background p-3 shadow-lg">
                      <p className="mb-1 text-sm font-light">{d?.name}</p>
                      <p className={`text-sm ${d?.value >= 0 ? "text-success" : "text-danger"}`}>
                        {d?.value >= 0 ? "+" : ""}{fmt(d?.value)}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {isWaterfallData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</p>
        )}
      </ChartCard>

      {/* ═══ Section: งบกำไรขาดทุนรายเดือน (GL Data) ═══ */}
      <div className="flex items-center gap-3 mt-2">
        <div className="h-px flex-1 bg-default-200" />
        <span className="text-sm font-light text-muted-foreground whitespace-nowrap">
          รายงานรายเดือน — ปีงบ พ.ศ. {(selectedYear || 0) + 543}
        </span>
        <div className="h-px flex-1 bg-default-200" />
      </div>

      {glError ? (
        <Card shadow="none" className="border border-danger-200 bg-danger-50">
          <CardBody className="py-4 text-center">
            <p className="text-sm text-danger">โหลดข้อมูล GL ล้มเหลว: {glError}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <MonthlyPnLTable
            data={monthlyPnL}
            chartData={monthlyChartData}
            loading={glLoading}
            year={selectedYear}
            compYears={compYears}
          />
          <RevenueDetailTable
            data={revenueDetail}
            loading={glLoading}
            year={selectedYear}
            compYears={compYears}
          />
          <CogsDetailTable
            data={cogsDetail}
            chartData={cogsChartData}
            loading={glLoading}
            year={selectedYear}
            compYears={compYears}
            inventoryOverride={inventoryOverride}
            onSaveInventoryOverride={onSaveInventoryOverride}
            onClearInventoryOverride={onClearInventoryOverride}
          />
          <ExpenseDetailTable
            sellingDetail={sellingDetail}
            adminDetail={adminDetail}
            interestDetail={interestDetail}
            loading={glLoading}
            year={selectedYear}
            compYears={compYears}
          />
        </>
      )}

      {/* ═══ Section: ลูกหนี้/เจ้าหนี้ ═══ */}
      <div className="flex items-center gap-3 mt-2">
        <div className="h-px flex-1 bg-default-200" />
        <span className="text-sm font-light text-muted-foreground whitespace-nowrap">ลูกหนี้ / เจ้าหนี้</span>
        <div className="h-px flex-1 bg-default-200" />
      </div>

      {/* Section 7: AR/AP KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          title="ลูกหนี้ค้างชำระ"
          value={arTotals ? fmt(arTotals.balanceDue) : "-"}
          color="warning"
          subtitle={arChartData.length ? `${arChartData.length} ราย` : ""}
        />
        <KpiCard
          title="ลูกหนี้ค้างนาน (60+ วัน)"
          value={arTotals ? fmt(arTotals.period2 + arTotals.period3) : "-"}
          color="danger"
          subtitle={arConcentration ? `${arConcentration.overdueRatio.toFixed(0)}% ของยอดรวม` : ""}
        />
        <KpiCard
          title="เจ้าหนี้ค้างชำระ"
          value={apTotals ? fmt(Math.abs(apTotals.balanceDue)) : "-"}
          color="warning"
          subtitle={apChartData.length ? `${apChartData.length} ราย` : ""}
        />
        <KpiCard
          title="AR Concentration (Top 5)"
          value={arConcentration ? `${arConcentration.top5Pct.toFixed(0)}%` : "-"}
          color={arConcentration && arConcentration.top5Pct > 60 ? "danger" : "success"}
          subtitle={arConcentration ? `฿${fmt(arConcentration.top5Total)}` : ""}
        />
      </div>

      {/* Section 8: Aging Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="สัดส่วนอายุลูกหนี้">
          {arAgingPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={arAgingPie} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {arAgingPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <RechartsTooltip formatter={(v) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</p>
          )}
        </ChartCard>

        <ChartCard title="สัดส่วนอายุเจ้าหนี้">
          {apAgingPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={apAgingPie} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {apAgingPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <RechartsTooltip formatter={(v) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</p>
          )}
        </ChartCard>
      </div>

      {/* Section 8.5: AR/AP Trend -- Monthly Outstanding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard
          title="แนวโน้มลูกหนี้ค้างชำระ (รายเดือน)"
          chip={arTrendByMonth.length ? { label: `${arTrendByMonth.reduce((s, m) => s + m.count, 0)} ใบ`, color: "warning" } : undefined}
        >
          {arTrendByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={arTrendByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={fmtShort} />
                <RechartsTooltip
                  labelFormatter={fmtMonth}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-border bg-background p-3 shadow-lg">
                        <p className="mb-1 text-sm font-light">{fmtMonth(label)}</p>
                        <p className="text-sm">{d?.count} ใบ</p>
                        <p className="text-sm text-primary">ยอดเต็ม: {fmt(d?.total)}</p>
                        <p className="text-sm text-warning">ค้างชำระ: {fmt(d?.remaining)}</p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="total" name="ยอดเต็ม" fill="#006FEE" radius={[4, 4, 0, 0]} />
                <Bar dataKey="remaining" name="ค้างชำระ" fill="#F5A524" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</p>
          )}
        </ChartCard>

        <ChartCard
          title="แนวโน้มเจ้าหนี้ค้างชำระ (รายเดือน)"
          chip={apTrendByMonth.length ? { label: `${apTrendByMonth.reduce((s, m) => s + m.count, 0)} ใบ`, color: "danger" } : undefined}
        >
          {apTrendByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={apTrendByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={fmtShort} />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-border bg-background p-3 shadow-lg">
                        <p className="mb-1 text-sm font-light">{fmtMonth(label)}</p>
                        <p className="text-sm">{d?.count} ใบ</p>
                        <p className="text-sm text-danger">ยอดรวม: {fmt(d?.total)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="total" name="ยอดรวม" fill="#F31260" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</p>
          )}
        </ChartCard>
      </div>

      {/* Section 8.6: Overdue Aging Band Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="การกระจายลูกหนี้ตามอายุหนี้ (จากใบแจ้งหนี้)">
          {arOverdueBands.some((b) => b.count > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={arOverdueBands}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={fmtShort} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-border bg-background p-3 shadow-lg">
                        <p className="mb-1 text-sm font-light">{d?.name}</p>
                        <p className="text-sm">{d?.count} ใบ</p>
                        <p className="text-sm text-warning">ค้างชำระ: {fmt(d?.remaining)}</p>
                        <p className="text-sm text-muted-foreground">ยอดเต็ม: {fmt(d?.total)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="remaining" name="ยอดค้างชำระ" radius={[4, 4, 0, 0]}>
                  {arOverdueBands.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</p>
          )}
        </ChartCard>

        <ChartCard title="การกระจายเจ้าหนี้ตามอายุหนี้ (จากใบแจ้งหนี้)">
          {apOverdueBands.some((b) => b.count > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={apOverdueBands}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={fmtShort} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-border bg-background p-3 shadow-lg">
                        <p className="mb-1 text-sm font-light">{d?.name}</p>
                        <p className="text-sm">{d?.count} ใบ</p>
                        <p className="text-sm text-danger">ยอดรวม: {fmt(d?.total)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="total" name="ยอดรวม" radius={[4, 4, 0, 0]}>
                  {apOverdueBands.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</p>
          )}
        </ChartCard>
      </div>

      {/* Section 9: Aged Receivables with Expandable Invoices */}
      <ChartCard title="อายุหนี้ลูกหนี้ (Aged Receivables)" chip={arTotals ? { label: `฿${fmt(arTotals.balanceDue)}`, color: "warning" } : undefined}>
        {arChartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={50}>
              <BarChart data={[arTotals]} layout="vertical" barSize={20}>
                <XAxis type="number" hide />
                <YAxis type="category" hide />
                <RechartsTooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="current" stackId="a" fill="#17C964" name="ปัจจุบัน" />
                <Bar dataKey="period1" stackId="a" fill="#F5A524" name="ค้าง 1 งวด" />
                <Bar dataKey="period2" stackId="a" fill="#F97316" name="ค้าง 2 งวด" />
                <Bar dataKey="period3" stackId="a" fill="#F31260" name="ค้าง 3+ งวด" />
              </BarChart>
            </ResponsiveContainer>
            <DataTable
              columns={arAgingColumns}
              data={arChartData}
              renderCell={arAgingRenderCell}
              rowKey="customerNumber"
              searchKeys={["name", "customerNumber"]}
              searchPlaceholder="ค้นหาลูกค้า..."
              defaultSortDescriptor={{ column: "balanceDue", direction: "descending" }}
              emptyContent="ไม่มีข้อมูล"
              actionMenuItems={(item) => {
                const count = (arInvoiceMap[item.customerNumber] || []).length;
                return count > 0
                  ? [{ key: "view", label: `ดูรายละเอียด (${count} ใบ)`, icon: <Eye size={16} />, onPress: () => openAgingDetail(item, "ar") }]
                  : [];
              }}
            />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</p>
        )}
      </ChartCard>

      {/* Section 10: Aged Payables with Expandable Invoices */}
      <ChartCard title="อายุหนี้เจ้าหนี้ (Aged Payables)" chip={apTotals ? { label: `฿${fmt(Math.abs(apTotals.balanceDue))}`, color: "danger" } : undefined}>
        {apChartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={50}>
              <BarChart data={[{
                current: Math.abs(apTotals?.current || 0),
                period1: Math.abs(apTotals?.period1 || 0),
                period2: Math.abs(apTotals?.period2 || 0),
                period3: Math.abs(apTotals?.period3 || 0),
              }]} layout="vertical" barSize={20}>
                <XAxis type="number" hide />
                <YAxis type="category" hide />
                <RechartsTooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="current" stackId="a" fill="#17C964" name="ปัจจุบัน" />
                <Bar dataKey="period1" stackId="a" fill="#F5A524" name="ค้าง 1 งวด" />
                <Bar dataKey="period2" stackId="a" fill="#F97316" name="ค้าง 2 งวด" />
                <Bar dataKey="period3" stackId="a" fill="#F31260" name="ค้าง 3+ งวด" />
              </BarChart>
            </ResponsiveContainer>
            <DataTable
              columns={apAgingColumns}
              data={apChartData}
              renderCell={apAgingRenderCell}
              rowKey="vendorNumber"
              searchKeys={["name", "vendorNumber"]}
              searchPlaceholder="ค้นหาเจ้าหนี้..."
              emptyContent="ไม่มีข้อมูล"
              actionMenuItems={(item) => {
                const count = (apInvoiceMap[item.vendorNumber] || []).length;
                return count > 0
                  ? [{ key: "view", label: `ดูรายละเอียด (${count} ใบ)`, icon: <Eye size={16} />, onPress: () => openAgingDetail(item, "ap") }]
                  : [];
              }}
            />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</p>
        )}
      </ChartCard>

      {/* KPI Detail Modal */}
      <Modal isOpen={!!kpiDetail} onClose={() => setKpiDetail(null)} size="4xl" scrollBehavior="inside">
        <ModalContent>
          {kpiDetail && (() => {
            const accounts = kpiDetail.groups
              ? getGroupAccounts(financials?.groups, kpiDetail.keys, kpiDetail.normalSide)
              : [];
            const total = accounts.reduce((s, a) => s + a.bal, 0);
            // Group accounts by their groupName for sectioned display
            const sections = [];
            const seen = new Set();
            for (const a of accounts) {
              if (!seen.has(a.groupKey)) {
                seen.add(a.groupKey);
                sections.push({ key: a.groupKey, name: a.groupName, accounts: accounts.filter(x => x.groupKey === a.groupKey) });
              }
            }
            return (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <span>{kpiDetail.title}</span>
                  <span className="text-sm font-light text-muted-foreground">ปีงบ พ.ศ. {selectedYear + 543} ({selectedYear}) — {kpiDetail.source}</span>
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-3">
                    {/* Formula & Calculation */}
                    <div className="rounded-lg bg-default-50 p-3">
                      <p className="text-sm font-light">{kpiDetail.formula}</p>
                      <p className="text-sm text-muted-foreground mt-1">{kpiDetail.calc}</p>
                      {kpiDetail.notes && <p className="text-sm text-muted-foreground mt-2">{kpiDetail.notes}</p>}
                    </div>

                    {/* Extra content (e.g. COGS breakdown table) */}
                    {kpiDetail.extra}

                    {/* Account sections */}
                    {sections.map((sec) => (
                      <div key={sec.key}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-light">{sec.name}</p>
                          <Chip size="md" variant="flat" color="primary">{sec.accounts.length} บัญชี</Chip>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-default-100">
                              <tr>
                                <th className="text-left px-2 py-1.5 font-light w-[100px]">เลขบัญชี</th>
                                <th className="text-left px-2 py-1.5 font-light">ชื่อบัญชี</th>
                                <th className="text-right px-2 py-1.5 font-light w-[120px]">ยอด</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sec.accounts.map((a) => (
                                <tr key={a.number} className="border-b border-border">
                                  <td className="px-2 py-1 font-mono text-muted-foreground">{a.number}</td>
                                  <td className="px-2 py-1">{a.display}</td>
                                  <td className="px-2 py-1 text-right font-mono">{fmt(a.bal)}</td>
                                </tr>
                              ))}
                              <tr className="bg-default-50 font-light">
                                <td className="px-2 py-1.5" colSpan={2}>รวม {sec.name}</td>
                                <td className="px-2 py-1.5 text-right font-mono">{fmt(sec.accounts.reduce((s, a) => s + a.bal, 0))}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}

                    {/* Inventory deduction section (for COGS detail) */}
                    {kpiDetail.inventoryAccounts && Object.keys(kpiDetail.inventoryAccounts).length > 0 && (() => {
                      const invEntries = Object.entries(kpiDetail.inventoryAccounts).sort((a, b) => a[0].localeCompare(b[0]));
                      const invTotal = kpiDetail.inventoryTotal || 0;
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-light">หัก: สินค้าคงเหลือ (TB 115xx)</p>
                            <Chip size="md" variant="flat" color="warning">{invEntries.length} บัญชี</Chip>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-warning-50">
                                <tr>
                                  <th className="text-left px-2 py-1.5 font-light w-[100px]">เลขบัญชี</th>
                                  <th className="text-left px-2 py-1.5 font-light">ชื่อบัญชี</th>
                                  <th className="text-right px-2 py-1.5 font-light w-[120px]">ยอด</th>
                                </tr>
                              </thead>
                              <tbody>
                                {invEntries.map(([num, a]) => (
                                  <tr key={num} className="border-b border-border">
                                    <td className="px-2 py-1 font-mono text-muted-foreground">{num}</td>
                                    <td className="px-2 py-1">{a.name}</td>
                                    <td className="px-2 py-1 text-right font-mono text-danger">({fmt(a.balance)})</td>
                                  </tr>
                                ))}
                                <tr className="bg-warning-50 font-light">
                                  <td className="px-2 py-1.5" colSpan={2}>รวมหัก สินค้าคงเหลือ</td>
                                  <td className="px-2 py-1.5 text-right font-mono text-danger">({fmt(invTotal)})</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Grand total */}
                    {sections.length > 1 && (
                      <div className="rounded-lg bg-primary-50 p-3 flex justify-between items-center">
                        <p className="text-sm font-light">รวมทั้งสิ้น ({accounts.length} บัญชี)</p>
                        <p className="text-sm font-light font-mono">{fmt(total)}</p>
                      </div>
                    )}

                    {/* COGS net total (after inventory deduction) */}
                    {kpiDetail.inventoryTotal > 0 && (
                      <div className="rounded-lg bg-success-50 p-3 flex justify-between items-center">
                        <p className="text-sm font-light">ต้นทุนขายสุทธิ (หลังหักสินค้าคงเหลือ)</p>
                        <p className="text-sm font-light font-mono">{fmt(total - (kpiDetail.inventoryTotal || 0))}</p>
                      </div>
                    )}
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button
                    variant="flat"
                    size="md"
                    startContent={<Download size={14} />}
                    onPress={() => exportCalculationReport(financials, selectedYear)}
                  >
                    Export ทั้งหมด
                  </Button>
                  <Button variant="bordered" size="md" onPress={() => setKpiDetail(null)}>ปิด</Button>
                </ModalFooter>
              </>
            );
          })()}
        </ModalContent>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal isOpen={isAgingOpen} onClose={onAgingClose} size="4xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>ใบแจ้งหนี้ — {selectedAging?.item.name}</span>
            <span className="text-sm font-light text-muted-foreground">
              {selectedAging?.type === "ar" ? "ลูกค้า" : "เจ้าหนี้"}{" "}
              {selectedAging?.type === "ar" ? selectedAging?.item.customerNumber : selectedAging?.item.vendorNumber} |{" "}
              ยอดรวม {fmt(Math.abs(selectedAging?.item.balanceDue || 0))}
            </span>
          </ModalHeader>
          <ModalBody>
            <Table aria-label="รายการใบแจ้งหนี้" shadow="none">
              <TableHeader>
                <TableColumn>เลขที่</TableColumn>
                <TableColumn>วันที่ออก</TableColumn>
                <TableColumn>วันครบกำหนด</TableColumn>
                <TableColumn>ยอดเต็ม</TableColumn>
                <TableColumn>ค้างชำระ</TableColumn>
                <TableColumn>ค้าง (วัน)</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่มีใบแจ้งหนี้">
                {agingInvoices.map((inv) => (
                  <TableRow key={inv.number}>
                    <TableCell className="font-mono font-light">{inv.number}</TableCell>
                    <TableCell>{fmtDate(inv.invoiceDate)}</TableCell>
                    <TableCell>
                      <span className={inv.daysOverdue > 0 ? "text-danger" : ""}>{fmtDate(inv.dueDate)}</span>
                    </TableCell>
                    <TableCell>{fmt(Math.abs(inv.totalAmountIncludingTax))}</TableCell>
                    <TableCell className="font-light text-warning">{fmt(inv.remainingAmount || 0)}</TableCell>
                    <TableCell>
                      <span className={`font-light ${daysOverdueColor(inv.daysOverdue)}`}>
                        {inv.daysOverdue > 0 ? `${inv.daysOverdue} วัน` : "ยังไม่ถึงกำหนด"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" onPress={onAgingClose}>ปิด</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
