"use client";

import { useCallback } from "react";
import {
  Card, CardBody, CardHeader, Spinner, Chip, Tooltip,
  Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Select, SelectItem,
} from "@heroui/react";
import { Eye, Info, BotMessageSquare, RefreshCw } from "lucide-react";
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

// ─── Sub-components ───

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

function RatioCard({ title, value, subtitle, status, tooltip, previousValue }) {
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
        {previousValue != null && (
          <p className="text-xs text-default-400">ปีก่อน: {previousValue}</p>
        )}
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

const topAccountColumns = [
  { name: "เลขที่", uid: "number", sortable: true },
  { name: "ชื่อบัญชี", uid: "display", sortable: true },
  { name: "หมวด", uid: "category", sortable: true },
  { name: "ยอดเดบิต", uid: "debit", sortable: true },
  { name: "ยอดเครดิต", uid: "credit", sortable: true },
];

// ─── Main View Component ───

export default function FinanceDashboardView({
  loading,
  financials,
  bsChartData,
  isWaterfallData,
  expenseBreakdown,
  topAccounts,
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
  // GL Monthly Data props
  glLoading,
  glError,
  monthlyPnL,
  cogsDetail,
  sellingDetail,
  adminDetail,
  revenueDetail,
  monthlyChartData,
  cogsChartData,
  compYears,
  // CEO trend charts
  revenueTrend,
  profitTrend,
  trendYearKeys,
}) {

  // ─── renderCell callbacks ───

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

  // ─── Loading state ───

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size="lg" />
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
          size="sm"
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
        <span className="text-sm text-default-500">
          แสดงข้อมูล 3 ปี: พ.ศ. {(selectedYear - 2) + 543}–{selectedYear + 543}
        </span>
        {glLoading && <Spinner size="sm" />}
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
                  <p className="text-tiny font-bold">ที่มา: Trial Balance (งบทดลอง)</p>
                  <p className="text-tiny font-semibold mt-1">สินทรัพย์หมุนเวียน (11xx) + ไม่หมุนเวียน (12xx)</p>
                  <p className="text-tiny text-default-500">= {fmt(financials.currentAssets)} + {fmt(financials.noncurrentAssets)}</p>
                  <p className="text-tiny text-default-400 mt-1">ยอดเดบิต − ยอดเครดิต ของบัญชีหมวด 1</p>
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
                  <p className="text-tiny font-bold">ที่มา: Trial Balance (งบทดลอง)</p>
                  <p className="text-tiny font-semibold mt-1">หนี้สินหมุนเวียน (21xx) + ไม่หมุนเวียน (22xx)</p>
                  <p className="text-tiny text-default-500">= {fmt(financials.currentLiabilities)} + {fmt(financials.noncurrentLiabilities)}</p>
                  <p className="text-tiny text-default-400 mt-1">ยอดเครดิต − ยอดเดบิต ของบัญชีหมวด 2</p>
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
                  <p className="text-tiny font-bold">ที่มา: Trial Balance (งบทดลอง)</p>
                  <p className="text-tiny font-semibold mt-1">ทุนจดทะเบียน (31xx) + กำไรสะสม (33xx)</p>
                  <p className="text-tiny text-default-500">= {fmt(financials.shareCapital)} + {fmt(financials.retainedEarnings)}</p>
                  <p className="text-tiny text-default-400 mt-1">ยอดเครดิต − ยอดเดบิต ของบัญชีหมวด 3</p>
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
                  <p className="text-tiny font-bold">ที่มา: Trial Balance (งบทดลอง)</p>
                  <p className="text-tiny font-semibold mt-1">สินทรัพย์หมุนเวียน − หนี้สินหมุนเวียน</p>
                  <p className="text-tiny text-default-500">= {fmt(financials.currentAssets)} − {fmt(financials.currentLiabilities)}</p>
                  <p className="text-tiny text-default-400 mt-1">ยิ่งมากยิ่งดี แสดงถึงสภาพคล่องของกิจการ</p>
                </div>
              )}
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
                  <p className="text-tiny font-bold">ที่มา: GL Entries (กรองตามปีที่เลือก)</p>
                  <p className="text-tiny font-semibold mt-1">รายได้ขาย (41xx) + บริการ (42xx) + อื่น (43xx)</p>
                  <p className="text-tiny text-default-500">= {fmt(financials.salesRevenue)} + {fmt(financials.serviceRevenue)} + {fmt(financials.otherIncome)}</p>
                  <p className="text-tiny text-default-400 mt-1">ยอดเครดิต − ยอดเดบิต ของบัญชีหมวด 4</p>
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
                  <p className="text-tiny font-bold">ที่มา: GL Entries + TB Inventory Adjustment</p>
                  <p className="text-tiny font-semibold mt-1">สูตร: ต้นทุนผลิต (GL) − หัก สินค้าคงเหลือ (TB)</p>
                  <table className="text-tiny text-default-500 mt-1 w-full">
                    <tbody>
                      <tr><td>ต้นทุนจาก GL (51xx + โรงงาน)</td><td className="text-right font-mono">{fmt(financials.rawGlCogs)}</td></tr>
                      {financials.inventoryAdj > 0 && (
                        <tr className="text-danger"><td>หัก: สินค้าคงเหลือ (TB 115xx)</td><td className="text-right font-mono">({fmt(financials.inventoryAdj)})</td></tr>
                      )}
                      <tr className="font-semibold border-t border-default-200"><td>ต้นทุนขายสุทธิ</td><td className="text-right font-mono">{fmt(financials.cogs)}</td></tr>
                    </tbody>
                  </table>
                  <p className="text-tiny text-default-400 mt-1">GL: 51xxx + ค่าเช่าโรงงาน (52000-09), ซ่อมบำรุง (53200-xx), ค่าเสื่อมราคาเครื่องจักร (53400-xx)</p>
                  {financials.inventoryAdj > 0 && (
                    <p className="text-tiny text-warning mt-1">* ปีที่ยังไม่ปิดบัญชี: GL ไม่มี 51200-00/115xx จึงใช้ TB 115xx หักแทน</p>
                  )}
                </div>
              )}
            />
            <KpiCard
              title="กำไรขั้นต้น"
              value={financials ? fmt(financials.grossProfit) : "-"}
              color={financials && financials.grossProfit >= 0 ? "success" : "danger"}
              tooltip={financials && (
                <div className="px-1 py-1 max-w-xs">
                  <p className="text-tiny font-bold">ที่มา: GL Entries (รายได้) − GL+TB (ต้นทุน)</p>
                  <p className="text-tiny font-semibold mt-1">รายได้รวม − ต้นทุนขาย</p>
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
                  <p className="text-tiny font-bold">ที่มา: GL Entries (กรองตามปีที่เลือก)</p>
                  <p className="text-tiny font-semibold mt-1">กำไรขั้นต้น − ค่าใช้จ่าย − ดอกเบี้ยจ่าย</p>
                  <table className="text-tiny text-default-500 mt-1 w-full">
                    <tbody>
                      <tr><td>กำไรขั้นต้น</td><td className="text-right font-mono">{fmt(financials.grossProfit)}</td></tr>
                      <tr><td>ค่าใช้จ่ายขาย (52xx)</td><td className="text-right font-mono">({fmt(financials.sellingExpense)})</td></tr>
                      <tr><td>ค่าใช้จ่ายบริหาร (53xx)</td><td className="text-right font-mono">({fmt(financials.adminExpense)})</td></tr>
                      <tr><td>ดอกเบี้ยจ่าย (53710-xx)</td><td className="text-right font-mono">({fmt(financials.interestExpense)})</td></tr>
                      <tr className="font-semibold border-t border-default-200"><td>กำไรสุทธิก่อนภาษี</td><td className="text-right font-mono">{fmt(financials.netIncome)}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
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
              <p className="text-tiny font-bold">ที่มา: TB (งบดุล)</p>
              <p className="text-tiny font-semibold mt-1">สินทรัพย์หมุนเวียน ÷ หนี้สินหมุนเวียน</p>
              <p className="text-tiny text-default-500">= {fmt(financials.currentAssets)} ÷ {fmt(financials.currentLiabilities)}</p>
              <p className="text-tiny text-default-400 mt-1">≥ 2 = ดี, 1-2 = พอใช้, &lt; 1 = เสี่ยง</p>
            </div>
          )}
        />
        <RatioCard
          title="อัตราส่วนหนี้สินต่อทุน"
          value={financials ? financials.debtToEquity.toFixed(2) : "-"}
          subtitle="D/E Ratio (<1 ดี)"
          status={deStatus}
          previousValue={null}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-bold">ที่มา: TB (งบดุล)</p>
              <p className="text-tiny font-semibold mt-1">หนี้สินรวม ÷ ส่วนของเจ้าของ</p>
              <p className="text-tiny text-default-500">= {fmt(financials.totalLiabilities)} ÷ {fmt(financials.totalEquity)}</p>
              <p className="text-tiny text-default-400 mt-1">≤ 1 = ดี, 1-2 = พอใช้, &gt; 2 = เสี่ยง</p>
            </div>
          )}
        />
        <RatioCard
          title="อัตรากำไรขั้นต้น"
          value={financials ? `${financials.grossMargin.toFixed(1)}%` : "-"}
          subtitle="Gross Margin (>30% ดี)"
          status={grossMarginStatus}
          previousValue={null}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-bold">ที่มา: GL (รายได้, ต้นทุน)</p>
              <p className="text-tiny font-semibold mt-1">(กำไรขั้นต้น ÷ รายได้รวม) × 100</p>
              <p className="text-tiny text-default-500">= ({fmt(financials.grossProfit)} ÷ {fmt(financials.totalRevenue)}) × 100</p>
              <p className="text-tiny text-default-400 mt-1">≥ 30% = ดี, 15-30% = พอใช้</p>
            </div>
          )}
        />
        <RatioCard
          title="อัตรากำไรสุทธิ"
          value={financials ? `${financials.netMargin.toFixed(1)}%` : "-"}
          subtitle="Net Margin (>10% ดี)"
          status={netMarginStatus}
          previousValue={null}
          tooltip={financials && (
            <div className="px-1 py-1 max-w-xs">
              <p className="text-tiny font-bold">ที่มา: GL (กำไรสุทธิ, รายได้)</p>
              <p className="text-tiny font-semibold mt-1">(กำไรสุทธิ ÷ รายได้รวม) × 100</p>
              <p className="text-tiny text-default-500">= ({fmt(financials.netIncome)} ÷ {fmt(financials.totalRevenue)}) × 100</p>
              <p className="text-tiny text-default-400 mt-1">≥ 10% = ดี, 5-10% = พอใช้</p>
            </div>
          )}
        />
      </div>

      {/* Section 3.5: AI Analysis */}
      <Card shadow="none" className="border border-default-200">
        <CardHeader className="pb-0 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BotMessageSquare size={18} className="text-primary" />
            <p className="text-sm font-semibold">AI วิเคราะห์สถานะการเงิน</p>
            <Chip size="sm" variant="flat" color="secondary">CFO Advisor</Chip>
          </div>
          <Button
            variant={aiAnalysis ? "bordered" : "solid"}
            color="primary"
            size="sm"
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
              <Spinner size="sm" />
              <span className="text-sm text-default-500">AI กำลังวิเคราะห์ข้อมูลการเงิน...</span>
            </div>
          )}
          {!aiAnalysis && !aiLoading && (
            <p className="text-sm text-default-400 py-4 text-center">
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
                      <table className="border-collapse w-full text-xs">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-default-100">{children}</thead>,
                  th: ({ children }) => (
                    <th className="border border-default-200 px-3 py-1.5 text-left font-semibold text-foreground">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-default-200 px-3 py-1.5 text-foreground">{children}</td>
                  ),
                  tr: ({ children }) => <tr className="even:bg-default-50">{children}</tr>,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
                  li: ({ children }) => <li className="text-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="bg-default-100 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
                    ) : (
                      <pre className="bg-default-100 rounded-lg p-3 overflow-x-auto my-2">
                        <code className="text-xs font-mono">{children}</code>
                      </pre>
                    ),
                }}
              >
                {aiAnalysis}
              </ReactMarkdown>
              {aiLoading && <Spinner size="sm" className="mt-2" />}
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

      {/* Section 6: Top 15 Accounts */}
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

      {/* ═══ Section: งบกำไรขาดทุนรายเดือน (GL Data) ═══ */}
      <div className="flex items-center gap-3 mt-2">
        <div className="h-px flex-1 bg-default-200" />
        <span className="text-sm font-semibold text-default-500 whitespace-nowrap">
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
          />
          <ExpenseDetailTable
            sellingDetail={sellingDetail}
            adminDetail={adminDetail}
            loading={glLoading}
            year={selectedYear}
            compYears={compYears}
          />
        </>
      )}

      {/* ═══ Section: ลูกหนี้/เจ้าหนี้ ═══ */}
      <div className="flex items-center gap-3 mt-2">
        <div className="h-px flex-1 bg-default-200" />
        <span className="text-sm font-semibold text-default-500 whitespace-nowrap">ลูกหนี้ / เจ้าหนี้</span>
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
            />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูล</p>
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
            />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูล</p>
        )}
      </ChartCard>

      {/* Invoice Detail Modal */}
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
