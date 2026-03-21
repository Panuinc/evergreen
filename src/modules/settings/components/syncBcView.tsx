"use client";

import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Divider,  Progress,
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
  Factory,
  Upload,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import Loading from "@/components/ui/loading";
import type {
  SyncBcViewProps,
  BcSyncSectionProps,
  BciImportSectionProps,
  SyncProgressPanelProps,
  ResultCardsProps,
} from "@/modules/settings/types";

const bcTables = [
  { key: "dimensionValues", label: "มิติ", icon: FolderKanban },
  { key: "customers", label: "ลูกค้า", icon: Users },
  { key: "items", label: "สินค้า", icon: Package },
  { key: "salesOrders", label: "คำสั่งขาย", icon: ShoppingCart },
  { key: "salesOrderLines", label: "รายการคำสั่งขาย", icon: ClipboardList },
  { key: "production", label: "การผลิต", icon: Factory },
];

const phaseOrder = [
  "dimensionValues",
  "customers",
  "items",
  "salesOrders",
  "salesOrderLines",
  "production",
  "cleanup",
];

function PhaseIcon({ phase, step }: { phase: string; step: string }) {
  const table = bcTables.find((t) => t.key === phase);
  const Icon = table?.icon || FolderKanban;
  const size = 16;

  if (step === "done") return <CheckCircle2 size={size} className="text-success shrink-0" />;
  if (step === "error") return <XCircle size={size} className="text-danger shrink-0" />;
  if (step === "fetching" || step === "saving" || step === "cleaning")
    return <Loader2 size={size} className="text-primary shrink-0 animate-spin" />;
  return <Icon size={size} className="text-muted-foreground shrink-0" />;
}

function SyncProgressPanel({ phases }: SyncProgressPanelProps) {
  const entries = phaseOrder
    .filter((p) => phases[p])
    .map((p) => ({ key: p, ...phases[p] }));

  if (entries.length === 0) return null;

  const totalPhases = phaseOrder.length;
  const donePhases = entries.filter((e) => e.step === "done" || e.step === "error").length;
  const overallPct = Math.round((donePhases / totalPhases) * 100);

  return (
    <Card shadow="none" className="border-2 border-primary bg-primary-50/30">
      <CardBody className="gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-light">ความคืบหน้า</span>
          <span className="text-xs text-muted-foreground">{overallPct}%</span>
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
              <span className="text-xs flex-1">{e.label}</span>
              {e.step === "saving" && e.done != null && e.total != null && (
                <div className="w-32">
                  <Progress
                    aria-label={`${e.key} progress`}
                    value={Math.round((e.done / e.total) * 100)}
                    color="primary"
                    size="md"
                  />
                </div>
              )}
              {e.step === "done" && e.count != null && (
                <span className="text-xs text-success font-light">
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

function ResultCards({ tables, results }: ResultCardsProps) {
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
            className={`border ${isError ? "border-danger bg-danger-50" : "border-border bg-content1"}`}
          >
            <CardBody className="gap-1">
              <div className="flex items-center gap-2">
                <Icon

                  className={isError ? "text-danger" : "text-muted-foreground"}
                />
                <p className="text-xs text-muted-foreground">{t.label}</p>
              </div>
              {isError ? (
                <p className="text-xs text-danger">{val}</p>
              ) : (
                <p className="text-xs font-light">
                  {typeof val === "number"
                    ? val.toLocaleString("th-TH")
                    : typeof val === "object" && val !== null
                      ? Object.entries(val).map(([k, v]) => `${k}: ${Number(v).toLocaleString("th-TH")}`).join(" / ")
                      : (val as string | undefined) ?? "-"}
                </p>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

function BciImportSection({ importing, result, error, fileName, handleFileChange }: BciImportSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-light">นำเข้าจากไฟล์ (BCI Export)</p>
          <p className="text-xs text-muted-foreground">
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
            importing ? <Loading /> : <Upload />
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileSpreadsheet />
          <span>{fileName}</span>
        </div>
      )}

      {error && (
        <Card shadow="none" className="border-2 border-danger bg-danger-50">
          <CardBody className="flex-row items-center gap-2">
            <XCircle className="text-danger shrink-0" />
            <span className="text-danger font-light text-xs">{error}</span>
          </CardBody>
        </Card>
      )}

      {result?.success && (
        <Card shadow="none" className="border-2 border-success bg-success-50">
          <CardHeader className="flex-row items-center gap-2 pb-0">
            <CheckCircle2 className="text-success" />
            <span className="font-light text-success">นำเข้าสำเร็จ!</span>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card shadow="none" className="border border-border bg-content1">
                <CardBody className="gap-1">
                  <p className="text-xs text-muted-foreground">แถวทั้งหมด</p>
                  <p className="text-xs font-light">{result.results.totalRows?.toLocaleString("th-TH")}</p>
                </CardBody>
              </Card>
              <Card shadow="none" className="border border-border bg-content1">
                <CardBody className="gap-1">
                  <p className="text-xs text-muted-foreground">นำเข้าแล้ว</p>
                  <p className="text-xs font-light">{result.results.imported?.toLocaleString("th-TH")}</p>
                </CardBody>
              </Card>
              <Card shadow="none" className="border border-border bg-content1">
                <CardBody className="gap-1">
                  <p className="text-xs text-muted-foreground">Column ที่ map ได้</p>
                  <p className="text-xs font-light">{result.results.columnsMapped}</p>
                </CardBody>
              </Card>
              <Card shadow="none" className="border border-border bg-content1">
                <CardBody className="gap-1">
                  <p className="text-xs text-muted-foreground">ข้ามไป</p>
                  <p className="text-xs font-light">{result.results.skipped}</p>
                </CardBody>
              </Card>
            </div>
            {result.results.unmapped?.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Column ที่ไม่รู้จัก: {result.results.unmapped.join(", ")}
              </p>
            )}
            {result.results.errors?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-warning font-light">ข้อผิดพลาดบางส่วน:</p>
                <ul className="text-xs text-muted-foreground list-disc pl-5">
                  {result.results.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Card shadow="none" className="bg-default-50 border border-border">
        <CardBody className="gap-1">
          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
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

function BcSyncSection({
  syncingMode,
  allResult,
  allError,
  phases,
  lastSync,
  handleSync,
}: BcSyncSectionProps) {
  const isSyncing = syncingMode !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-light">Business Central (BC)</p>
          <p className="text-xs text-muted-foreground">ดึงข้อมูลลูกค้า สินค้า และคำสั่งซื้อจาก BC</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="flat"
            size="md"
            radius="md"
            startContent={syncingMode === "incremental" ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            onPress={() => handleSync("incremental")}
            isDisabled={isSyncing}
          >
            {syncingMode === "incremental" ? "กำลังซิงค์..." : "Incremental Sync"}
          </Button>
          <Button
            color="primary"
            variant="bordered"
            size="md"
            radius="md"
            startContent={syncingMode === "full" ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            onPress={() => handleSync("full")}
            isDisabled={isSyncing}
          >
            {syncingMode === "full" ? "กำลังซิงค์..." : "Full Sync"}
          </Button>
        </div>
      </div>

      {lastSync && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock />
          <span>ซิงค์ล่าสุด: {lastSync}</span>
        </div>
      )}

      {isSyncing && <SyncProgressPanel phases={phases} />}

      {allError && (
        <Card shadow="none" className="border-2 border-danger bg-danger-50">
          <CardBody className="flex-row items-center gap-2">
            <XCircle className="text-danger" />
            <span className="text-danger font-light">{allError}</span>
          </CardBody>
        </Card>
      )}

      {allResult && (
        <Card shadow="none" className="border-2 border-success bg-success-50">
          <CardHeader className="flex-row items-center gap-2 pb-0">
            <CheckCircle2 className="text-success" />
            <span className="font-light text-success">ซิงค์ทั้งหมดสำเร็จ!</span>
          </CardHeader>
          <CardBody>
            <ResultCards tables={bcTables} results={allResult.results} />
          </CardBody>
        </Card>
      )}

      <Card shadow="none" className="bg-default-50 border border-border">
        <CardBody className="gap-1">
          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
            <li>Dimensions -- dimensionValues จาก BC API v2.0 (code → ชื่อโครงการ)</li>
            <li>Customers -- ข้อมูลลูกค้าจาก CustomerList</li>
            <li>Items -- สินค้าทั้งหมด + map projectCode/projectName</li>
            <li>Sales Orders -- คำสั่งซื้อตั้งแต่ SO25*</li>
            <li>SO Lines -- รายการสินค้าในคำสั่งซื้อ</li>
            <li>Production -- ใบสั่งผลิต (bcProductionOrders) + Item Ledger Entries (bcItemLedgerEntries)</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

export default function SyncBcView({
  syncingMode,
  allResult,
  allError,
  phases,
  lastSync,
  handleSync,
  importing,
  importResult,
  importError,
  importFileName,
  handleFileChange,
}: SyncBcViewProps) {
  return (
    <div className="flex flex-col w-full h-full gap-4">
      <p className="text-xs font-light">ซิงค์ข้อมูล</p>

      <BcSyncSection
        syncingMode={syncingMode}
        allResult={allResult}
        allError={allError}
        phases={phases}
        lastSync={lastSync}
        handleSync={handleSync}
      />

      <Divider />

      {}
      <BciImportSection
        importing={importing}
        result={importResult}
        error={importError}
        fileName={importFileName}
        handleFileChange={handleFileChange}
      />

      <p className="text-xs text-muted-foreground">
        Production: ซิงค์อัตโนมัติผ่าน Vercel Cron
      </p>
    </div>
  );
}
