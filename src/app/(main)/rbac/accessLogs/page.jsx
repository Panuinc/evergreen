"use client";

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
import { useAccessLogs } from "@/hooks/use-access-logs";

export default function AccessLogsPage() {
  const { logs, loading } = useAccessLogs();

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
          loadingContent={<Spinner />}
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
              <TableCell className="font-medium">
                {log.accessLogResource}
              </TableCell>
              <TableCell>{log.accessLogAction}</TableCell>
              <TableCell>
                <Chip
                  variant="bordered"
                  size="md"
                  radius="md"
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
