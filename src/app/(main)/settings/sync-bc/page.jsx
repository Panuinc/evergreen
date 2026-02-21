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
  Building2,
  Landmark,
} from "lucide-react";

/* ── BC Tables ── */
const BC_TABLES = [
  { key: "dimensionValues", label: "Dimensions", icon: FolderKanban },
  { key: "customers", label: "Customers", icon: Users },
  { key: "items", label: "Items", icon: Package },
  { key: "salesOrders", label: "Sales Orders", icon: ShoppingCart },
  { key: "salesOrderLines", label: "SO Lines", icon: ClipboardList },
];

/* ── BCI Tables ── */
const BCI_TABLES = [
  { key: "totalAvailable", label: "Total Available", icon: Landmark },
  { key: "projectsFetched", label: "Projects Fetched", icon: Landmark },
  { key: "projectsUpserted", label: "Projects Saved", icon: Building2 },
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

function SyncSection({ title, desc, endpoint, tables, infoItems }) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setResult(data);
      setLastSync(new Date().toLocaleString("th-TH"));
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }, [endpoint]);

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
          {syncing ? "กำลัง Sync..." : "Sync Now"}
        </Button>
      </div>

      {lastSync && (
        <div className="flex items-center gap-2 text-sm text-default-500">
          <Clock size={14} />
          <span>Sync ล่าสุด: {lastSync}</span>
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
            <span className="font-semibold text-success">Sync สำเร็จ!</span>
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

export default function SyncPage() {
  return (
    <div className="flex flex-col w-full gap-6">
      <h1 className="text-xl font-bold">Sync ข้อมูล</h1>

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

      {/* BCI Section */}
      <SyncSection
        title="BCI Central (LeadManager)"
        desc="ดึงข้อมูลโครงการก่อสร้าง บริษัท และผู้ติดต่อจาก BCI"
        endpoint="/api/sync/bci"
        tables={BCI_TABLES}
        infoItems={[
          "Projects — โครงการก่อสร้างทั้งหมดในไทย (37,000+ โครงการ)",
          "ข้อมูล: ชื่อ, มูลค่า, สถานะ, ที่ตั้ง, ประเภท, วันเริ่มก่อสร้าง",
          "Login ผ่าน SSO → ดึงข้อมูลจาก API ภายใน (ใช้เวลา 1-2 นาที)",
        ]}
      />

      <p className="text-xs text-default-400">
        Production: Sync อัตโนมัติผ่าน Vercel Cron
      </p>
    </div>
  );
}
