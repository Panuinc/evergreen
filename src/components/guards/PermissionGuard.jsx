"use client";

import { useEffect, useRef } from "react";
import { useRBAC } from "@/contexts/RBACContext";
import { useAuth } from "@/contexts/AuthContext";
import { post } from "@/lib/apiClient";
import Loading from "@/components/ui/Loading";
import Forbidden from "@/app/forbidden";

export default function PermissionGuard({ permission, moduleId, children }) {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, hasModuleAccess, rbacLoading } = useRBAC();
  const loggedRef = useRef(false);

  const isLoading = authLoading || rbacLoading;

  const hasAccess = permission
    ? hasPermission(permission)
    : moduleId
      ? hasModuleAccess(moduleId)
      : true;

  const resource = permission || moduleId || "unknown";

  useEffect(() => {
    if (isLoading || !user || loggedRef.current) return;

    const timer = setTimeout(() => {
      loggedRef.current = true;
      post("/api/rbac/accessLogs", {
        rbacAccessLogUserId: user.id,
        rbacAccessLogResource: resource,
        rbacAccessLogAction: "access",
        rbacAccessLogGranted: hasAccess,
        rbacAccessLogMetadata: null,
      }).catch(() => {});
    }, 300);

    return () => clearTimeout(timer);
  }, [isLoading, user, resource, hasAccess]);

  if (isLoading) {
    return <Loading />;
  }

  if (!hasAccess) {
    return <Forbidden />;
  }

  return children;
}
