"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card, CardBody, CardHeader, Spinner, Chip, Button,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Tabs, Tab, Input, Textarea, Select, SelectItem,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  useDisclosure,
} from "@heroui/react";
import {
  Phone, Mail, MapPin, MessageCircle, FileText, Plus, History,
  Download, Clock, Eye, RefreshCw,
} from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { getAgedReceivables, getCollections, createFollowUp } from "@/actions/finance";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from "recharts";

/* ═══════════════════ Constants ═══════════════════ */

const CONTACT_METHODS = [
  { value: "phone", label: "โทรศัพท์", icon: Phone },
  { value: "email", label: "อีเมล", icon: Mail },
  { value: "visit", label: "เข้าพบ", icon: MapPin },
  { value: "line", label: "LINE", icon: MessageCircle },
  { value: "letter", label: "จดหมาย/เอกสาร", icon: FileText },
  { value: "other", label: "อื่นๆ", icon: FileText },
];

const REASONS = [
  { value: "cash_flow", label: "ปัญหาสภาพคล่อง", color: "warning" },
  { value: "dispute", label: "ข้อพิพาท/ไม่พอใจสินค้า-บริการ", color: "danger" },
  { value: "waiting_approval", label: "รออนุมัติภายใน", color: "primary" },
  { value: "no_contact", label: "ติดต่อไม่ได้", color: "danger" },
  { value: "partial_payment", label: "จะชำระบางส่วน", color: "secondary" },
  { value: "forgotten", label: "ลืม/ไม่ทราบยอด", color: "default" },
  { value: "bankruptcy", label: "ปิดกิจการ/ล้มละลาย", color: "danger" },
  { value: "other", label: "อื่นๆ", color: "default" },
];

const STATUSES = [
  { value: "pending", label: "รอติดตาม", color: "warning" },
  { value: "promised", label: "สัญญาจะชำระ", color: "primary" },
  { value: "partial", label: "ชำระบางส่วน", color: "secondary" },
  { value: "escalated", label: "ยกระดับ", color: "danger" },
  { value: "resolved", label: "ชำระแล้ว", color: "success" },
  { value: "written_off", label: "ตัดหนี้สูญ", color: "danger" },
];

const PIE_COLORS = ["#F5A524", "#006FEE", "#9353D3", "#F31260", "#17C964", "#71717A", "#F97316", "#0EA5E9"];

/* ═══════════════════ Helpers ═══════════════════ */

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}
function fmtDate(d) {
  if (!d || d === "0001-01-01") return "-";
  return new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" });
}
function reasonLabel(v) { return REASONS.find((r) => r.value === v)?.label || v || "-"; }
function reasonColor(v) { return REASONS.find((r) => r.value === v)?.color || "default"; }
function statusLabel(v) { return STATUSES.find((s) => s.value === v)?.label || v || "-"; }
function statusColor(v) { return STATUSES.find((s) => s.value === v)?.color || "default"; }
function contactLabel(v) { return CONTACT_METHODS.find((m) => m.value === v)?.label || v || "-"; }
function parseNum(val) {
  if (val === "" || val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  return Number(String(val).replace(/,/g, "")) || 0;
}

function exportCSV(data, filename) {
  const headers = ["วันที่ติดต่อ", "ลูกค้า", "เลขที่ลูกค้า", "วิธีติดต่อ", "เหตุผล", "รายละเอียด", "หมายเหตุ", "สถานะ", "วันที่สัญญาจะชำระ", "จำนวนสัญญา", "ติดตามครั้งถัดไป", "ผู้บันทึก"];
  const rows = data.map((fu) => [
    fu.contactDate,
    fu.customerName,
    fu.customerNumber,
    contactLabel(fu.contactMethod),
    reasonLabel(fu.reason),
    fu.reasonDetail || "",
    fu.note || "",
    statusLabel(fu.status),
    fu.promiseDate || "",
    fu.promiseAmount || "",
    fu.nextFollowUpDate || "",
    fu.createdByName || "",
  ]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════ Sub-components ═══════════════════ */

function KpiCard({ title, value, subtitle, color = "default" }) {
  const colors = {
    primary: "text-primary", success: "text-success", warning: "text-warning",
    danger: "text-danger", secondary: "text-secondary", default: "text-foreground",
  };
  return (
    <Card shadow="none" className="border border-default-200">
      <CardBody className="p-3">
        <p className="text-xs text-default-500">{title}</p>
        <p className={`text-lg font-bold ${colors[color]}`}>{value}</p>
        {subtitle && <p className="text-xs text-default-400">{subtitle}</p>}
      </CardBody>
    </Card>
  );
}

/* ═══════════════════ Main Page ═══════════════════ */

const INITIAL_FORM = {
  contactDate: new Date().toISOString().slice(0, 10),
  contactMethod: "phone",
  reason: "",
  reasonDetail: "",
  note: "",
  promiseDate: "",
  promiseAmount: "",
  status: "pending",
  nextFollowUpDate: "",
};

export default function CollectionsPage() {
  // ─── State ───
  const [arData, setArData] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const addModal = useDisclosure();
  const historyModal = useDisclosure();

  // Report filters
  const [reportSince, setReportSince] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [reportUntil, setReportUntil] = useState(() => new Date().toISOString().slice(0, 10));

  // ─── Load data ───
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ar, fu] = await Promise.all([getAgedReceivables(), getCollections()]);
      setArData(ar || []);
      setFollowUps(fu || []);
    } catch (err) {
      console.error("Error loading collections data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Merge AR + follow-ups ───
  const mergedData = useMemo(() => {
    const fuByCustomer = {};
    for (const fu of followUps) {
      if (!fuByCustomer[fu.customerNumber]) fuByCustomer[fu.customerNumber] = [];
      fuByCustomer[fu.customerNumber].push(fu);
    }

    return arData
      .filter((c) => c.customerNumber && parseNum(c.balanceDue) > 0)
      .map((c) => {
        const fus = fuByCustomer[c.customerNumber] || [];
        const latest = fus[0];
        return {
          customerNumber: c.customerNumber,
          name: c.name || c.customerNumber,
          balanceDue: parseNum(c.balanceDue),
          current: parseNum(c.currentAmount),
          period1: parseNum(c.period1Amount),
          period2: parseNum(c.period2Amount),
          period3: parseNum(c.period3Amount),
          followUpCount: fus.length,
          lastContactDate: latest?.contactDate,
          lastReason: latest?.reason,
          lastStatus: latest?.status,
          lastNote: latest?.note,
          nextFollowUpDate: latest?.nextFollowUpDate,
          promiseDate: latest?.promiseDate,
          promiseAmount: latest?.promiseAmount,
        };
      })
      .sort((a, b) => b.balanceDue - a.balanceDue);
  }, [arData, followUps]);

  // ─── KPIs ───
  const kpis = useMemo(() => {
    const totalOverdue = mergedData.reduce((s, c) => s + c.balanceDue, 0);
    const contacted = mergedData.filter((c) => c.followUpCount > 0).length;
    const uncontacted = mergedData.filter((c) => c.followUpCount === 0).length;
    const today = new Date().toISOString().slice(0, 10);
    const dueToday = mergedData.filter((c) => c.nextFollowUpDate && c.nextFollowUpDate <= today).length;
    const promisedTotal = followUps
      .filter((f) => f.status === "promised" && f.promiseAmount)
      .reduce((s, f) => s + Number(f.promiseAmount), 0);
    return { totalOverdue, contacted, uncontacted, total: mergedData.length, dueToday, promisedTotal };
  }, [mergedData, followUps]);

  // ─── Report data ───
  const reportData = useMemo(() => {
    const filtered = followUps.filter((f) => {
      if (reportSince && f.contactDate < reportSince) return false;
      if (reportUntil && f.contactDate > reportUntil) return false;
      return true;
    });

    const byReason = {};
    for (const f of filtered) {
      const key = f.reason || "other";
      if (!byReason[key]) byReason[key] = { name: reasonLabel(key), value: 0, key };
      byReason[key].value++;
    }

    const byStatus = {};
    for (const f of filtered) {
      const key = f.status || "pending";
      if (!byStatus[key]) byStatus[key] = { name: statusLabel(key), value: 0, key };
      byStatus[key].value++;
    }

    const uniqueCustomers = new Set(filtered.map((f) => f.customerNumber)).size;
    const totalPromised = filtered
      .filter((f) => f.promiseAmount)
      .reduce((s, f) => s + Number(f.promiseAmount), 0);

    return {
      filtered,
      reasonChart: Object.values(byReason).sort((a, b) => b.value - a.value),
      statusChart: Object.values(byStatus),
      total: filtered.length,
      uniqueCustomers,
      totalPromised,
    };
  }, [followUps, reportSince, reportUntil]);

  // ─── Customer follow-up history ───
  const customerHistory = useMemo(() => {
    if (!selectedCustomer) return [];
    return followUps.filter((f) => f.customerNumber === selectedCustomer.customerNumber);
  }, [followUps, selectedCustomer]);

  // ─── Handlers ───
  const openAdd = useCallback((customer) => {
    setSelectedCustomer(customer);
    setForm({ ...INITIAL_FORM, contactDate: new Date().toISOString().slice(0, 10) });
    addModal.onOpen();
  }, [addModal]);

  const openHistory = useCallback((customer) => {
    setSelectedCustomer(customer);
    historyModal.onOpen();
  }, [historyModal]);

  const handleSubmit = useCallback(async () => {
    if (!form.reason || !selectedCustomer) return;
    setSubmitting(true);
    try {
      const result = await createFollowUp({
        customerNumber: selectedCustomer.customerNumber,
        customerName: selectedCustomer.name,
        ...form,
        promiseAmount: form.promiseAmount ? Number(form.promiseAmount) : null,
      });
      setFollowUps((prev) => [result, ...prev]);
      addModal.onClose();
    } catch (err) {
      console.error("Error creating follow-up:", err);
    } finally {
      setSubmitting(false);
    }
  }, [form, selectedCustomer, addModal]);

  const setField = useCallback((key, val) => setForm((prev) => ({ ...prev, [key]: val })), []);

  // ─── DataTable: Tracking columns ───
  const trackingColumns = useMemo(() => [
    { name: "ลูกค้า", uid: "name", sortable: true },
    { name: "เลขที่", uid: "customerNumber", sortable: true },
    { name: "ยอดค้างชำระ", uid: "balanceDue", sortable: true },
    { name: "ปัจจุบัน", uid: "current", sortable: true },
    { name: "ค้าง 1 งวด", uid: "period1", sortable: true },
    { name: "ค้าง 2 งวด", uid: "period2", sortable: true },
    { name: "ค้าง 3+ งวด", uid: "period3", sortable: true },
    { name: "สถานะ", uid: "lastStatus", sortable: true },
    { name: "เหตุผล", uid: "lastReason", sortable: true },
    { name: "ติดตามล่าสุด", uid: "lastContactDate", sortable: true },
    { name: "ติดตามถัดไป", uid: "nextFollowUpDate", sortable: true },
    { name: "ครั้งที่", uid: "followUpCount", sortable: true },
    { name: "", uid: "actions" },
  ], []);

  const trackingRenderCell = useCallback((item, key) => {
    switch (key) {
      case "name":
        return <span className="font-medium text-sm">{item.name}</span>;
      case "customerNumber":
        return <span className="font-mono text-xs text-default-500">{item.customerNumber}</span>;
      case "balanceDue":
        return <span className="font-semibold text-danger">{fmt(item.balanceDue)}</span>;
      case "current":
        return <span className="text-success text-sm">{fmt(item.current)}</span>;
      case "period1":
        return <span className="text-warning text-sm">{fmt(item.period1)}</span>;
      case "period2":
        return <span className="text-orange-500 text-sm">{fmt(item.period2)}</span>;
      case "period3":
        return <span className="text-danger text-sm">{fmt(item.period3)}</span>;
      case "lastStatus":
        return item.lastStatus
          ? <Chip size="sm" variant="flat" color={statusColor(item.lastStatus)}>{statusLabel(item.lastStatus)}</Chip>
          : <Chip size="sm" variant="flat" color="default">ยังไม่ติดตาม</Chip>;
      case "lastReason":
        return item.lastReason
          ? <Chip size="sm" variant="dot" color={reasonColor(item.lastReason)}>{reasonLabel(item.lastReason)}</Chip>
          : <span className="text-xs text-default-400">-</span>;
      case "lastContactDate":
        return <span className="text-xs">{item.lastContactDate ? fmtDate(item.lastContactDate) : "-"}</span>;
      case "nextFollowUpDate": {
        if (!item.nextFollowUpDate) return <span className="text-xs text-default-400">-</span>;
        const overdue = item.nextFollowUpDate <= new Date().toISOString().slice(0, 10);
        return (
          <span className={`text-xs font-medium ${overdue ? "text-danger" : "text-primary"}`}>
            {fmtDate(item.nextFollowUpDate)}
            {overdue && " ⚠️"}
          </span>
        );
      }
      case "followUpCount":
        return <span className="text-xs">{item.followUpCount || 0}</span>;
      case "actions":
        return (
          <div className="flex gap-1">
            <Button isIconOnly size="sm" variant="flat" color="primary" onPress={() => openAdd(item)} title="เพิ่มการติดตาม">
              <Plus size={14} />
            </Button>
            <Button isIconOnly size="sm" variant="flat" color="default" onPress={() => openHistory(item)} title="ดูประวัติ" isDisabled={!item.followUpCount}>
              <History size={14} />
            </Button>
          </div>
        );
      default:
        return item[key] ?? "-";
    }
  }, [openAdd, openHistory]);

  // ─── DataTable: Report columns ───
  const reportColumns = useMemo(() => [
    { name: "วันที่", uid: "contactDate", sortable: true },
    { name: "ลูกค้า", uid: "customerName", sortable: true },
    { name: "วิธีติดต่อ", uid: "contactMethod", sortable: true },
    { name: "เหตุผล", uid: "reason", sortable: true },
    { name: "รายละเอียด", uid: "reasonDetail" },
    { name: "หมายเหตุ", uid: "note" },
    { name: "สถานะ", uid: "status", sortable: true },
    { name: "สัญญาจะชำระ", uid: "promiseDate", sortable: true },
    { name: "จำนวน", uid: "promiseAmount", sortable: true },
    { name: "ผู้บันทึก", uid: "createdByName" },
  ], []);

  const reportRenderCell = useCallback((item, key) => {
    switch (key) {
      case "contactDate":
        return <span className="text-xs">{fmtDate(item.contactDate)}</span>;
      case "customerName":
        return (
          <div>
            <p className="text-sm font-medium">{item.customerName}</p>
            <p className="text-xs text-default-400">{item.customerNumber}</p>
          </div>
        );
      case "contactMethod":
        return <span className="text-xs">{contactLabel(item.contactMethod)}</span>;
      case "reason":
        return <Chip size="sm" variant="dot" color={reasonColor(item.reason)}>{reasonLabel(item.reason)}</Chip>;
      case "reasonDetail":
        return <span className="text-xs text-default-600 line-clamp-2">{item.reasonDetail || "-"}</span>;
      case "note":
        return <span className="text-xs text-default-600 line-clamp-2">{item.note || "-"}</span>;
      case "status":
        return <Chip size="sm" variant="flat" color={statusColor(item.status)}>{statusLabel(item.status)}</Chip>;
      case "promiseDate":
        return <span className="text-xs">{item.promiseDate ? fmtDate(item.promiseDate) : "-"}</span>;
      case "promiseAmount":
        return item.promiseAmount ? <span className="text-xs font-medium">{fmt(item.promiseAmount)}</span> : <span className="text-xs text-default-400">-</span>;
      case "createdByName":
        return <span className="text-xs text-default-500">{item.createdByName || "-"}</span>;
      default:
        return item[key] ?? "-";
    }
  }, []);

  // ─── Loading ───
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" label="กำลังโหลดข้อมูลลูกหนี้..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs aria-label="Collections tabs" color="primary" variant="underlined">
        {/* ═══════════════════ Tab 1: Tracking ═══════════════════ */}
        <Tab
          key="tracking"
          title={
            <div className="flex items-center gap-2">
              <Phone size={16} />
              <span>ติดตามลูกหนี้</span>
              {kpis.uncontacted > 0 && (
                <Chip size="sm" color="danger" variant="solid">{kpis.uncontacted}</Chip>
              )}
            </div>
          }
        >
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            <KpiCard title="ยอดค้างชำระรวม" value={`฿${fmt(kpis.totalOverdue)}`} color="danger" subtitle={`${kpis.total} ราย`} />
            <KpiCard title="ติดตามแล้ว" value={kpis.contacted} color="success" subtitle={kpis.total > 0 ? `${((kpis.contacted / kpis.total) * 100).toFixed(0)}%` : ""} />
            <KpiCard title="ยังไม่ติดตาม" value={kpis.uncontacted} color="danger" subtitle="ต้องติดตาม" />
            <KpiCard title="ครบกำหนดวันนี้" value={kpis.dueToday} color="warning" subtitle="ต้องโทรวันนี้" />
            <KpiCard title="สัญญาจะชำระ" value={`฿${fmt(kpis.promisedTotal)}`} color="primary" />
            <KpiCard title="ติดตามทั้งหมด" value={followUps.length} subtitle="ครั้ง" />
          </div>

          {/* Main DataTable */}
          <Card shadow="none" className="border border-default-200">
            <CardBody>
              <DataTable
                columns={trackingColumns}
                data={mergedData}
                renderCell={trackingRenderCell}
                rowKey="customerNumber"
                isLoading={loading}
                searchKeys={["name", "customerNumber"]}
                searchPlaceholder="ค้นหาลูกค้า..."
                initialVisibleColumns={["name", "customerNumber", "balanceDue", "period2", "period3", "lastStatus", "lastReason", "nextFollowUpDate", "followUpCount", "actions"]}
                defaultSortDescriptor={{ column: "balanceDue", direction: "descending" }}
                emptyContent="ไม่มีลูกหนี้ค้างชำระ"
                defaultRowsPerPage={15}
                getRowClassName={(item) => {
                  if (!item.followUpCount) return "bg-danger-50/30";
                  if (item.nextFollowUpDate && item.nextFollowUpDate <= new Date().toISOString().slice(0, 10)) return "bg-warning-50/30";
                  return undefined;
                }}
              />
            </CardBody>
          </Card>
        </Tab>

        {/* ═══════════════════ Tab 2: Report ═══════════════════ */}
        <Tab
          key="report"
          title={
            <div className="flex items-center gap-2">
              <FileText size={16} />
              <span>รายงาน</span>
            </div>
          }
        >
          {/* Date Filter + Export */}
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <Input
              type="date"
              label="ตั้งแต่"
              size="sm"
              className="w-40"
              value={reportSince}
              onChange={(e) => setReportSince(e.target.value)}
            />
            <Input
              type="date"
              label="ถึง"
              size="sm"
              className="w-40"
              value={reportUntil}
              onChange={(e) => setReportUntil(e.target.value)}
            />
            <Button
              variant="bordered"
              size="sm"
              startContent={<Download size={14} />}
              onPress={() => exportCSV(reportData.filtered, `ar-collections-${reportSince}-${reportUntil}.csv`)}
              isDisabled={!reportData.filtered.length}
            >
              ส่งออก CSV
            </Button>
            <Button
              variant="light"
              size="sm"
              startContent={<RefreshCw size={14} />}
              onPress={loadData}
            >
              รีเฟรช
            </Button>
          </div>

          {/* Report KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <KpiCard title="การติดตามในช่วงนี้" value={reportData.total} color="primary" subtitle="ครั้ง" />
            <KpiCard title="ลูกค้าที่ติดตาม" value={reportData.uniqueCustomers} color="success" subtitle="ราย" />
            <KpiCard title="สัญญาจะชำระ" value={`฿${fmt(reportData.totalPromised)}`} color="warning" />
            <KpiCard
              title="เฉลี่ย/ลูกค้า"
              value={reportData.uniqueCustomers > 0 ? (reportData.total / reportData.uniqueCustomers).toFixed(1) : "0"}
              subtitle="ครั้ง/ราย"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Reason Breakdown */}
            <Card shadow="none" className="border border-default-200">
              <CardHeader className="pb-0">
                <p className="text-sm font-semibold">เหตุผลที่ลูกหนี้ยังไม่ชำระ</p>
              </CardHeader>
              <CardBody>
                {reportData.reasonChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={reportData.reasonChart} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(v) => `${v} ครั้ง`} />
                      <Bar dataKey="value" name="จำนวนครั้ง" radius={[0, 4, 4, 0]}>
                        {reportData.reasonChart.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูลในช่วงนี้</p>
                )}
              </CardBody>
            </Card>

            {/* Status Distribution */}
            <Card shadow="none" className="border border-default-200">
              <CardHeader className="pb-0">
                <p className="text-sm font-semibold">สถานะการติดตาม</p>
              </CardHeader>
              <CardBody>
                {reportData.statusChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={reportData.statusChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {reportData.statusChart.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(v) => `${v} ครั้ง`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-10 text-center text-sm text-default-400">ไม่มีข้อมูลในช่วงนี้</p>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Report DataTable */}
          <Card shadow="none" className="border border-default-200">
            <CardHeader className="pb-0">
              <p className="text-sm font-semibold">รายการติดตามทั้งหมด ({reportData.total} รายการ)</p>
            </CardHeader>
            <CardBody>
              <DataTable
                columns={reportColumns}
                data={reportData.filtered}
                renderCell={reportRenderCell}
                rowKey="id"
                searchKeys={["customerName", "customerNumber", "note", "reasonDetail"]}
                searchPlaceholder="ค้นหา..."
                defaultSortDescriptor={{ column: "contactDate", direction: "descending" }}
                emptyContent="ไม่มีข้อมูลในช่วงนี้"
                defaultRowsPerPage={20}
              />
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      {/* ═══════════════════ Modal: Add Follow-up ═══════════════════ */}
      <Modal isOpen={addModal.isOpen} onClose={addModal.onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>เพิ่มการติดตาม</span>
            {selectedCustomer && (
              <span className="text-sm font-normal text-default-500">
                {selectedCustomer.name} ({selectedCustomer.customerNumber}) | ค้างชำระ ฿{fmt(selectedCustomer.balanceDue)}
              </span>
            )}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="date"
                label="วันที่ติดต่อ"
                value={form.contactDate}
                onChange={(e) => setField("contactDate", e.target.value)}
                isRequired
              />
              <Select
                label="วิธีการติดต่อ"
                selectedKeys={form.contactMethod ? [form.contactMethod] : []}
                onChange={(e) => setField("contactMethod", e.target.value)}
                isRequired
              >
                {CONTACT_METHODS.map((m) => (
                  <SelectItem key={m.value}>{m.label}</SelectItem>
                ))}
              </Select>
              <Select
                label="เหตุผลที่ยังไม่ชำระ"
                selectedKeys={form.reason ? [form.reason] : []}
                onChange={(e) => setField("reason", e.target.value)}
                isRequired
                className="md:col-span-2"
                description="ระบุสาเหตุหลักที่ลูกค้ายังไม่ชำระเงิน"
              >
                {REASONS.map((r) => (
                  <SelectItem key={r.value}>{r.label}</SelectItem>
                ))}
              </Select>
              <Input
                label="รายละเอียดเพิ่มเติม (เหตุผล)"
                placeholder="เช่น รอเช็คจากลูกค้าปลายทาง"
                value={form.reasonDetail}
                onChange={(e) => setField("reasonDetail", e.target.value)}
                className="md:col-span-2"
              />
              <Textarea
                label="หมายเหตุ"
                placeholder="บันทึกรายละเอียดการสนทนา..."
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
                className="md:col-span-2"
                minRows={2}
              />
              <Select
                label="สถานะ"
                selectedKeys={form.status ? [form.status] : []}
                onChange={(e) => setField("status", e.target.value)}
              >
                {STATUSES.map((s) => (
                  <SelectItem key={s.value}>{s.label}</SelectItem>
                ))}
              </Select>
              <Input
                type="date"
                label="วันที่ลูกค้าสัญญาจะชำระ"
                value={form.promiseDate}
                onChange={(e) => setField("promiseDate", e.target.value)}
              />
              <Input
                type="number"
                label="จำนวนเงินที่สัญญา"
                placeholder="0.00"
                value={form.promiseAmount}
                onChange={(e) => setField("promiseAmount", e.target.value)}
                startContent={<span className="text-xs text-default-400">฿</span>}
              />
              <Input
                type="date"
                label="วันที่ติดตามครั้งถัดไป"
                value={form.nextFollowUpDate}
                onChange={(e) => setField("nextFollowUpDate", e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={addModal.onClose}>ยกเลิก</Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={submitting}
              isDisabled={!form.reason || submitting}
            >
              บันทึกการติดตาม
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ═══════════════════ Modal: History ═══════════════════ */}
      <Modal isOpen={historyModal.isOpen} onClose={historyModal.onClose} size="4xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>ประวัติการติดตาม</span>
            {selectedCustomer && (
              <span className="text-sm font-normal text-default-500">
                {selectedCustomer.name} ({selectedCustomer.customerNumber}) | ค้างชำระ ฿{fmt(selectedCustomer.balanceDue)} | ติดตาม {customerHistory.length} ครั้ง
              </span>
            )}
          </ModalHeader>
          <ModalBody>
            {customerHistory.length > 0 ? (
              <div className="flex flex-col gap-4">
                {customerHistory.map((fu, idx) => (
                  <Card key={fu.id} shadow="none" className={`border ${idx === 0 ? "border-primary-200 bg-primary-50/30" : "border-default-200"}`}>
                    <CardBody className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Chip size="sm" variant="flat" color={statusColor(fu.status)}>{statusLabel(fu.status)}</Chip>
                          <Chip size="sm" variant="dot" color={reasonColor(fu.reason)}>{reasonLabel(fu.reason)}</Chip>
                          <span className="text-xs text-default-500">{contactLabel(fu.contactMethod)}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium">{fmtDate(fu.contactDate)}</p>
                          {idx === 0 && <Chip size="sm" variant="flat" color="primary" className="mt-1">ล่าสุด</Chip>}
                        </div>
                      </div>
                      {fu.reasonDetail && (
                        <p className="text-sm text-default-600 mb-1">
                          <span className="font-medium">เหตุผล:</span> {fu.reasonDetail}
                        </p>
                      )}
                      {fu.note && (
                        <p className="text-sm text-default-600 mb-1">
                          <span className="font-medium">หมายเหตุ:</span> {fu.note}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-default-400">
                        {fu.promiseDate && <span>สัญญาจะชำระ: {fmtDate(fu.promiseDate)}</span>}
                        {fu.promiseAmount && <span>จำนวน: ฿{fmt(fu.promiseAmount)}</span>}
                        {fu.nextFollowUpDate && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> ติดตามถัดไป: {fmtDate(fu.nextFollowUpDate)}
                          </span>
                        )}
                        {fu.createdByName && <span>โดย: {fu.createdByName}</span>}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-default-400">ยังไม่มีประวัติการติดตาม</p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={historyModal.onClose}>ปิด</Button>
            <Button
              color="primary"
              startContent={<Plus size={14} />}
              onPress={() => { historyModal.onClose(); openAdd(selectedCustomer); }}
            >
              เพิ่มการติดตาม
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
