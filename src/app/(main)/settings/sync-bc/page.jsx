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

export default function SyncPage() {
  return (
    <div className="flex flex-col w-full gap-6">
      <h1 className="text-xl font-bold">ซิงค์ข้อมูล</h1>

      {/* BC Section */}
      <SyncSection
        title="Business Central (BC)"
        desc="ดึงข้อมูลลูกค้า สินค้า และคำสั่งซื้อจาก BC"
        endpoint="/api/sync/bc"
        tables={BC_TABLES}
        infoItems={[
          "Dimensions — dimensionValues จาก BC API v2.0 (code → ชื่อโครงการ)",
          "Customers — ข้อมูลลูกค้าจาก CustomerList",
          "Items — สินค้าทั้งหมด + map projectCode/projectName",
          "Sales Orders — คำสั่งซื้อ SO26*",
          "SO Lines — รายการสินค้าในคำสั่งซื้อ",
        ]}
      />

      <Divider />

      {/* BCI Import from file */}
      <BciImportSection />

      <p className="text-xs text-default-400">
        Production: ซิงค์อัตโนมัติผ่าน Vercel Cron
      </p>
    </div>
  );
}
