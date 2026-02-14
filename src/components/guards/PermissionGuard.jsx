"use client";

import { useRBAC } from "@/contexts/RBACContext";
import { useAuth } from "@/contexts/AuthContext";
import Loading from "@/components/ui/Loading";
import Forbidden from "@/app/forbidden";

export default function PermissionGuard({ permission, moduleId, children }) {
  const { loading: authLoading } = useAuth();
  const { hasPermission, hasModuleAccess, rbacLoading } = useRBAC();

  if (authLoading || rbacLoading) {
    return <Loading />;
  }

  const hasAccess = permission
    ? hasPermission(permission)
    : moduleId
      ? hasModuleAccess(moduleId)
      : true;

  if (!hasAccess) {
    return <Forbidden />;
  }

  return children;
}
