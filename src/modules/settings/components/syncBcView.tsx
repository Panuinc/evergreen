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
} from "@/modules/settings/types";

// Phase label map for display names
const phaseLabels: Record<string, string> = {
  dimensionValues: "Dimension Values",
  customers: "Customers",
  items: "Items",
  vendors: "Vendors",
  "items-rfid": "RFID Codes",
  salesOrders: "Sales Orders",
  "salesOrders-lines": "Sales Order Lines",
  purchaseOrders: "Purchase Orders",
  "purchaseOrders-lines": "Purchase Order Lines",
  salesInvoices: "Sales Invoices",
  "salesInvoices-lines": "Sales Invoice Lines",
  productionOrders: "Production Orders",
  "productionOrders-lines": "Production Order Lines",
  salesQuotes: "Sales Quotes",
  "salesQuotes-lines": "Sales Quote Lines",
  glAccounts: "GL Accounts",
  bankAccounts: "Bank Accounts",
  fixedAssets: "Fixed Assets",
  dimensionSetEntries: "Dimension Set Entries",
  postedSalesInvoices: "Posted Sales Invoices",
  "postedSalesInvoices-lines": "Posted Sales Invoice Lines",
  postedSalesShipments: "Posted Sales Shipments",
  "postedSalesShipments-lines": "Posted Sales Shipment Lines",
  postedSalesCreditMemos: "Posted Sales Credit Memos",
  "postedSalesCreditMemos-lines": "Posted Sales Credit Memo Lines",
  postedPurchInvoices: "Posted Purchase Invoices",
  "postedPurchInvoices-lines": "Posted Purchase Invoice Lines",
  itemLedgerEntries: "Item Ledger Entries",
  valueEntries: "Value Entries",
  gLEntries: "GL Entries",
  customerLedgerEntries: "Customer Ledger Entries",
  vendorLedgerEntries: "Vendor Ledger Entries",
  detailedCustLedgerEntries: "Detailed Cust. Ledger Entries",
  detailedVendorLedgerEntries: "Detailed Vendor Ledger Entries",
  bankAccountLedgerEntries: "Bank Account Ledger Entries",
  faLedgerEntries: "FA Ledger Entries",
  truncate: "Clear Tables",
  master: "Master Data",
  small: "Small Master",
  document: "Documents",
  postedDoc: "Posted Documents",
  "ledger-large": "Large Ledger Entries",
  "ledger-small": "Small Ledger Entries",
  incremental: "Incremental Changes",
  complete: "Complete",
};

// Phases that are "group headers" — show differently
const groupPhases = new Set(["master", "small", "document", "postedDoc", "ledger-large", "ledger-small", "incremental", "truncate"]);

function StepBadge({ step }: { step: string }) {
  if (step === "done") return <span className="text-xs text-success">✓</span>;
  if (step === "error") return <span className="text-xs text-danger">✗</span>;
  if (step === "fetching") return <span className="text-xs text-primary">Fetching</span>;
  if (step === "transforming") return <span className="text-xs text-primary">Processing</span>;
  if (step === "saving") return <span className="text-xs text-warning">Saving</span>;
  if (step === "assigning") return <span className="text-xs text-primary">Assigning</span>;
  if (step === "truncating") return <span className="text-xs text-danger">Clearing</span>;
  if (step === "starting") return <span className="text-xs text-muted-foreground">Starting</span>;
  return <span className="text-xs text-muted-foreground">{step}</span>;
}

function SyncProgressPanel({ phases, phaseOrder }: SyncProgressPanelProps) {
  if (phaseOrder.length === 0) return null;

  // Count entity phases only (not group headers) for progress %
  const entityPhases = phaseOrder.filter((p) => !groupPhases.has(p) && p !== "complete");
  const doneCount = entityPhases.filter(
    (p) => phases[p]?.step === "done" || phases[p]?.step === "error"
  ).length;
  const overallPct = entityPhases.length > 0
    ? Math.round((doneCount / entityPhases.length) * 100)
    : 0;

  return (
    <Card shadow="none" className="border border-primary/30 bg-primary-50/20">
      <CardBody className="gap-3 p-3">
        {/* Header + overall progress */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">
            {doneCount}/{entityPhases.length} entities
          </span>
          <span className="text-xs text-muted-foreground">{overallPct}%</span>
        </div>
        <Progress
          aria-label="Overall sync progress"
          value={overallPct}
          color="primary"
          size="sm"
          className="w-full"
        />

        {/* Phase list — scrollable */}
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
          {phaseOrder.map((key) => {
            const p = phases[key];
            if (!p) return null;
            const isGroup = groupPhases.has(key);
            const isActive = p.step !== "done" && p.step !== "error" && p.step !== "starting";
            const label = phaseLabels[key] ?? key;

            if (isGroup) {
              return (
                <div key={key} className="flex items-center gap-1 mt-2 mb-0.5">
                  <div className="h-px flex-1 bg-divider" />
                  <span className="text-xs text-muted-foreground px-1">{label}</span>
                  <div className="h-px flex-1 bg-divider" />
                </div>
              );
            }

            return (
              <div key={key} className="flex items-center gap-2 py-0.5">
                {/* Step icon */}
                <div className="shrink-0 w-4 flex justify-center">
                  {p.step === "done" ? (
                    <CheckCircle2 size={13} className="text-success" />
                  ) : p.step === "error" ? (
                    <XCircle size={13} className="text-danger" />
                  ) : isActive ? (
                    <Loader2 size={13} className="text-primary animate-spin" />
                  ) : (
                    <Clock size={13} className="text-muted-foreground" />
                  )}
                </div>
                {/* Label */}
                <span className={`text-xs flex-1 truncate ${p.step === "error" ? "text-danger" : ""}`}>
                  {label}
                </span>
                {/* Right side: step badge or count */}
                {p.step === "done" && p.count != null ? (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {p.count.toLocaleString("th-TH")}
                  </span>
                ) : p.step === "error" ? (
                  <span className="text-xs text-danger shrink-0 max-w-32 truncate" title={p.label}>
                    Error
                  </span>
                ) : isActive ? (
                  <StepBadge step={p.step} />
                ) : null}
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}


// Groups for result display
const resultGroups: Array<{ label: string; keys: string[] }> = [
  {
    label: "Master Data",
    keys: ["customers", "items", "vendors"],
  },
  {
    label: "Documents",
    keys: ["salesOrders", "purchaseOrders", "salesInvoices", "productionOrders", "salesQuotes"],
  },
  {
    label: "Small Master",
    keys: ["glAccounts", "bankAccounts", "fixedAssets", "dimensionSetEntries"],
  },
  {
    label: "Posted Documents",
    keys: ["postedSalesInvoices", "postedSalesShipments", "postedSalesCreditMemos", "postedPurchInvoices"],
  },
  {
    label: "Ledger Entries",
    keys: ["itemLedgerEntries", "valueEntries", "gLEntries", "customerLedgerEntries", "vendorLedgerEntries",
      "detailedCustLedgerEntries", "detailedVendorLedgerEntries", "bankAccountLedgerEntries", "faLedgerEntries"],
  },
];

interface EntityResult {
  count?: number;
  lines?: number;
}

function ResultCards({ results }: { results: Record<string, unknown> | null | undefined }) {
  if (!results) return null;

  return (
    <div className="flex flex-col gap-3">
      {resultGroups.map((group) => {
        // Only show group if at least one key has data
        const entries = group.keys
          .map((key) => ({ key, val: results[key] as EntityResult | undefined }))
          .filter((e) => e.val != null);
        if (entries.length === 0) return null;

        return (
          <div key={group.label} className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">{group.label}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {entries.map(({ key, val }) => {
                const label = phaseLabels[key] ?? key;
                const count = val?.count ?? 0;
                const lines = val?.lines;
                return (
                  <Card key={key} shadow="none" className="border border-border bg-content1">
                    <CardBody className="gap-0.5 p-2">
                      <p className="text-xs text-muted-foreground truncate">{label}</p>
                      <p className="text-xs font-medium">
                        {count.toLocaleString("th-TH")}
                        {lines != null && lines > 0 && (
                          <span className="text-muted-foreground font-normal">
                            {" "}+{lines.toLocaleString("th-TH")} lines
                          </span>
                        )}
                      </p>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
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
  phaseOrder,
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

      {isSyncing && phaseOrder.length === 0 && (
        <Card shadow="none" className="border border-primary/30 bg-primary-50/20">
          <CardBody className="flex-row items-center gap-2">
            <Loader2 size={16} className="text-primary animate-spin shrink-0" />
            <span className="text-xs text-muted-foreground">กำลังเชื่อมต่อ BC...</span>
          </CardBody>
        </Card>
      )}
      {isSyncing && phaseOrder.length > 0 && (
        <SyncProgressPanel phases={phases} phaseOrder={phaseOrder} />
      )}

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
            <ResultCards results={allResult.results} />
          </CardBody>
        </Card>
      )}

      <Card shadow="none" className="bg-default-50 border border-border">
        <CardBody className="gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground font-light">Master Data (Incremental + Full)</p>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              <li>Dimension Values — PROJECT code → ชื่อโครงการ (memory map เท่านั้น ไม่บันทึก Supabase)</li>
              <li>Customers → bcCustomer</li>
              <li>Items → bcItem (ราคา ต้นทุน คงเหลือ) + auto-assign RFID code</li>
              <li>Vendors → bcVendor</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground font-light">Documents (Incremental + Full)</p>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              <li>Sales Orders + Lines → bcSalesOrder, bcSalesOrderLine</li>
              <li>Purchase Orders + Lines → bcPurchaseOrder, bcPurchaseOrderLine</li>
              <li>Sales Invoices + Lines → bcSalesInvoice, bcSalesInvoiceLine</li>
              <li>Production Orders + Lines → bcProductionOrder, bcProductionOrderLine</li>
              <li>Sales Quotes + Lines → bcSalesQuote, bcSalesQuoteLine</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground font-light">Small Master (Full Sync เท่านั้น)</p>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              <li>GL Accounts → bcGLAccount</li>
              <li>Bank Accounts → bcBankAccount</li>
              <li>Fixed Assets → bcFixedAsset</li>
              <li>Dimension Set Entries → bcDimensionSetEntry</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground font-light">Posted Documents (Full Sync เท่านั้น)</p>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              <li>Posted Sales Invoices + Lines → bcPostedSalesInvoice</li>
              <li>Posted Sales Shipments + Lines → bcPostedSalesShipment</li>
              <li>Posted Sales Credit Memos + Lines → bcPostedSalesCreditMemo</li>
              <li>Posted Purchase Invoices + Lines → bcPostedPurchInvoice</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground font-light">Ledger Entries (Incremental + Full)</p>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              <li>Item Ledger Entries → bcItemLedgerEntry</li>
              <li>Value Entries → bcValueEntry</li>
              <li>GL Entries → bcGLEntry</li>
              <li>Customer Ledger Entries → bcCustomerLedgerEntry</li>
              <li>Vendor Ledger Entries → bcVendorLedgerEntry</li>
              <li>Detailed Customer Ledger Entries → bcDetailedCustLedgerEntry</li>
              <li>Detailed Vendor Ledger Entries → bcDetailedVendorLedgerEntry</li>
              <li>Bank Account Ledger Entries → bcBankAccountLedgerEntry</li>
              <li>FA Ledger Entries → bcFALedgerEntry</li>
            </ul>
          </div>
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
  phaseOrder,
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
        phaseOrder={phaseOrder}
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
