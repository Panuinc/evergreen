"use client";

import { useCallback, useState } from "react";
import {
  Card, CardBody, CardHeader, Spinner, Chip, Tooltip,
  Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  useDisclosure,
} from "@heroui/react";
import { Eye, Info } from "lucide-react";
import { useFinanceDashboard } from "@/hooks/finance/useFinanceDashboard";
import DataTable from "@/components/ui/DataTable";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";

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

function KpiCard({ title, value, unit, color = "default", subtitle, tooltip }) {
  const colorClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    default: "",
  };
  const card = (
    <Card shadow="none" className={`border border-default-200 ${tooltip ? "cursor-help" : ""}`}>
      <CardBody className="gap-1">
        <div className="flex items-center gap-1">
          <p className="text-xs text-default-500">{title}</p>
          {tooltip && <Info size={10} className="text-default-400" />}
        </div>
        <div className="flex items-baseline gap-1">
          <p className={`text-2xl font-bold ${colorClass[color] || ""}`}>{value}</p>
          {unit && <span className="text-xs text-default-400">{unit}</span>}
        </div>
        {subtitle && <p className="text-xs text-default-400">{subtitle}</p>}
      </CardBody>
    </Card>
  );
  if (!tooltip) return card;
  return <Tooltip content={tooltip} placement="bottom" delay={200} closeDelay={0}>{card}</Tooltip>;
}

function RatioCard({ title, value, subtitle, status, tooltip }) {
  const statusColor = {
    good: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    neutral: "text-default-500",
  };
  const card = (
    <Card shadow="none" className={`border border-default-200 ${tooltip ? "cursor-help" : ""}`}>
      <CardBody className="gap-1">
        <div className="flex items-center gap-1">
          <p className="text-xs text-default-500">{title}</p>
          {tooltip && <Info size={10} className="text-default-400" />}
        </div>
        <p className={`text-2xl font-bold ${statusColor[status] || ""}`}>{value}</p>
        {subtitle && <p className="text-xs text-default-400">{subtitle}</p>}
      </CardBody>
    </Card>
  );
  if (!tooltip) return card;
  return <Tooltip content={tooltip} placement="bottom" delay={200} closeDelay={0}>{card}</Tooltip>;
}

function ChartCard({ title, children, chip }) {
  return (
    <Card shadow="none" className="border border-default-200">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{title}</p>
          {chip && <Chip size="sm" variant="flat" color={chip.color}>{chip.label}</Chip>}
        </div>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

// AR aging table columns
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

// AP aging table columns
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

// Top accounts table columns
const topAccountColumns = [
  { name: "เลขที่", uid: "number", sortable: true },
  { name: "ชื่อบัญชี", uid: "display", sortable: true },
  { name: "หมวด", uid: "category", sortable: true },
  { name: "ยอดเดบิต", uid: "debit", sortable: true },
  { name: "ยอดเครดิต", uid: "credit", sortable: true },
];

export default function FinanceDashboardPage() {
  const {
    loading, financials, bsChartData, isWaterfallData, expenseBreakdown,
    topAccounts, arChartData, arTotals, arConcentration, arAgingPie, arInvoiceMap,
    apChartData, apTotals, apAgingPie, apInvoiceMap,
    arTrendByMonth, apTrendByMonth, arOverdueBands, apOverdueBands,
  } = useFinanceDashboard();

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

  const arAgingRenderCell = useCallback((item, key) => {
    switch (key) {
      case "name":
        return <span className="font-medium">{item.name}</span>;
      case "customerNumber":
        return <span className="font-mono text-default-500">{item.customerNumber}</span>;
      case "current":
        return <span className="text-success">{fmt(item.current)}</span>;
      case "period1":
        return <span className="text-warning">{fmt(item.period1)}</span>;
      case "period2":
        return <span className="text-warning">{fmt(item.period2)}</span>;
      case "period3":
        return <span className="text-danger">{fmt(item.period3)}</span>;
      case "balanceDue":
        return <span className="font-semibold">{fmt(item.balanceDue)}</span>;
      case "actions": {
        const count = (arInvoiceMap[item.customerNumber] || []).length;
        return count > 0 ? (
          <Button variant="bordered" size="sm" onPress={() => openAgingDetail(item, "ar")}>
            <Eye size={14} /> {count} ใบ
          </Button>
        ) : <span className="text-default-400">-</span>;
      }
      default:
        return item[key] || "-";
    }
  }, [arInvoiceMap, openAgingDetail]);

  const apAgingRenderCell = useCallback((item, key) => {
    switch (key) {
      case "name":
        return <span className="font-medium">{item.name}</span>;
      case "vendorNumber":
        return <span className="font-mono text-default-500">{item.vendorNumber}</span>;
      case "current":
        return <span className="text-success">{fmt(Math.abs(item.current))}</span>;
      case "period1":
        return <span className="text-warning">{fmt(Math.abs(item.period1))}</span>;
      case "period2":
        return <span className="text-warning">{fmt(Math.abs(item.period2))}</span>;
      case "period3":
        return <span className="text-danger">{fmt(Math.abs(item.period3))}</span>;
      case "balanceDue":
        return <span className="font-semibold">{fmt(Math.abs(item.balanceDue))}</span>;
      case "actions": {
        const count = (apInvoiceMap[item.vendorNumber] || []).length;
        return count > 0 ? (
          <Button variant="bordered" size="sm" onPress={() => openAgingDetail(item, "ap")}>
            <Eye size={14} /> {count} ใบ
          </Button>
        ) : <span className="text-default-400">-</span>;
      }
      default:
        return item[key] || "-";
    }
  }, [apInvoiceMap, openAgingDetail]);

  const topAccountRenderCell = useCallback((item, key) => {
    switch (key) {
      case "number":
        return <span className="font-mono">{item.number}</span>;
      case "display":
        return <span className="font-medium">{item.display}</span>;
      case "category":
        return <Chip size="sm" variant="flat" color="primary">{item.category}</Chip>;
      case "debit":
        return <span className={item.debit > 0 ? "text-primary" : "text-default-400"}>{fmt(item.debit)}</span>;
      case "credit":
        return <span className={item.credit > 0 ? "text-danger" : "text-default-400"}>{fmt(item.credit)}</span>;
      default:
        return item[key];
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Ratio status helpers
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

  return (
    <div className="flex flex-col w-full gap-4">
      {/* ═══ Section 1: Financial Position KPIs ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <KpiCard
          title="สินทรัพย์รวม"
          value={financials ? fmt(financials.totalAssets) : "-"}
          color="primary"
          subtitle={financials ? `หมุนเวียน ${fmt(financials.currentAssets)}` : ""}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-semibold">สินทรัพย์หมุนเวียน (11xx) + ไม่หมุนเวียน (12xx)</p>
              <p className="text-tiny text-default-500">= {fmt(financials.currentAssets)} + {fmt(financials.noncurrentAssets)}</p>
              <p className="text-tiny text-default-400 mt-1">คำนวณจาก ยอดเดบิต − ยอดเครดิต ของบัญชีหมวด 1</p>
            </div>
          )}
        />
        <KpiCard
          title="หนี้สินรวม"
          value={financials ? fmt(financials.totalLiabilities) : "-"}
          color="danger"
          subtitle={financials ? `หมุนเวียน ${fmt(financials.currentLiabilities)}` : ""}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-semibold">หนี้สินหมุนเวียน (21xx) + ไม่หมุนเวียน (22xx)</p>
              <p className="text-tiny text-default-500">= {fmt(financials.currentLiabilities)} + {fmt(financials.noncurrentLiabilities)}</p>
              <p className="text-tiny text-default-400 mt-1">คำนวณจาก ยอดเครดิต − ยอดเดบิต ของบัญชีหมวด 2</p>
            </div>
          )}
        />
        <KpiCard
          title="ส่วนของเจ้าของ"
          value={financials ? fmt(financials.totalEquity) : "-"}
          color="success"
          subtitle={financials ? `ทุน ${fmt(financials.shareCapital)}` : ""}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-semibold">ทุนจดทะเบียน (31xx) + กำไรสะสม (33xx)</p>
              <p className="text-tiny text-default-500">= {fmt(financials.shareCapital)} + {fmt(financials.retainedEarnings)}</p>
              <p className="text-tiny text-default-400 mt-1">คำนวณจาก ยอดเครดิต − ยอดเดบิต ของบัญชีหมวด 3</p>
            </div>
          )}
        />
        <KpiCard
          title="เงินทุนหมุนเวียน"
          value={financials ? fmt(financials.workingCapital) : "-"}
          color={financials && financials.workingCapital >= 0 ? "success" : "danger"}
          subtitle="Working Capital"
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-semibold">สินทรัพย์หมุนเวียน − หนี้สินหมุนเวียน</p>
              <p className="text-tiny text-default-500">= {fmt(financials.currentAssets)} − {fmt(financials.currentLiabilities)}</p>
              <p className="text-tiny text-default-400 mt-1">ยิ่งมากยิ่งดี แสดงถึงสภาพคล่องของกิจการ</p>
            </div>
          )}
        />
      </div>

      {/* ═══ Section 2: Income Statement KPIs ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <KpiCard
          title="รายได้รวม"
          value={financials ? fmt(financials.totalRevenue) : "-"}
          color="success"
          subtitle={financials ? `ขาย ${fmt(financials.salesRevenue)}` : ""}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-semibold">รายได้ขาย (41xx) + บริการ (42xx) + อื่น (43xx)</p>
              <p className="text-tiny text-default-500">= {fmt(financials.salesRevenue)} + {fmt(financials.serviceRevenue)} + {fmt(financials.otherIncome)}</p>
              <p className="text-tiny text-default-400 mt-1">คำนวณจาก ยอดเครดิต − ยอดเดบิต ของบัญชีหมวด 4</p>
            </div>
          )}
        />
        <KpiCard
          title="ต้นทุนขาย"
          value={financials ? fmt(financials.cogs) : "-"}
          color="warning"
          subtitle={financials ? `${financials.grossMargin.toFixed(1)}% Gross Margin` : ""}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-semibold">ต้นทุนสินค้าที่ขาย (51xx)</p>
              <p className="text-tiny text-default-500">= ยอดเดบิต − ยอดเครดิต ของบัญชีหมวด 51</p>
            </div>
          )}
        />
        <KpiCard
          title="กำไรขั้นต้น"
          value={financials ? fmt(financials.grossProfit) : "-"}
          color={financials && financials.grossProfit >= 0 ? "success" : "danger"}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-semibold">รายได้รวม − ต้นทุนขาย</p>
              <p className="text-tiny text-default-500">= {fmt(financials.totalRevenue)} − {fmt(financials.cogs)}</p>
            </div>
          )}
        />
        <KpiCard
          title="กำไรสุทธิ"
          value={financials ? fmt(financials.netIncome) : "-"}
          color={financials && financials.netIncome >= 0 ? "success" : "danger"}
          subtitle={financials ? `${financials.netMargin.toFixed(1)}% Net Margin` : ""}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-semibold">กำไรขั้นต้น − ค่าใช้จ่ายขาย (52xx) − ค่าใช้จ่ายบริหาร (53xx)</p>
              <p className="text-tiny text-default-500">= {fmt(financials.grossProfit)} − {fmt(financials.sellingExpense)} − {fmt(financials.adminExpense)}</p>
            </div>
          )}
        />
      </div>

      {/* ═══ Section 3: Financial Ratios ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RatioCard
          title="อัตราส่วนเงินทุนหมุนเวียน"
          value={financials ? financials.currentRatio.toFixed(2) : "-"}
          subtitle="Current Ratio (>2 ดี)"
          status={currentRatioStatus}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-semibold">สินทรัพย์หมุนเวียน ÷ หนี้สินหมุนเวียน</p>
              <p className="text-tiny text-default-500">= {fmt(financials.currentAssets)} ÷ {fmt(financials.currentLiabilities)}</p>
              <p className="text-tiny text-default-400 mt-1">วัดความสามารถในการชำระหนี้ระยะสั้น ≥ 2 = ดี, 1-2 = พอใช้, &lt; 1 = เสี่ยง</p>
            </div>
          )}
        />
        <RatioCard
          title="อัตราส่วนหนี้สินต่อทุน"
          value={financials ? financials.debtToEquity.toFixed(2) : "-"}
          subtitle="D/E Ratio (<1 ดี)"
          status={deStatus}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-semibold">หนี้สินรวม ÷ ส่วนของเจ้าของ</p>
              <p className="text-tiny text-default-500">= {fmt(financials.totalLiabilities)} ÷ {fmt(financials.totalEquity)}</p>
              <p className="text-tiny text-default-400 mt-1">วัดสัดส่วนแหล่งเงินทุน ≤ 1 = ดี, 1-2 = พอใช้, &gt; 2 = เสี่ยง</p>
            </div>
          )}
        />
        <RatioCard
          title="อัตรากำไรขั้นต้น"
          value={financials ? `${financials.grossMargin.toFixed(1)}%` : "-"}
          subtitle="Gross Margin (>30% ดี)"
          status={grossMarginStatus}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-semibold">(กำไรขั้นต้น ÷ รายได้รวม) × 100</p>
              <p className="text-tiny text-default-500">= ({fmt(financials.grossProfit)} ÷ {fmt(financials.totalRevenue)}) × 100</p>
              <p className="text-tiny text-default-400 mt-1">วัดประสิทธิภาพการจัดการต้นทุน ≥ 30% = ดี, 15-30% = พอใช้</p>
            </div>
          )}
        />
        <RatioCard
          title="อัตรากำไรสุทธิ"
          value={financials ? `${financials.netMargin.toFixed(1)}%` : "-"}
          subtitle="Net Margin (>10% ดี)"
          status={netMarginStatus}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-semibold">(กำไรสุทธิ ÷ รายได้รวม) × 100</p>
              <p className="text-tiny text-default-500">= ({fmt(financials.netIncome)} ÷ {fmt(financials.totalRevenue)}) × 100</p>
              <p className="text-tiny text-default-400 mt-1">วัดความสามารถในการทำกำไรโดยรวม ≥ 10% = ดี, 5-10% = พอใช้</p>
            </div>
          )}
        />
      </div>

      {/* ═══ Section 4: Balance Sheet & Expense Charts ═══ */}
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
            <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูล</p>
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
            <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูล</p>
          )}
        </ChartCard>
      </div>

      {/* ═══ Section 5: Income Statement Waterfall ═══ */}
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
                    <div className="rounded-lg border border-default-200 bg-background p-3 shadow-lg">
                      <p className="mb-1 text-xs font-semibold">{d?.name}</p>
                      <p className={`text-xs ${d?.value >= 0 ? "text-success" : "text-danger"}`}>
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
          <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูล</p>
        )}
      </ChartCard>

      {/* ═══ Section 6: Top 15 Accounts ═══ */}
      <ChartCard title="บัญชีหลัก 15 อันดับ (ตามยอดคงเหลือ)" chip={financials ? { label: `Posting ${financials.postingAccounts} บัญชี`, color: "primary" } : undefined}>
        {topAccounts.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topAccounts}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="number" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
                <YAxis tickFormatter={fmtShort} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-default-200 bg-background p-3 shadow-lg">
                        <p className="mb-1 text-xs font-semibold">{d?.number} {d?.display}</p>
                        <p className="text-xs text-default-400">{d?.category}</p>
                        <p className="text-xs text-primary">ยอดเดบิต: {fmt(d?.debit)}</p>
                        <p className="text-xs text-danger">ยอดเครดิต: {fmt(d?.credit)}</p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="debit" name="ยอดเดบิต" fill="#006FEE" radius={[4, 4, 0, 0]} />
                <Bar dataKey="credit" name="ยอดเครดิต" fill="#F31260" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <DataTable
              columns={topAccountColumns}
              data={topAccounts}
              renderCell={topAccountRenderCell}
              rowKey="number"
              searchKeys={["number", "display", "category"]}
              searchPlaceholder="ค้นหาบัญชี..."
              defaultRowsPerPage={15}
              defaultSortDescriptor={{ column: "debit", direction: "descending" }}
              emptyContent="ไม่มีข้อมูล"
            />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูล</p>
        )}
      </ChartCard>

      {/* ═══ Section 7: AR/AP KPIs ═══ */}
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

      {/* ═══ Section 8: Aging Pie Charts ═══ */}
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
            <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูล</p>
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
            <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูล</p>
          )}
        </ChartCard>
      </div>

      {/* ═══ Section 8.5: AR/AP Trend — Monthly Outstanding ═══ */}
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
                      <div className="rounded-lg border border-default-200 bg-background p-3 shadow-lg">
                        <p className="mb-1 text-xs font-semibold">{fmtMonth(label)}</p>
                        <p className="text-xs">{d?.count} ใบ</p>
                        <p className="text-xs text-primary">ยอดเต็ม: {fmt(d?.total)}</p>
                        <p className="text-xs text-warning">ค้างชำระ: {fmt(d?.remaining)}</p>
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
            <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูล</p>
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
                      <div className="rounded-lg border border-default-200 bg-background p-3 shadow-lg">
                        <p className="mb-1 text-xs font-semibold">{fmtMonth(label)}</p>
                        <p className="text-xs">{d?.count} ใบ</p>
                        <p className="text-xs text-danger">ยอดรวม: {fmt(d?.total)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="total" name="ยอดรวม" fill="#F31260" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูล</p>
          )}
        </ChartCard>
      </div>

      {/* ═══ Section 8.6: Overdue Aging Band Distribution ═══ */}
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
                      <div className="rounded-lg border border-default-200 bg-background p-3 shadow-lg">
                        <p className="mb-1 text-xs font-semibold">{d?.name}</p>
                        <p className="text-xs">{d?.count} ใบ</p>
                        <p className="text-xs text-warning">ค้างชำระ: {fmt(d?.remaining)}</p>
                        <p className="text-xs text-default-400">ยอดเต็ม: {fmt(d?.total)}</p>
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
            <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูล</p>
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
                      <div className="rounded-lg border border-default-200 bg-background p-3 shadow-lg">
                        <p className="mb-1 text-xs font-semibold">{d?.name}</p>
                        <p className="text-xs">{d?.count} ใบ</p>
                        <p className="text-xs text-danger">ยอดรวม: {fmt(d?.total)}</p>
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
            <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูล</p>
          )}
        </ChartCard>
      </div>

      {/* ═══ Section 9: Aged Receivables with Expandable Invoices ═══ */}
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
            />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูล</p>
        )}
      </ChartCard>

      {/* ═══ Section 10: Aged Payables with Expandable Invoices ═══ */}
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
            />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูล</p>
        )}
      </ChartCard>

      {/* ═══ Invoice Detail Modal ═══ */}
      <Modal isOpen={isAgingOpen} onClose={onAgingClose} size="4xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>ใบแจ้งหนี้ — {selectedAging?.item.name}</span>
            <span className="text-sm font-normal text-default-500">
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
                    <TableCell className="font-mono font-medium">{inv.number}</TableCell>
                    <TableCell>{fmtDate(inv.invoiceDate)}</TableCell>
                    <TableCell>
                      <span className={inv.daysOverdue > 0 ? "text-danger" : ""}>{fmtDate(inv.dueDate)}</span>
                    </TableCell>
                    <TableCell>{fmt(Math.abs(inv.totalAmountIncludingTax))}</TableCell>
                    <TableCell className="font-medium text-warning">{fmt(inv.remainingAmount || 0)}</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${daysOverdueColor(inv.daysOverdue)}`}>
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
