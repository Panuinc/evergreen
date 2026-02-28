"use client";

import { useAccessLogs } from "@/modules/rbac/hooks/useAccessLogs";
import AccessLogsView from "@/modules/rbac/components/AccessLogsView";

export default function AccessLogsPage() {
  const { logs, loading } = useAccessLogs();

  return <AccessLogsView logs={logs} loading={loading} />;
}
