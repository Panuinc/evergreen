import { api } from "@/lib/api.server";
import RbacActionsClient from "@/modules/rbac/rbacActionsClient";
import type { RbacAction } from "@/modules/rbac/types";

export default async function ActionsPage() {
  const actions = await api("/api/rbac/actions");

  return <RbacActionsClient initialActions={(actions || []) as RbacAction[]} />;
}
