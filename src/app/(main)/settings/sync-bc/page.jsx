"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
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
} from "lucide-react";

const TABLES = [
  { key: "customers", label: "Customers", icon: Users },
  { key: "items", label: "Items", icon: Package },
  { key: "salesOrders", label: "Sales Orders", icon: ShoppingCart },
  { key: "salesOrderLines", label: "Sales Order Lines", icon: ClipboardList },
];

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/sync/bc");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }

      setResult(data);
      setLastSync(new Date().toLocaleString("th-TH"));
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }, []);

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Sync ข้อมูลจาก Business Central</h1>
          <p className="text-sm text-default-500">
            ดึงข้อมูลลูกค้า สินค้า และคำสั่งซื้อจาก BC มาเก็บใน Supabase
          </p>
        </div>
        <Button
          color="primary"
          size="lg"
          startContent={
            syncing ? <Spinner size="sm" color="white" /> : <RefreshCw size={18} />
          }
          onPress={handleSync}
          isDisabled={syncing}
        >
          {syncing ? "กำลัง Sync..." : "Sync Now"}
        </Button>
      </div>

      {/* Last sync */}
      {lastSync && (
        <div className="flex items-center gap-2 text-sm text-default-500">
          <Clock size={14} />
          <span>Sync ล่าสุด: {lastSync}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card shadow="none" className="border-2 border-danger bg-danger-50">
          <CardBody className="flex-row items-center gap-2">
            <XCircle size={18} className="text-danger" />
            <span className="text-danger font-medium">{error}</span>
          </CardBody>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card shadow="none" className="border-2 border-success bg-success-50">
          <CardHeader className="flex-row items-center gap-2 pb-0">
            <CheckCircle2 size={18} className="text-success" />
            <span className="font-semibold text-success">Sync สำเร็จ!</span>
            <Chip size="sm" variant="flat" color="success">
              {result.syncedAt
                ? new Date(result.syncedAt).toLocaleString("th-TH")
                : ""}
            </Chip>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TABLES.map((t) => {
                const val = result.results?.[t.key];
                const isError =
                  typeof val === "string" && val.startsWith("ERROR");
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
                          className={
                            isError ? "text-danger" : "text-default-500"
                          }
                        />
                        <p className="text-xs text-default-500">{t.label}</p>
                      </div>
                      {isError ? (
                        <p className="text-sm text-danger">{val}</p>
                      ) : (
                        <p className="text-2xl font-bold">
                          {typeof val === "number"
                            ? val.toLocaleString("th-TH")
                            : val ?? "-"}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Info */}
      <Divider />
      <Card shadow="none" className="bg-default-50 border-2 border-default">
        <CardBody className="gap-2">
          <p className="font-semibold text-sm">รายละเอียด</p>
          <ul className="text-sm text-default-500 list-disc pl-5 space-y-1">
            <li>
              <strong>Customers</strong> — ข้อมูลลูกค้าจาก CustomerList
            </li>
            <li>
              <strong>Items</strong> — สินค้าทั้งหมดจาก Item_Card_Excel
              (เฉพาะที่ไม่ถูก Block)
            </li>
            <li>
              <strong>Sales Orders</strong> — คำสั่งซื้อ SO26*
            </li>
            <li>
              <strong>Sales Order Lines</strong> — รายการสินค้าในคำสั่งซื้อ
            </li>
          </ul>
          <p className="text-xs text-default-400 mt-2">
            Production: Sync อัตโนมัติทุกชั่วโมงผ่าน Vercel Cron
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
