import { api } from "@/lib/api.server";
import DevRequestsClient from "@/modules/it/devRequestsClient";
import type { ItDevRequest, HrEmployeeBasic } from "@/modules/it/types";

export default async function DevelopmentPage() {
  const [requests, employees] = await Promise.all([
    api<ItDevRequest[]>("/api/it/devRequests"),
    api<HrEmployeeBasic[]>("/api/hr/employees"),
  ]);

  return (
    <DevRequestsClient
      initialRequests={requests || []}
      initialEmployees={employees || []}
    />
  );
}
