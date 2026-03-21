import { api } from "@/lib/api.server";
import ResourcesClient from "@/modules/rbac/resourcesClient";

export default async function ResourcesPage() {
  const resources = await api("/api/rbac/resources");

  return <ResourcesClient initialResources={resources || []} />;
}
