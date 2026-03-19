import { api } from "@/lib/api.server";
import DevRequestsClient from "@/modules/it/devRequestsClient";

export default async function DevelopmentPage() {
  const [requests, employees] = await Promise.all([
    api("/api/it/devRequests"),
    api("/api/hr/employees"),
  ]);

  return (
    <DevRequestsClient
      initialRequests={requests || []}
      initialEmployees={employees || []}
    />
  );
}
