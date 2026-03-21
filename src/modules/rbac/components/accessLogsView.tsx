"use client";

import { useCallback } from "react";
import { Chip } from "@heroui/react";
import DataTable from "@/components/ui/dataTable";
import type { AccessLogsViewProps, RbacAccessLog } from "@/modules/rbac/types";

const columns = [
  { name: "เวลา", uid: "rbacAccessLogCreatedAt", sortable: true },
  { name: "รหัสผู้ใช้", uid: "rbacAccessLogUserId", sortable: true },
  { name: "ทรัพยากร", uid: "rbacAccessLogResource", sortable: true },
  { name: "การดำเนินการ", uid: "rbacAccessLogAction", sortable: true },
  { name: "สถานะ", uid: "rbacAccessLogGranted", sortable: true },
];

const initialVisibleColumns = [
  "rbacAccessLogCreatedAt",
  "rbacAccessLogUserId",
  "rbacAccessLogResource",
  "rbacAccessLogAction",
  "rbacAccessLogGranted",
];

export default function AccessLogsView({ logs, loading }: AccessLogsViewProps) {
  const renderCell = useCallback((log: RbacAccessLog, columnKey: string) => {
    switch (columnKey) {
      case "rbacAccessLogCreatedAt":
        return (
          <span className="text-muted-foreground">
            {new Date(log.rbacAccessLogCreatedAt).toLocaleString()}
          </span>
        );
      case "rbacAccessLogUserId":
        return (
          <span className="font-mono">
            {log.rbacAccessLogUserId?.slice(0, 8) || "-"}
          </span>
        );
      case "rbacAccessLogResource":
        return <span className="font-light">{log.rbacAccessLogResource}</span>;
      case "rbacAccessLogAction":
        return log.rbacAccessLogAction;
      case "rbacAccessLogGranted":
        return (
          <Chip
            variant="flat"
            size="md"
            radius="md"
            color={log.rbacAccessLogGranted ? "success" : "danger"}
          >
            {log.rbacAccessLogGranted ? "อนุญาต" : "ปฏิเสธ"}
          </Chip>
        );
      default:
        return (log as unknown as Record<string, string>)[columnKey] || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between w-full">
        <p className="text-xs font-light">บันทึกการเข้าถึง</p>
        <p className="text-muted-foreground">200 รายการล่าสุด</p>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        renderCell={renderCell}
        rowKey="rbacAccessLogId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาบันทึก..."
        searchKeys={["rbacAccessLogUserId", "rbacAccessLogResource", "rbacAccessLogAction"]}
        emptyContent="ไม่พบบันทึกการเข้าถึง"
        defaultRowsPerPage={20}
        enableCardView
      />
    </div>
  );
}
