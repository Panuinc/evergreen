"use client";

import { useAccessLogs } from "@/hooks/rbac/useAccessLogs";
import AccessLogsView from "@/components/rbac/AccessLogsView";

export default function AccessLogsPage() {
  const { logs, loading } = useAccessLogs();

  return <AccessLogsView logs={logs} loading={loading} />;
}
