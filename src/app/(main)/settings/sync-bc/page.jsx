"use client";

import { useState, useCallback, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Divider,
  Spinner,
  Progress,
} from "@heroui/react";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Package,
  ShoppingCart,
  ClipboardList,
  FolderKanban,
  Upload,
  FileSpreadsheet,
  Loader2,
  ArrowLeftRight,
} from "lucide-react";

/* ── BC Tables ── */
const BC_TABLES = [
  { key: "dimensionValues", label: "มิติ", icon: FolderKanban },
  { key: "customers", label: "ลูกค้า", icon: Users },
  { key: "items", label: "สินค้า", icon: Package },
  { key: "salesOrders", label: "คำสั่งขาย", icon: ShoppingCart },
  { key: "salesOrderLines", label: "รายการคำสั่งขาย", icon: ClipboardList },
  { key: "itemLedgerEntries", label: "เคลื่อนไหวสินค้า", icon: ArrowLeftRight },
];

const PHASE_ORDER = [
  "dimensionValues",
  "customers",
  "items",
  "salesOrders",
  "salesOrderLines",
  "itemLedgerEntries",
  "cleanup",
];

function PhaseIcon({ phase, step }) {
  const table = BC_TABLES.find((t) => t.key === phase);
  const Icon = table?.icon || FolderKanban;
  const size = 16;

  if (step === "done") return <CheckCircle2 size={size} className="text-success shrink-0" />;
  if (step === "error") return <XCircle size={size} className="text-danger shrink-0" />;
  if (step === "fetching" || step === "saving" || step === "cleaning")
    return <Loader2 size={size} className="text-primary shrink-0 animate-spin" />;
  return <Icon size={size} className="text-default-400 shrink-0" />;
}

function SyncProgressPanel({ phases }) {
  const entries = PHASE_ORDER
    .filter((p) => phases[p])
    .map((p) => ({ key: p, ...phases[p] }));

  if (entries.length === 0) return null;

  const totalPhases = PHASE_ORDER.length;
  const donePhases = entries.filter((e) => e.step === "done" || e.step === "error").length;
  const overallPct = Math.round((donePhases / totalPhases) * 100);

  return (
    <Card shadow="none" className="border-2 border-primary bg-primary-50/30">
      <CardBody className="gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">ความคืบหน้า</span>
          <span className="text-sm text-default-500">{overallPct}%</span>
        </div>
        <Progress
          aria-label="Sync progress"
          value={overallPct}
          color="primary"
          size="md"
          className="w-full"
        />

        <div className="flex flex-col gap-2 mt-1">
          {entries.map((e) => (
            <div key={e.key} className="flex items-center gap-2">
              <PhaseIcon phase={e.key} step={e.step} />
              <span className="text-sm flex-1">{e.label}</span>
              {e.step === "saving" && e.done != null && e.total != null && (
                <div className="w-32">
                  <Progress
                    aria-label={`${e.key} progress`}
                    value={Math.round((e.done / e.total) * 100)}
                    color="primary"
                    size="sm"
                  />
                </div>
              )}
              {e.step === "done" && e.count != null && (
                <span className="text-xs text-success font-medium">
                  {e.count.toLocaleString("th-TH")}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function ResultCards({ tables, results }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {tables.map((t) => {
        const val = results?.[t.key];
        const isError = typeof val === "string" && val.startsWith("ERROR");
        const Icon = t.icon;
        return (
          <Card
            key={t.key}
            shadow="none"
            className={`border ${isError ? "border-danger bg-danger-50" : "border-default bg-white"}`}
          >
            <CardBody className="gap-1">
              <div className="flex items-center gap-2">
                <Icon
                  size={14}
                  className={isError ? "text-danger" : "text-default-500"}
                />
                <p className="text-xs text-default-500">{t.label}</p>
              </div>
              {isError ? (
                <p className="text-xs text-danger">{val}</p>
              ) : (
                <p className="text-2xl font-bold">
                  {typeof val === "number" ? val.toLocaleString("th-TH") : val ?? "-"}
                </p>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

function BciImportSection() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/bci/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">นำเข้าจากไฟล์ (BCI Export)</h2>
          <p className="text-sm text-default-500">
            อัปโหลดไฟล์ Excel/CSV ที่ export จาก BCI LeadManager
          </p>
        </div>
        <Button
          as="label"
          color="primary"
          variant="bordered"
          size="md"
          radius="md"
          startContent={
            importing ? <Spinner size="sm" /> : <Upload size={16} />
          }
          isDisabled={importing}
          className="cursor-pointer"
        >
          {importing ? "กำลังนำเข้า..." : "เลือกไฟล์"}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </Button>
      </div>

      {fileName && !importing && !error && !result && (
        <div className="flex items-center gap-2 text-sm text-default-500">
          <FileSpreadsheet size={14} />
          <span>{fileName}</span>
        </div>
      )}

      {error && (
        <Card shadow="none" className="border-2 border-danger bg-danger-50">
          <CardBody className="flex-row items-center gap-2">
            <XCircle size={18} className="text-danger shrink-0" />
            <span className="text-danger font-medium text-sm">{error}</span>
          </CardBody>
        </Card>
      )}

      {result?.success && (
        <Card shadow="none" className="border-2 border-success bg-success-50">
          <CardHeader className="flex-row items-center gap-2 pb-0">
            <CheckCircle2 size={18} className="text-success" />
            <span className="font-semibold text-success">นำเข้าสำเร็จ!</span>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card shadow="none" className="border border-default bg-white">
                <CardBody className="gap-1">
                  <p className="text-xs text-default-500">แถวทั้งหมด</p>
                  <p className="text-2xl font-bold">{result.results.totalRows?.toLocaleString("th-TH")}</p>
                </CardBody>
              </Card>
              <Card shadow="none" className="border border-default bg-white">
                <CardBody className="gap-1">
                  <p className="text-xs text-default-500">นำเข้าแล้ว</p>
                  <p className="text-2xl font-bold">{result.results.imported?.toLocaleString("th-TH")}</p>
                </CardBody>
              </Card>
              <Card shadow="none" className="border border-default bg-white">
                <CardBody className="gap-1">
                  <p className="text-xs text-default-500">Column ที่ map ได้</p>
                  <p className="text-2xl font-bold">{result.results.columnsMapped}</p>
                </CardBody>
              </Card>
              <Card shadow="none" className="border border-default bg-white">
                <CardBody className="gap-1">
                  <p className="text-xs text-default-500">ข้ามไป</p>
                  <p className="text-2xl font-bold">{result.results.skipped}</p>
                </CardBody>
              </Card>
            </div>
            {result.results.unmapped?.length > 0 && (
              <p className="text-xs text-default-400 mt-2">
                Column ที่ไม่รู้จัก: {result.results.unmapped.join(", ")}
              </p>
            )}
            {result.results.errors?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-warning font-medium">ข้อผิดพลาดบางส่วน:</p>
                <ul className="text-xs text-default-500 list-disc pl-5">
                  {result.results.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Card shadow="none" className="bg-default-50 border border-default">
        <CardBody className="gap-1">
          <ul className="text-sm text-default-500 list-disc pl-5 space-y-1">
            <li>รองรับ .xlsx, .xls, .csv</li>
            <li>ต้องมีคอลัมน์ Project ID (จำเป็น)</li>
            <li>ระบบจะ auto-map ชื่อคอลัมน์จากไฟล์ BCI export</li>
            <li>ข้อมูลซ้ำ (Project ID เดิม) จะถูก update ทับ</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function BcSyncSection() {
  const [syncingAll, setSyncingAll] = useState(false);
  const [allResult, setAllResult] = useState(null);
  const [allError, setAllError] = useState(null);
  const [phases, setPhases] = useState({});
  const [lastSync, setLastSync] = useState(null);
  const abortRef = useRef(null);

  const handleSyncAll = useCallback(async () => {
    setSyncingAll(true);
    setAllError(null);
    setAllResult(null);
    setPhases({});

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/sync/bc?stream=1", {
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Sync failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = null;
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === "progress") {
                setPhases((prev) => ({
                  ...prev,
                  [data.phase]: data,
                }));
              } else if (currentEvent === "done") {
                setAllResult(data);
                setLastSync(new Date().toLocaleString("th-TH"));
              } else if (currentEvent === "error") {
                setAllError(data.message);
              }
            } catch {}
            currentEvent = null;
          }
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setAllError(e.message);
      }
    } finally {
      setSyncingAll(false);
      abortRef.current = null;
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Business Central (BC)</h2>
          <p className="text-sm text-default-500">ดึงข้อมูลลูกค้า สินค้า และคำสั่งซื้อจาก BC</p>
        </div>
        <Button
          variant="bordered"
          size="md"
          radius="md"
          startContent={syncingAll ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          onPress={handleSyncAll}
          isDisabled={syncingAll}
        >
          {syncingAll ? "กำลังซิงค์..." : "ซิงค์ทั้งหมด"}
        </Button>
      </div>

      {lastSync && (
        <div className="flex items-center gap-2 text-sm text-default-500">
          <Clock size={14} />
          <span>ซิงค์ล่าสุด: {lastSync}</span>
        </div>
      )}

      {/* Progress panel */}
      {syncingAll && <SyncProgressPanel phases={phases} />}

      {allError && (
        <Card shadow="none" className="border-2 border-danger bg-danger-50">
          <CardBody className="flex-row items-center gap-2">
            <XCircle size={18} className="text-danger" />
            <span className="text-danger font-medium">{allError}</span>
          </CardBody>
        </Card>
      )}

      {allResult && (
        <Card shadow="none" className="border-2 border-success bg-success-50">
          <CardHeader className="flex-row items-center gap-2 pb-0">
            <CheckCircle2 size={18} className="text-success" />
            <span className="font-semibold text-success">ซิงค์ทั้งหมดสำเร็จ!</span>
          </CardHeader>
          <CardBody>
            <ResultCards tables={BC_TABLES} results={allResult.results} />
          </CardBody>
        </Card>
      )}

      <Card shadow="none" className="bg-default-50 border border-default">
        <CardBody className="gap-1">
          <ul className="text-sm text-default-500 list-disc pl-5 space-y-1">
            <li>Dimensions — dimensionValues จาก BC API v2.0 (code → ชื่อโครงการ)</li>
            <li>Customers — ข้อมูลลูกค้าจาก CustomerList</li>
            <li>Items — สินค้าทั้งหมด + map projectCode/projectName</li>
            <li>Sales Orders — คำสั่งซื้อ SO26*</li>
            <li>SO Lines — รายการสินค้าในคำสั่งซื้อ</li>
            <li>Item Ledger Entries — รายการเคลื่อนไหวสินค้า (รับ/จ่าย/โอน/ผลิต)</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

export default function SyncPage() {
  return (
    <div className="flex flex-col w-full h-full gap-4">
      <h1 className="text-lg font-semibold">ซิงค์ข้อมูล</h1>

      <BcSyncSection />

      <Divider />

      {/* BCI Import from file */}
      <BciImportSection />

      <p className="text-xs text-default-400">
        Production: ซิงค์อัตโนมัติผ่าน Vercel Cron
      </p>
    </div>
  );
}
