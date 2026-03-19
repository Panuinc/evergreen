"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  Tabs,
  Tab,
  Button,
  Chip,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
} from "@heroui/react";
import {
  Upload,
  FileText,
  RefreshCw,
  Download,
  Trash2,
  Search,
  Link2,
  X,
  Check,
  Ban,
  Zap,
  Scale,
  Eye,
} from "lucide-react";
import DataTable from "@/components/ui/dataTable";
import FileUpload from "@/components/ui/fileUpload";
import Loading from "@/components/ui/loading";

const bankOptions = [
  { key: "AUTO", label: "ตรวจจับอัตโนมัติ" },
  { key: "KBANK", label: "กสิกรไทย (KBank)" },
  { key: "SCB", label: "ไทยพาณิชย์ (SCB)" },
  { key: "BBL", label: "กรุงเทพ (BBL)" },
  { key: "KTB", label: "กรุงไทย (KTB)" },
];

const statusColors = {
  matched: "success",
  suggested: "warning",
  unmatched: "default",
  excluded: "secondary",
};

const statusLabels = {
  matched: "Match แล้ว",
  suggested: "แนะนำ",
  unmatched: "ยังไม่ Match",
  excluded: "ยกเว้น",
};

const stmtStatusColors = {
  pending: "default",
  parsed: "primary",
  matched: "success",
  error: "danger",
};

function fmtNum(n) {
  return Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BankReconView({
  statements,
  selectedId,
  detail,
  loading,
  parsing,
  matching,
  filter,
  setFilter,
  kpis,
  filteredEntries,
  openInvoices,
  matchModal,
  matchEntry,
  selectStatement,
  handleUpload,
  handleParse,
  handleAutoMatch,
  handleManualMatch,
  handleUnmatch,
  handleExclude,
  handleDelete,
  handleExport,
  openMatchModal,
  arLoading,
  arComparison,
  loadArData,
}) {
  const [bankCode, setBankCode] = useState("AUTO");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [activeTab, setActiveTab] = useState("upload");


  const stmtColumns = [
    { name: "ไฟล์", uid: "fileName", sortable: true },
    { name: "ธนาคาร", uid: "bankCode", sortable: true },
    { name: "เลขบัญชี", uid: "accountNumber" },
    { name: "ช่วงวันที่", uid: "period" },
    { name: "ยอดเปิด", uid: "openingBalance" },
    { name: "ยอดปิด", uid: "closingBalance" },
    { name: "รายการ", uid: "entryCount", sortable: true },
    { name: "Match", uid: "matchedCount" },
    { name: "สถานะ", uid: "status", sortable: true },
    { name: "อัพโหลดเมื่อ", uid: "createdAt", sortable: true },
    { name: "จัดการ", uid: "actions" },
  ];

  const renderStmtCell = (item, col) => {
    switch (col) {
      case "period":
        return item.periodStart && item.periodEnd
          ? `${item.periodStart} — ${item.periodEnd}`
          : "-";
      case "openingBalance":
      case "closingBalance":
        return item[col] != null ? fmtNum(item[col]) : "-";
      case "status":
        return (
          <Chip size="md" color={stmtStatusColors[item.status] || "default"} variant="flat">
            {item.status === "pending" ? "รออ่าน" : item.status === "parsed" ? "อ่านแล้ว" : item.status === "matched" ? "Match แล้ว" : item.status}
          </Chip>
        );
      case "createdAt":
        return item.createdAt ? new Date(item.createdAt).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" }) : "-";
      case "actions":
        return (
          <div className="flex gap-1">
            {item.status === "pending" && (
              <Button
                size="md"
                color="primary"
                variant="flat"
                isLoading={parsing}
                onPress={() => handleParse(item.id)}
              >
                อ่าน PDF
              </Button>
            )}
            <Button
              size="md"
              color="primary"
              variant="light"
              onPress={() => { selectStatement(item.id); setActiveTab("recon"); }}
            >
              ดูรายละเอียด
            </Button>
            <Button
              size="md"
              color="danger"
              variant="light"
              isIconOnly
              onPress={() => {
                if (confirm("ลบ Statement นี้?")) handleDelete(item.id);
              }}
            >
              <Trash2 />
            </Button>
          </div>
        );
      default:
        return item[col] ?? "-";
    }
  };


  const entryColumns = [
    { name: "วันที่", uid: "txDate", sortable: true },
    { name: "เวลา", uid: "txTime" },
    { name: "ช่องทาง", uid: "channel" },
    { name: "รายละเอียด", uid: "description" },
    { name: "ประเภท", uid: "txType" },
    { name: "ฝาก/ถอน", uid: "direction", sortable: true },
    { name: "จำนวนเงิน", uid: "amount", sortable: true },
    { name: "ยอดคงเหลือ", uid: "balance" },
    { name: "สถานะ", uid: "matchStatus", sortable: true },
    { name: "Invoice", uid: "invoice" },
    { name: "จัดการ", uid: "actions" },
  ];

  const renderEntryCell = (item, col) => {
    switch (col) {
      case "direction":
        return (
          <Chip
            size="md"
            color={item.direction === "credit" ? "success" : "danger"}
            variant="flat"
          >
            {item.direction === "credit" ? "ฝาก" : "ถอน"}
          </Chip>
        );
      case "amount":
        return (
          <span className={item.direction === "credit" ? "text-success" : "text-danger"}>
            {fmtNum(item.amount)}
          </span>
        );
      case "balance":
        return fmtNum(item.balance);
      case "matchStatus":
        return (
          <div className="flex items-center gap-1">
            <Chip
              size="md"
              color={statusColors[item.matchStatus] || "default"}
              variant="flat"
            >
              {statusLabels[item.matchStatus] || item.matchStatus}
            </Chip>
            {item.matchConfidence && (
              <span className="text-xs text-muted-foreground">
                {(item.matchConfidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
        );
      case "invoice": {
        const matches = item.bankMatch || [];
        if (matches.length === 0) return "-";
        return (
          <div className="flex flex-col gap-0.5">
            {matches.map((m, i) => (
              <div key={i} className="text-xs">
                <span className="font-light">{m.invoiceNumber}</span>
                <span className="text-muted-foreground ml-1">({fmtNum(m.matchedAmount)})</span>
              </div>
            ))}
          </div>
        );
      }
      case "actions":
        if (item.direction !== "credit") return null;
        return (
          <div className="flex gap-1">
            {(item.matchStatus === "unmatched" || item.matchStatus === "suggested") && (
              <>
                <Button
                  size="md"
                  color="primary"
                  variant="flat"
                  onPress={() => openMatchModal(item)}
                  startContent={<Link2 />}
                >
                  Match
                </Button>
                <Button
                  size="md"
                  color="default"
                  variant="flat"
                  onPress={() => handleExclude(item.id, "ยกเว้น — โอนภายใน/ค่าธรรมเนียม")}
                  isIconOnly
                  title="ยกเว้น"
                >
                  <Ban />
                </Button>
              </>
            )}
            {item.matchStatus === "matched" && (
              <Button
                size="md"
                color="danger"
                variant="light"
                onPress={() => handleUnmatch(item.id)}
                startContent={<X />}
              >
                ยกเลิก
              </Button>
            )}
          </div>
        );
      default:
        return item[col] ?? "-";
    }
  };


  const filteredInvoices = useMemo(() => {
    if (!invoiceSearch) return openInvoices.slice(0, 50);
    const term = invoiceSearch.toLowerCase();
    return openInvoices
      .filter(
        (inv) =>
          (inv.number || "").toLowerCase().includes(term) ||
          (inv.customerName || "").toLowerCase().includes(term) ||
          String(inv.totalAmountIncludingTax || "").includes(term),
      )
      .slice(0, 50);
  }, [openInvoices, invoiceSearch]);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <Tabs aria-label="Bank Recon" color="primary" variant="underlined" selectedKey={activeTab} onSelectionChange={setActiveTab}>
        {}
        <Tab
          key="upload"
          title={
            <div className="flex items-center gap-2">
              <Upload />
              <span>อัพโหลด</span>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
              <CardBody className="gap-4">
                <div className="flex items-end gap-4 flex-wrap">
                  <Select
                    label="ธนาคาร"
                    selectedKeys={new Set([bankCode])}
                    onChange={(e) => setBankCode(e.target.value)}
                    className="max-w-xs"
                  >
                    {bankOptions.map((b) => (
                      <SelectItem key={b.key}>{b.label}</SelectItem>
                    ))}
                  </Select>
                  <div className="flex-1 min-w-[200px]">
                    <FileUpload
                      label="อัพโหลด Bank Statement (PDF)"
                      accept=".pdf"
                      folder="bank-statements"
                      onChange={(url) => {
                        const fileName = url.split("/").pop() || "statement.pdf";
                        handleUpload(url, fileName, bankCode);
                      }}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            <DataTable
              columns={stmtColumns}
              data={statements}
              renderCell={renderStmtCell}
              rowKey="id"
              isLoading={loading}
              searchKeys={["fileName", "bankCode", "accountNumber"]}
              searchPlaceholder="ค้นหา statement..."
              defaultSortDescriptor={{ column: "createdAt", direction: "descending" }}
              emptyContent="ยังไม่มี Statement"
              actionMenuItems={(item) => [
                item.status === "pending"
                  ? { key: "parse", label: "อ่าน PDF", icon: <Eye />, onPress: () => handleParse(item.id) }
                  : null,
                { key: "view", label: "ดูรายละเอียด", icon: <Eye />, onPress: () => { selectStatement(item.id); setActiveTab("recon"); } },
                { key: "delete", label: "ลบ", icon: <Trash2 />, color: "danger", onPress: () => { if (confirm("ลบ Statement นี้?")) handleDelete(item.id); } },
              ].filter(Boolean)}
            />
          </div>
        </Tab>

        {}
        <Tab
          key="recon"
          title={
            <div className="flex items-center gap-2">
              <FileText />
              <span>กระทบยอด</span>
              {kpis.unmatchedCount > 0 && (
                <Chip size="md" color="danger" variant="flat">
                  {kpis.unmatchedCount}
                </Chip>
              )}
            </div>
          }
        >
          {!detail ? (
            <div className="text-center py-8 text-muted-foreground">
              เลือก Statement จากแท็บ &quot;อัพโหลด&quot; เพื่อเริ่มกระทบยอด
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {}
              <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
                <CardBody>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-light">{detail.bankCode}</span>
                      <span className="text-muted-foreground">{detail.accountNumber}</span>
                      <span className="text-muted-foreground">
                        {detail.periodStart} — {detail.periodEnd}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="md"
                        color="primary"
                        onPress={handleAutoMatch}
                        isLoading={matching}
                        startContent={<Zap />}
                      >
                        Auto-Match
                      </Button>
                      <Button
                        size="md"
                        color="default"
                        variant="flat"
                        onPress={handleExport}
                        startContent={<Download />}
                      >
                        Export Excel
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard label="ยอดฝากทั้งหมด" value={fmtNum(kpis.totalDeposit)} sub={`${kpis.creditCount} รายการ`} color="text-success" />
                <KpiCard label="Match แล้ว" value={fmtNum(kpis.matchedAmount)} sub={`${kpis.matchedCount} รายการ`} color="text-primary" />
                <KpiCard label="ยังไม่ Match" value={fmtNum(kpis.unmatchedAmount)} sub={`${kpis.unmatchedCount} รายการ`} color="text-danger" />
                <KpiCard label="อัตรา Match" value={`${kpis.matchRate}%`} sub={`แนะนำ ${kpis.suggestedCount} / ยกเว้น ${kpis.excludedCount}`} color="text-warning" />
              </div>

              {}
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: "all", label: `ทั้งหมด (${detail.entries?.length || 0})` },
                  { key: "credit", label: `ฝาก (${kpis.creditCount})` },
                  { key: "debit", label: `ถอน (${kpis.debitCount})` },
                  { key: "matched", label: `Match (${kpis.matchedCount})` },
                  { key: "suggested", label: `แนะนำ (${kpis.suggestedCount})` },
                  { key: "unmatched", label: `ไม่ Match (${kpis.unmatchedCount})` },
                  { key: "excluded", label: `ยกเว้น (${kpis.excludedCount})` },
                ].map((f) => (
                  <Chip
                    key={f.key}
                    variant={filter === f.key ? "solid" : "bordered"}
                    color={filter === f.key ? "primary" : "default"}
                    className="cursor-pointer"
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                  </Chip>
                ))}
              </div>

              {}
              <DataTable
                columns={entryColumns}
                data={filteredEntries}
                renderCell={renderEntryCell}
                rowKey="id"
                isLoading={loading}
                searchKeys={["description", "txType", "channel"]}
                searchPlaceholder="ค้นหารายการ..."
                defaultRowsPerPage={20}
                defaultSortDescriptor={{ column: "txDate", direction: "ascending" }}
                emptyContent="ไม่มีรายการ"
                getRowClassName={(item) =>
                  item.matchStatus === "matched"
                    ? "bg-success-50"
                    : item.matchStatus === "suggested"
                      ? "bg-warning-50"
                      : ""
                }
                actionMenuItems={(item) => {
                  if (item.direction !== "credit") return [];
                  const items = [];
                  if (item.matchStatus === "unmatched" || item.matchStatus === "suggested") {
                    items.push(
                      { key: "match", label: "Match", icon: <Link2 />, onPress: () => openMatchModal(item) },
                      { key: "exclude", label: "ยกเว้น", icon: <Ban />, onPress: () => handleExclude(item.id, "ยกเว้น — โอนภายใน/ค่าธรรมเนียม") },
                    );
                  }
                  if (item.matchStatus === "matched") {
                    items.push({ key: "unmatch", label: "ยกเลิก Match", icon: <X />, color: "danger", onPress: () => handleUnmatch(item.id) });
                  }
                  return items;
                }}
              />
            </div>
          )}
        </Tab>

        {}
        <Tab
          key="summary"
          title={
            <div className="flex items-center gap-2">
              <RefreshCw />
              <span>สรุป</span>
            </div>
          }
        >
          {!detail ? (
            <div className="text-center py-8 text-muted-foreground">เลือก Statement ก่อน</div>
          ) : (
            <SummaryTab detail={detail} kpis={kpis} handleExport={handleExport} />
          )}
        </Tab>
        {}
        <Tab
          key="arCompare"
          title={
            <div className="flex items-center gap-2">
              <Scale />
              <span>เปรียบเทียบ AR</span>
            </div>
          }
        >
          {!detail ? (
            <div className="text-center py-8 text-muted-foreground">
              เลือก Statement จากแท็บ &quot;อัพโหลด&quot; แล้วกด Auto-Match ก่อน
            </div>
          ) : (
            <ArCompareTab
              arComparison={arComparison}
              arLoading={arLoading}
              loadArData={loadArData}
              kpis={kpis}
            />
          )}
        </Tab>
      </Tabs>

      {}
      <Modal isOpen={matchModal.isOpen} onClose={matchModal.onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            <div className="flex flex-col gap-1">
              <span>เลือก Invoice สำหรับ Match</span>
              {matchEntry && (
                <span className="text-xs font-light text-muted-foreground">
                  {matchEntry.txDate} — {matchEntry.description} — ยอด {fmtNum(matchEntry.amount)} บาท
                </span>
              )}
            </div>
          </ModalHeader>
          <ModalBody>
            <Input
              placeholder="ค้นหาเลข Invoice หรือชื่อลูกค้า..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              startContent={<Search />}
              className="mb-3"
            />

            {}
            {matchEntry?.bankMatch?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-light mb-2 text-warning">แนะนำจาก Auto-Match:</p>
                {matchEntry.bankMatch.map((m, i) => (
                  <Card key={i} shadow="none" className="border border-warning-200 mb-2">
                    <CardBody className="flex-row items-center justify-between py-2">
                      <div>
                        <span className="font-light">{m.invoiceNumber}</span>
                        <span className="text-xs text-muted-foreground ml-2">{m.customerName}</span>
                        <span className="text-xs ml-2">ยอด {fmtNum(m.remainingAmount)}</span>
                      </div>
                      <Button
                        size="md"
                        color="success"
                        onPress={() =>
                          handleManualMatch(matchEntry.id, {
                            invoiceNumber: m.invoiceNumber,
                            customerNumber: m.customerNumber,
                            customerName: m.customerName,
                            invoiceAmount: m.invoiceAmount,
                            remainingAmount: m.remainingAmount,
                            matchedAmount: matchEntry.amount,
                          })
                        }
                        startContent={<Check />}
                      >
                        เลือก
                      </Button>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}

            {}
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
              {filteredInvoices.map((inv) => (
                <Card key={inv.id || inv.number} shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
                  <CardBody className="flex-row items-center justify-between py-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-light">{inv.number}</span>
                        <span className="text-xs text-muted-foreground">
                          {inv.customerName}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        วันที่ {inv.invoiceDate} | ครบ {inv.dueDate} | ยอด{" "}
                        {fmtNum(inv.totalAmountIncludingTax)} | คงเหลือ{" "}
                        {fmtNum(inv.remainingAmount)}
                      </div>
                    </div>
                    <Button
                      size="md"
                      color="primary"
                      variant="flat"
                      onPress={() =>
                        handleManualMatch(matchEntry.id, {
                          invoiceNumber: inv.number,
                          customerNumber: inv.customerNumber || "",
                          customerName: inv.customerName || "",
                          invoiceAmount: Number(inv.totalAmountIncludingTax || 0),
                          remainingAmount: Number(inv.remainingAmount || inv.totalAmountIncludingTax || 0),
                          matchedAmount: matchEntry.amount,
                        })
                      }
                      startContent={<Check />}
                    >
                      Match
                    </Button>
                  </CardBody>
                </Card>
              ))}
              {filteredInvoices.length === 0 && (
                <p className="text-center text-muted-foreground py-4">ไม่พบ Invoice</p>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" onPress={matchModal.onClose}>
              ปิด
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

function KpiCard({ label, value, sub, color }) {
  return (
    <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
      <CardBody className="py-3 px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xs font-light ${color}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardBody>
    </Card>
  );
}

function SummaryTab({ detail, kpis, handleExport }) {
  const customerSummary = useMemo(() => {
    const map = new Map();
    for (const entry of detail.entries || []) {
      if (entry.direction !== "credit" || !entry.bankMatch?.length) continue;
      for (const m of entry.bankMatch) {
        const key = m.customerNumber || m.customerName;
        if (!map.has(key)) {
          map.set(key, {
            customerNumber: m.customerNumber,
            customerName: m.customerName,
            totalMatched: 0,
            invoiceCount: 0,
            invoices: [],
            invoiceDetails: [],
          });
        }
        const s = map.get(key);
        s.totalMatched += Number(m.matchedAmount);
        s.invoiceCount++;
        s.invoices.push(m.invoiceNumber);
        s.invoiceDetails.push({ number: m.invoiceNumber, amount: Number(m.matchedAmount) });
      }
    }
    return [...map.values()].sort((a, b) => b.totalMatched - a.totalMatched);
  }, [detail.entries]);

  const summaryColumns = [
    { name: "เลขลูกค้า", uid: "customerNumber", sortable: true },
    { name: "ชื่อลูกค้า", uid: "customerName", sortable: true },
    { name: "จำนวน Invoice", uid: "invoiceCount", sortable: true },
    { name: "ยอดรวม Match", uid: "totalMatched", sortable: true },
    { name: "Invoice", uid: "invoices" },
  ];

  const renderSummaryCell = (item, col) => {
    if (col === "totalMatched") return fmtNum(item.totalMatched);
    if (col === "invoices") {
      return (
        <div className="flex flex-wrap gap-1">
          {item.invoiceDetails.map((d, i) => (
            <Chip key={i} size="md" variant="flat">
              {d.number} ({fmtNum(d.amount)})
            </Chip>
          ))}
        </div>
      );
    }
    return item[col] ?? "-";
  };

  return (
    <div className="flex flex-col gap-4">
      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="รวมรายการทั้งหมด" value={kpis.totalEntries} sub={`ฝาก ${kpis.creditCount} / ถอน ${kpis.debitCount}`} color="text-foreground" />
        <KpiCard label="ยอดฝาก" value={fmtNum(kpis.totalDeposit)} sub="บาท" color="text-success" />
        <KpiCard label="ยอดถอน" value={fmtNum(kpis.totalWithdraw)} sub="บาท" color="text-danger" />
        <KpiCard label="อัตรา Match" value={`${kpis.matchRate}%`} sub={`${kpis.matchedCount} / ${kpis.creditCount} รายการฝาก`} color="text-primary" />
      </div>

      {}
      <DataTable
        columns={summaryColumns}
        data={customerSummary}
        renderCell={renderSummaryCell}
        rowKey="customerNumber"
        searchKeys={["customerNumber", "customerName"]}
        searchPlaceholder="ค้นหาลูกค้า..."
        emptyContent="ยังไม่มีข้อมูล Match"
        topEndContent={
          <Button
            size="md"
            color="primary"
            variant="flat"
            onPress={handleExport}
            startContent={<Download />}
          >
            Export Excel
          </Button>
        }
      />
    </div>
  );
}

const arStatusColors = {
  "จ่ายครบ": "success",
  "ยังค้าง": "warning",
  "จ่ายเกิน": "primary",
  "ไม่พบใน AR": "default",
};

function ArCompareTab({ arComparison, arLoading, loadArData, kpis }) {
  const arColumns = [
    { name: "รหัสลูกค้า", uid: "customerNumber", sortable: true },
    { name: "ชื่อลูกค้า", uid: "customerName", sortable: true },
    { name: "ยอดฝาก Match", uid: "matchedTotal", sortable: true },
    { name: "ยอดค้าง AR", uid: "arBalanceDue", sortable: true },
    { name: "ปัจจุบัน", uid: "arCurrent", sortable: true },
    { name: "ค้าง 1 งวด", uid: "arPeriod1", sortable: true },
    { name: "ค้าง 2 งวด", uid: "arPeriod2", sortable: true },
    { name: "ค้าง 3+ งวด", uid: "arPeriod3", sortable: true },
    { name: "ส่วนต่าง", uid: "difference", sortable: true },
    { name: "สถานะ", uid: "status", sortable: true },
  ];

  const renderArCell = (item, col) => {
    switch (col) {
      case "matchedTotal":
        return <span className="text-success font-light">{fmtNum(item.matchedTotal)}</span>;
      case "arBalanceDue":
        return <span className="font-light">{fmtNum(item.arBalanceDue)}</span>;
      case "arCurrent":
        return <span className="text-success">{fmtNum(item.arCurrent)}</span>;
      case "arPeriod1":
        return <span className="text-warning">{fmtNum(item.arPeriod1)}</span>;
      case "arPeriod2":
        return <span className="text-warning">{fmtNum(item.arPeriod2)}</span>;
      case "arPeriod3":
        return <span className="text-danger">{fmtNum(item.arPeriod3)}</span>;
      case "difference":
        return (
          <span className={item.difference > 0.01 ? "text-danger font-light" : item.difference < -0.01 ? "text-primary font-light" : "text-success font-light"}>
            {item.difference > 0 ? "+" : ""}{fmtNum(item.difference)}
          </span>
        );
      case "status":
        return (
          <Chip size="md" color={arStatusColors[item.status] || "default"} variant="flat">
            {item.status}
          </Chip>
        );
      default:
        return item[col] ?? "-";
    }
  };

  const totalMatched = arComparison.reduce((s, r) => s + r.matchedTotal, 0);
  const totalAr = arComparison.reduce((s, r) => s + r.arBalanceDue, 0);
  const totalDiff = totalAr - totalMatched;
  const paidCount = arComparison.filter((r) => r.status === "จ่ายครบ").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="ยอดฝาก Match รวม" value={fmtNum(totalMatched)} sub={`${arComparison.filter((r) => r.matchedTotal > 0).length} ลูกค้า`} color="text-success" />
        <KpiCard label="ยอดค้าง AR รวม" value={fmtNum(totalAr)} sub={`${arComparison.length} ลูกค้า`} color="text-warning" />
        <KpiCard label="ส่วนต่างรวม" value={fmtNum(totalDiff)} sub={totalDiff > 0 ? "ยังค้างชำระ" : "ชำระเกิน/ครบ"} color={totalDiff > 0 ? "text-danger" : "text-success"} />
        <KpiCard label="จ่ายครบ" value={paidCount} sub={`จาก ${arComparison.length} ลูกค้า`} color="text-primary" />
      </div>

      <DataTable
        columns={arColumns}
        data={arComparison}
        renderCell={renderArCell}
        rowKey="customerNumber"
        isLoading={arLoading}
        searchKeys={["customerNumber", "customerName"]}
        searchPlaceholder="ค้นหาลูกค้า..."
        defaultSortDescriptor={{ column: "difference", direction: "descending" }}
        emptyContent={arComparison.length === 0 ? "กดปุ่ม \"โหลดข้อมูล AR\" เพื่อดึงข้อมูลเปรียบเทียบ" : "ไม่พบข้อมูล"}
        getRowClassName={(item) =>
          item.status === "จ่ายครบ"
            ? "bg-success-50"
            : item.arPeriod3 > 0
              ? "bg-danger-50"
              : ""
        }
        topEndContent={
          <Button
            size="md"
            color="primary"
            onPress={loadArData}
            isLoading={arLoading}
            startContent={<RefreshCw />}
          >
            โหลดข้อมูล AR
          </Button>
        }
      />
    </div>
  );
}
