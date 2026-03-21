import { api } from "@/lib/api.server";
import AccessLogsView from "@/modules/rbac/components/accessLogsView";
import type { RbacAccessLog } from "@/modules/rbac/types";

export default async function AccessLogsPage() {
  const logs = await api("/api/rbac/accessLogs");

  return <AccessLogsView logs={(logs || []) as RbacAccessLog[]} loading={false} />;
}
