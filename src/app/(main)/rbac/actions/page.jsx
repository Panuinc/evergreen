import { api } from "@/lib/api.server";
import RbacActionsClient from "@/modules/rbac/RbacActionsClient";

export default async function ActionsPage() {
  const actions = await api("/api/rbac/actions");

  return <RbacActionsClient initialActions={actions || []} />;
}
