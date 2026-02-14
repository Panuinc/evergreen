"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
} from "@heroui/react";
import { toast } from "sonner";
import { getAccessLogs } from "@/actions/rbac";

export default function AccessLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getAccessLogs();
      setLogs(data);
    } catch (error) {
      toast.error("Failed to load access logs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg font-semibold">Access Logs</h1>
        <p className="text-default-400">Last 200 entries</p>
      </div>

      <Table aria-label="Access logs table">
        <TableHeader>
          <TableColumn>Timestamp</TableColumn>
          <TableColumn>User ID</TableColumn>
          <TableColumn>Resource</TableColumn>
          <TableColumn>Action</TableColumn>
          <TableColumn>Status</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={loading}
          loadingContent={<Spinner size="sm" />}
          emptyContent="No access logs found"
        >
          {logs.map((log) => (
            <TableRow key={log.accessLogId}>
              <TableCell className="text-default-500">
                {new Date(log.accessLogCreatedAt).toLocaleString()}
              </TableCell>
              <TableCell className="font-mono">
                {log.accessLogUserId?.slice(0, 8) || "-"}
              </TableCell>
              <TableCell className="font-medium">{log.accessLogResource}</TableCell>
              <TableCell>{log.accessLogAction}</TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  color={log.accessLogGranted ? "success" : "danger"}
                >
                  {log.accessLogGranted ? "Granted" : "Denied"}
                </Chip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
