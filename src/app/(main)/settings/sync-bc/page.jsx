"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Divider,
  Spinner,
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
} from "lucide-react";

/* ── BC Tables ── */
const BC_TABLES = [
  { key: "dimensionValues", label: "มิติ", icon: FolderKanban },
  { key: "customers", label: "ลูกค้า", icon: Users },
  { key: "items", label: "สินค้า", icon: Package },
  { key: "salesOrders", label: "คำสั่งขาย", icon: ShoppingCart },
  { key: "salesOrderLines", label: "รายการคำสั่งขาย", icon: ClipboardList },
];


function ResultCards({ tables, results }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {tables.map((t) => {
        const val = results?.[t.key];
        const errorVal = results?.[t.key.replace("Upserted", "Error").replace("Fetched", "Error")];
        const isError = !!errorVal;
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
                <p className="text-xs text-danger">{errorVal}</p>
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

function SyncSection({ title, desc, endpoint, method = "GET", body, tables, infoItems }) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    setResult(null);

    try {
      const opts = method === "POST"
        ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) }
        : {};
      const res = await fetch(endpoint, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setResult(data);
      setLastSync(new Date().toLocaleString("th-TH"));
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }, [endpoint, method, body]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-sm text-default-500">{desc}</p>
        </div>
        <Button
          color="primary"
          size="md"
          radius="md"
          startContent={
            syncing ? <Spinner size="sm" color="white" /> : <RefreshCw size={16} />
          }
          onPress={handleSync}
          isDisabled={syncing}
        >
          {syncing ? "กำลังซิงค์..." : "ซิงค์เลย"}
        </Button>
      </div>

      {lastSync && (
        <div className="flex items-center gap-2 text-sm text-default-500">
          <Clock size={14} />
          <span>ซิงค์ล่าสุด: {lastSync}</span>
        </div>
      )}

      {error && (
        <Card shadow="none" className="border-2 border-danger bg-danger-50">
          <CardBody className="flex-row items-center gap-2">
            <XCircle size={18} className="text-danger" />
            <span className="text-danger font-medium">{error}</span>
          </CardBody>
        </Card>
      )}

      {result && (
        <Card shadow="none" className="border-2 border-success bg-success-50">
          <CardHeader className="flex-row items-center gap-2 pb-0">
            <CheckCircle2 size={18} className="text-success" />
            <span className="font-semibold text-success">ซิงค์สำเร็จ!</span>
          </CardHeader>
          <CardBody>
            <ResultCards tables={tables} results={result.results} />
          </CardBody>
        </Card>
      )}

      {infoItems && (
        <Card shadow="none" className="bg-default-50 border border-default">
          <CardBody className="gap-1">
            <ul className="text-sm text-default-500 list-disc pl-5 space-y-1">
              {infoItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
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
      // Reset input so same file can be selected again
      e.target.value = "";
    }
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">นำเข้าจากไฟล์ (BCI Export)</h2>
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

function TableSyncButton({ table, onResult }) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    onResult(table.key, null);
    try {
      const res = await fetch(`/api/sync/bc?tables=${table.key}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      onResult(table.key, { ok: true, data });
    } catch (e) {
      onResult(table.key, { ok: false, error: e.message });
    } finally {
      setSyncing(false);
    }
  }, [table.key, onResult]);

  const Icon = table.icon;
  return (
    <Button
      size="md"
      variant="bordered"
      radius="md"
      startContent={syncing ? <Spinner size="sm" /> : <Icon size={14} />}
      onPress={handleSync}
      isDisabled={syncing}
    >
      {table.label}
    </Button>
  );
}

function BcSyncSection() {
  const [syncingAll, setSyncingAll] = useState(false);
  const [allResult, setAllResult] = useState(null);
  const [allError, setAllError] = useState(null);
  const [tableResults, setTableResults] = useState({});
  const [lastSync, setLastSync] = useState(null);

  const handleSyncAll = useCallback(async () => {
    setSyncingAll(true);
    setAllError(null);
    setAllResult(null);
    setTableResults({});
    try {
      const res = await fetch("/api/sync/bc");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setAllResult(data);
      setLastSync(new Date().toLocaleString("th-TH"));
    } catch (e) {
      setAllError(e.message);
    } finally {
      setSyncingAll(false);
    }
  }, []);

  const handleTableResult = useCallback((key, result) => {
    setTableResults((prev) => ({ ...prev, [key]: result }));
    if (result?.ok) setLastSync(new Date().toLocaleString("th-TH"));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Business Central (BC)</h2>
          <p className="text-sm text-default-500">ดึงข้อมูลลูกค้า สินค้า และคำสั่งซื้อจาก BC</p>
        </div>
        <Button
          color="primary"
          size="md"
          radius="md"
          startContent={syncingAll ? <Spinner size="sm" color="white" /> : <RefreshCw size={16} />}
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

      {/* ปุ่มซิงค์แยกแต่ละตาราง */}
      <div className="flex flex-wrap gap-2">
        {BC_TABLES.map((t) => (
          <TableSyncButton key={t.key} table={t} onResult={handleTableResult} />
        ))}
      </div>

      {/* ผลลัพธ์ซิงค์รายตาราง */}
      {Object.keys(tableResults).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {BC_TABLES.map((t) => {
            const r = tableResults[t.key];
            if (!r) return null;
            const Icon = t.icon;
            return (
              <Card key={t.key} shadow="none" className={`border ${r.ok ? "border-success bg-success-50" : "border-danger bg-danger-50"}`}>
                <CardBody className="flex-row items-center gap-2 py-2">
                  {r.ok ? <CheckCircle2 size={16} className="text-success shrink-0" /> : <XCircle size={16} className="text-danger shrink-0" />}
                  <Icon size={14} className="text-default-500 shrink-0" />
                  <span className="text-sm font-medium">{t.label}</span>
                  {r.ok ? (
                    <span className="ml-auto text-sm font-bold">
                      {typeof r.data.results?.[t.key] === "number"
                        ? r.data.results[t.key].toLocaleString("th-TH") + " รายการ"
                        : "สำเร็จ"}
                    </span>
                  ) : (
                    <span className="ml-auto text-sm text-danger">{r.error}</span>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

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
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

export default function SyncPage() {
  return (
    <div className="flex flex-col w-full gap-6">
      <h1 className="text-xl font-bold">ซิงค์ข้อมูล</h1>

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
