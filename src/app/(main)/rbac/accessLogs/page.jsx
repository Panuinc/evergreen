"use client";

import { useCallback } from "react";
import { Chip } from "@heroui/react";
import { useAccessLogs } from "@/hooks/useAccessLogs";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Timestamp", uid: "accessLogCreatedAt", sortable: true },
  { name: "User ID", uid: "accessLogUserId", sortable: true },
  { name: "Resource", uid: "accessLogResource", sortable: true },
  { name: "Action", uid: "accessLogAction", sortable: true },
  { name: "Status", uid: "accessLogGranted", sortable: true },
];

const STATUS_OPTIONS = [
  { name: "Granted", uid: "granted" },
  { name: "Denied", uid: "denied" },
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
            {log.accessLogGranted ? "Granted" : "Denied"}
          </Chip>
        );
      default:
        return log[columnKey] || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg font-semibold">Access Logs</h1>
        <p className="text-default-400">Last 200 entries</p>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        renderCell={renderCell}
        rowKey="accessLogId"
        isLoading={loading}
        initialVisibleColumns={["accessLogCreatedAt", "accessLogUserId", "accessLogResource", "accessLogAction", "accessLogGranted"]}
        searchPlaceholder="Search logs..."
        searchKeys={["accessLogUserId", "accessLogResource", "accessLogAction"]}
        emptyContent="No access logs found"
        defaultRowsPerPage={20}
      />
    </div>
  );
}
