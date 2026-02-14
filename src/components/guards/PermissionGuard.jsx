"use client";

import { useEffect, useRef } from "react";
import { useRBAC } from "@/contexts/RBACContext";
import { useAuth } from "@/contexts/AuthContext";
import { logAccess } from "@/actions/rbac";
import Loading from "@/components/ui/Loading";
import Forbidden from "@/app/forbidden";

export default function PermissionGuard({ permission, moduleId, children }) {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, hasModuleAccess, rbacLoading } = useRBAC();
  const loggedRef = useRef(null);

  const isLoading = authLoading || rbacLoading;

  const hasAccess = permission
    ? hasPermission(permission)
    : moduleId
      ? hasModuleAccess(moduleId)
      : true;

  const resource = permission || moduleId || "unknown";

  useEffect(() => {
    if (isLoading || !user) return;

    const logKey = `${user.id}:${resource}:${hasAccess}`;
    if (loggedRef.current === logKey) return;
    loggedRef.current = logKey;

    logAccess(user.id, resource, "access", hasAccess);
  }, [isLoading, user, resource, hasAccess]);

  if (isLoading) {
    return <Loading />;
  }

  if (!hasAccess) {
    return <Forbidden />;
  }

  return children;
}
