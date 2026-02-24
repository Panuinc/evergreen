"use client";

import { useCallback } from "react";
import { Chip } from "@heroui/react";
import { useAccessLogs } from "@/hooks/rbac/useAccessLogs";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "เวลา", uid: "accessLogCreatedAt", sortable: true },
  { name: "รหัสผู้ใช้", uid: "accessLogUserId", sortable: true },
  { name: "ทรัพยากร", uid: "accessLogResource", sortable: true },
  { name: "การดำเนินการ", uid: "accessLogAction", sortable: true },
  { name: "สถานะ", uid: "accessLogGranted", sortable: true },
];

const STATUS_OPTIONS = [
  { name: "อนุญาต", uid: "granted" },
  { name: "ปฏิเสธ", uid: "denied" },
];

export default function AccessLogsPage() {
  const { logs, loading } = useAccessLogs();

  const renderCell = useCallback((log, columnKey) => {
    switch (columnKey) {
      case "accessLogCreatedAt":
        return (
          <span className="text-default-500">
            {new Date(log.accessLogCreatedAt).toLocaleString()}
          </span>
        );
      case "accessLogUserId":
        return (
          <span className="font-mono">
            {log.accessLogUserId?.slice(0, 8) || "-"}
          </span>
        );
      case "accessLogResource":
        return <span className="font-medium">{log.accessLogResource}</span>;
      case "accessLogAction":
        return log.accessLogAction;
      case "accessLogGranted":
        return (
          <Chip
            variant="bordered"
            size="md"
            radius="md"
            color={log.accessLogGranted ? "success" : "danger"}
          >
            {log.accessLogGranted ? "อนุญาต" : "ปฏิเสธ"}
          </Chip>
        );
      default:
        return log[columnKey] || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg font-semibold">บันทึกการเข้าถึง</h1>
        <p className="text-default-400">200 รายการล่าสุด</p>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        renderCell={renderCell}
        rowKey="accessLogId"
        isLoading={loading}
        initialVisibleColumns={["accessLogCreatedAt", "accessLogUserId", "accessLogResource", "accessLogAction", "accessLogGranted"]}
        searchPlaceholder="ค้นหาบันทึก..."
        searchKeys={["accessLogUserId", "accessLogResource", "accessLogAction"]}
        emptyContent="ไม่พบบันทึกการเข้าถึง"
        defaultRowsPerPage={20}
      />
    </div>
  );
}
