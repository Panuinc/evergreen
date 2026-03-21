import { api } from "@/lib/api.server";
import AccessLogsView from "@/modules/rbac/components/accessLogsView";

export default async function AccessLogsPage() {
  const logs = await api("/api/rbac/accessLogs");

  return <AccessLogsView logs={logs || []} loading={false} />;
}
