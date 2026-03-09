"use client";

import { useMemo, useCallback } from "react";
import {
  Chip, Button,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Tabs, Tab, Input, Textarea, Select, SelectItem,
  Card, CardBody, CardHeader,
} from "@heroui/react";
import {
  Phone, Mail, MapPin, MessageCircle, FileText, Plus, History,
  Download, Clock, RefreshCw, BotMessageSquare,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DataTable from "@/components/ui/DataTable";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from "recharts";
import Loading from "@/components/ui/Loading";

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

/* ═══════════════════ UI Helpers ═══════════════════ */

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

/* ═══════════════════ CollectionsView ═══════════════════ */

export default function CollectionsView({
  loading, mergedData, kpis, selectedCustomer,
  form, onFieldChange, submitting, onSubmit,
  addModal, historyModal,
  onOpenAdd, onOpenHistory,
  customerHistory,
  reportSince, onReportSinceChange, reportUntil, onReportUntilChange,
  reportData, onReload, followUps,
  aiAnalysis, aiLoading, runAiAnalysis,
}) {
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
        return <span className="font-light">{item.name}</span>;
      case "customerNumber":
        return <span className="font-mono">{item.customerNumber}</span>;
      case "balanceDue":
        return <span className="font-light">{fmt(item.balanceDue)}</span>;
      case "current":
        return <span className="text-success">{fmt(item.current)}</span>;
      case "period1":
        return <span className="text-warning">{fmt(item.period1)}</span>;
      case "period2":
        return <span className="text-warning">{fmt(item.period2)}</span>;
      case "period3":
        return <span className="text-danger">{fmt(item.period3)}</span>;
      case "lastStatus":
        return item.lastStatus
          ? <Chip size="md" variant="flat" color={statusColor(item.lastStatus)}>{statusLabel(item.lastStatus)}</Chip>
          : <Chip size="md" variant="flat" color="default">ยังไม่ติดตาม</Chip>;
      case "lastReason":
        return item.lastReason
          ? <Chip size="md" variant="flat" color={reasonColor(item.lastReason)}>{reasonLabel(item.lastReason)}</Chip>
          : <span className="text-muted-foreground">-</span>;
      case "lastContactDate":
        return <span>{item.lastContactDate ? fmtDate(item.lastContactDate) : "-"}</span>;
      case "nextFollowUpDate": {
        if (!item.nextFollowUpDate) return <span className="text-muted-foreground">-</span>;
        const overdue = item.nextFollowUpDate <= new Date().toISOString().slice(0, 10);
        return (
          <span className={`font-light ${overdue ? "text-danger" : "text-primary"}`}>
            {fmtDate(item.nextFollowUpDate)}
          </span>
        );
      }
      case "followUpCount":
        return <span>{item.followUpCount || 0}</span>;
      case "actions":
        return (
          <div className="flex gap-1">
            <Button isIconOnly size="md" variant="flat" color="primary" onPress={() => onOpenAdd(item)} title="เพิ่มการติดตาม">
              <Plus />
            </Button>
            <Button isIconOnly size="md" variant="flat" color="default" onPress={() => onOpenHistory(item)} title="ดูประวัติ" isDisabled={!item.followUpCount}>
              <History />
            </Button>
          </div>
        );
      default:
        return item[key] ?? "-";
    }
  }, [onOpenAdd, onOpenHistory]);

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
        return <span>{fmtDate(item.contactDate)}</span>;
      case "customerName":
        return (
          <div>
            <p className="font-light">{item.customerName}</p>
            <p className="text-muted-foreground">{item.customerNumber}</p>
          </div>
        );
      case "contactMethod":
        return <span>{contactLabel(item.contactMethod)}</span>;
      case "reason":
        return <Chip size="md" variant="flat" color={reasonColor(item.reason)}>{reasonLabel(item.reason)}</Chip>;
      case "reasonDetail":
        return <span className="text-foreground line-clamp-2">{item.reasonDetail || "-"}</span>;
      case "note":
        return <span className="text-foreground line-clamp-2">{item.note || "-"}</span>;
      case "status":
        return <Chip size="md" variant="flat" color={statusColor(item.status)}>{statusLabel(item.status)}</Chip>;
      case "promiseDate":
        return <span>{item.promiseDate ? fmtDate(item.promiseDate) : "-"}</span>;
      case "promiseAmount":
        return item.promiseAmount ? <span className="font-light">{fmt(item.promiseAmount)}</span> : <span className="text-muted-foreground">-</span>;
      case "createdByName":
        return <span className="text-muted-foreground">{item.createdByName || "-"}</span>;
      default:
        return item[key] ?? "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <Tabs aria-label="Collections tabs" color="primary" variant="underlined">
        {/* ═══════════════════ Tab 1: Tracking ═══════════════════ */}
        <Tab
          key="tracking"
          title={
            <div className="flex items-center gap-2">
              <Phone />
              <span>ติดตามลูกหนี้</span>
              {kpis.uncontacted > 0 && (
                <Chip size="md" color="danger" variant="solid">{kpis.uncontacted}</Chip>
              )}
            </div>
          }
        >
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
            enableCardView
            actionMenuItems={(item) => [
              { key: "add", label: "เพิ่มการติดตาม", icon: <Plus />, onPress: () => onOpenAdd(item) },
              item.followUpCount
                ? { key: "history", label: "ดูประวัติ", icon: <History />, onPress: () => onOpenHistory(item) }
                : null,
            ].filter(Boolean)}
          />
        </Tab>

        {/* ═══════════════════ Tab 2: Report ═══════════════════ */}
        <Tab
          key="report"
          title={
            <div className="flex items-center gap-2">
              <FileText />
              <span>รายงาน</span>
            </div>
          }
        >
          {/* Date Filter + Export */}
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <Input
              type="date"
              label="ตั้งแต่"
              size="md"
              className="w-40"
              value={reportSince}
              onChange={(e) => onReportSinceChange(e.target.value)}
            />
            <Input
              type="date"
              label="ถึง"
              size="md"
              className="w-40"
              value={reportUntil}
              onChange={(e) => onReportUntilChange(e.target.value)}
            />
            <Button
              variant="flat"
              size="md"
              startContent={<Download />}
              onPress={() => exportCSV(reportData.filtered, `ar-collections-${reportSince}-${reportUntil}.csv`)}
              isDisabled={!reportData.filtered.length}
            >
              ส่งออก CSV
            </Button>
            <Button
              variant="light"
              size="md"
              startContent={<RefreshCw />}
              onPress={onReload}
            >
              รีเฟรช
            </Button>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
              <CardHeader className="pb-0">
                <p className="text-xs font-light">เหตุผลที่ลูกหนี้ยังไม่ชำระ</p>
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
                  <p className="py-10 text-center text-xs text-muted-foreground">ไม่มีข้อมูลในช่วงนี้</p>
                )}
              </CardBody>
            </Card>

            <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
              <CardHeader className="pb-0">
                <p className="text-xs font-light">สถานะการติดตาม</p>
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
                  <p className="py-10 text-center text-xs text-muted-foreground">ไม่มีข้อมูลในช่วงนี้</p>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Report DataTable */}
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
            enableCardView
          />
        </Tab>
      </Tabs>

      {/* ═══════════════════ AI Collections Advisor ═══════════════════ */}
      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="pb-0 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BotMessageSquare className="text-primary" />
            <p className="text-xs font-light">AI วิเคราะห์การติดตามลูกหนี้</p>
            <Chip size="md" variant="flat" color="secondary">Collections Advisor</Chip>
          </div>
          <Button
            variant={aiAnalysis ? "bordered" : "solid"}
            color="primary"
            size="md"
            isLoading={aiLoading}
            isDisabled={!mergedData?.length || aiLoading}
            onPress={runAiAnalysis}
            startContent={!aiLoading && (aiAnalysis ? <RefreshCw /> : <BotMessageSquare />)}
          >
            {aiAnalysis ? "วิเคราะห์ใหม่" : "เริ่มวิเคราะห์"}
          </Button>
        </CardHeader>
        <CardBody>
          {aiLoading && !aiAnalysis && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loading />
              <span className="text-xs text-muted-foreground">AI กำลังวิเคราะห์ข้อมูลลูกหนี้และจัดลำดับความสำคัญ...</span>
            </div>
          )}
          {!aiAnalysis && !aiLoading && (
            <p className="text-xs text-muted-foreground py-4 text-center">
              กดปุ่ม &quot;เริ่มวิเคราะห์&quot; เพื่อให้ AI จัดลำดับลูกหนี้ที่ควรติดตามก่อน วิเคราะห์ความเสี่ยง และแนะนำกลยุทธ์เก็บหนี้
            </p>
          )}
          {aiAnalysis && (
            <div className="prose prose-sm max-w-none dark:prose-invert text-foreground text-xs leading-relaxed">
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
              {aiLoading && <Loading />}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ═══════════════════ Modal: Add Follow-up ═══════════════════ */}
      <Modal isOpen={addModal.isOpen} onClose={addModal.onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>เพิ่มการติดตาม</span>
            {selectedCustomer && (
              <span className="text-xs font-light text-muted-foreground">
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
                onChange={(e) => onFieldChange("contactDate", e.target.value)}
                isRequired
              />
              <Select
                label="วิธีการติดต่อ"
                selectedKeys={form.contactMethod ? [form.contactMethod] : []}
                onChange={(e) => onFieldChange("contactMethod", e.target.value)}
                isRequired
              >
                {CONTACT_METHODS.map((m) => (
                  <SelectItem key={m.value}>{m.label}</SelectItem>
                ))}
              </Select>
              <Select
                label="เหตุผลที่ยังไม่ชำระ"
                selectedKeys={form.reason ? [form.reason] : []}
                onChange={(e) => onFieldChange("reason", e.target.value)}
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
                onChange={(e) => onFieldChange("reasonDetail", e.target.value)}
                className="md:col-span-2"
              />
              <Textarea
                label="หมายเหตุ"
                placeholder="บันทึกรายละเอียดการสนทนา..."
                value={form.note}
                onChange={(e) => onFieldChange("note", e.target.value)}
                className="md:col-span-2"
                minRows={2}
              />
              <Select
                label="สถานะ"
                selectedKeys={form.status ? [form.status] : []}
                onChange={(e) => onFieldChange("status", e.target.value)}
              >
                {STATUSES.map((s) => (
                  <SelectItem key={s.value}>{s.label}</SelectItem>
                ))}
              </Select>
              <Input
                type="date"
                label="วันที่ลูกค้าสัญญาจะชำระ"
                value={form.promiseDate}
                onChange={(e) => onFieldChange("promiseDate", e.target.value)}
              />
              <Input
                type="number"
                label="จำนวนเงินที่สัญญา"
                placeholder="0.00"
                value={form.promiseAmount}
                onChange={(e) => onFieldChange("promiseAmount", e.target.value)}
                startContent={<span className="text-muted-foreground">฿</span>}
              />
              <Input
                type="date"
                label="วันที่ติดตามครั้งถัดไป"
                value={form.nextFollowUpDate}
                onChange={(e) => onFieldChange("nextFollowUpDate", e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={addModal.onClose}>ยกเลิก</Button>
            <Button
              color="primary"
              onPress={onSubmit}
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
              <span className="text-xs font-light text-muted-foreground">
                {selectedCustomer.name} ({selectedCustomer.customerNumber}) | ค้างชำระ ฿{fmt(selectedCustomer.balanceDue)} | ติดตาม {customerHistory.length} ครั้ง
              </span>
            )}
          </ModalHeader>
          <ModalBody>
            {customerHistory.length > 0 ? (
              <div className="flex flex-col gap-4">
                {customerHistory.map((fu, idx) => (
                  <Card key={fu.id} shadow="none" className={`border ${idx === 0 ? "border-primary-200 bg-primary-50/30" : "border-border"}`}>
                    <CardBody className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Chip size="md" variant="flat" color={statusColor(fu.status)}>{statusLabel(fu.status)}</Chip>
                          <Chip size="md" variant="flat" color={reasonColor(fu.reason)}>{reasonLabel(fu.reason)}</Chip>
                          <span className="text-muted-foreground">{contactLabel(fu.contactMethod)}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-light">{fmtDate(fu.contactDate)}</p>
                          {idx === 0 && <Chip size="md" variant="flat" color="primary" className="mt-1">ล่าสุด</Chip>}
                        </div>
                      </div>
                      {fu.reasonDetail && (
                        <p className="text-foreground mb-1">
                          <span className="font-light">เหตุผล:</span> {fu.reasonDetail}
                        </p>
                      )}
                      {fu.note && (
                        <p className="text-foreground mb-1">
                          <span className="font-light">หมายเหตุ:</span> {fu.note}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-muted-foreground">
                        {fu.promiseDate && <span>สัญญาจะชำระ: {fmtDate(fu.promiseDate)}</span>}
                        {fu.promiseAmount && <span>จำนวน: ฿{fmt(fu.promiseAmount)}</span>}
                        {fu.nextFollowUpDate && (
                          <span className="flex items-center gap-1">
                            <Clock /> ติดตามถัดไป: {fmtDate(fu.nextFollowUpDate)}
                          </span>
                        )}
                        {fu.createdByName && <span>โดย: {fu.createdByName}</span>}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-muted-foreground">ยังไม่มีประวัติการติดตาม</p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={historyModal.onClose}>ปิด</Button>
            <Button
              color="primary"
              startContent={<Plus />}
              onPress={() => { historyModal.onClose(); onOpenAdd(selectedCustomer); }}
            >
              เพิ่มการติดตาม
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
