"use client";

import { createContext, useContext, useCallback, useMemo } from "react";
import useSWR from "swr";
import { useAuth } from "@/contexts/authContext";
import { get } from "@/lib/apiClient";
import type { UserPermissionEntry } from "@/modules/rbac/types";

interface RBACContextType {
  permissions: string[];
  isSuperAdmin: boolean;
  rbacLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasModuleAccess: (moduleId: string) => boolean;
  hasAnyPermission: (perms: string[]) => boolean;
  reloadPermissions: () => void;
}

const RBACContext = createContext<RBACContextType>({} as RBACContextType);

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const { data, isLoading, mutate: mutatePermissions } = useSWR<UserPermissionEntry[]>(
    userId ? `/api/rbac/userPermissions/${userId}` : null,
    (url) => get(url),
    {
      onError: (err) => console.error("Failed to load permissions:", err),
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes — matches server-side auth cache TTL
    },
  );

  const rbacLoading = userId ? isLoading : false;

  const permissions = useMemo(
    () => (data ? data.map((d) => d.permission).filter((p) => p !== "__superadmin__") : []),
    [data],
  );

  const isSuperAdmin = useMemo(
    () => (data ? data.some((d) => d.isSuperadmin) : false),
    [data],
  );

  const hasPermission = useCallback(
    (permission) => {
      if (isSuperAdmin) return true;
      return permissions.includes(permission);
    },
    [permissions, isSuperAdmin],
  );

  const hasModuleAccess = useCallback(
    (moduleId) => {
      if (isSuperAdmin) return true;
      return permissions.some((p) => p.startsWith(moduleId + ":"));
    },
    [permissions, isSuperAdmin],
  );

  const hasAnyPermission = useCallback(
    (perms) => {
      if (isSuperAdmin) return true;
      return perms.some((p) => permissions.includes(p));
    },
    [permissions, isSuperAdmin],
  );

  const reloadPermissions = mutatePermissions;

  return (
    <RBACContext.Provider
      value={{
        permissions,
        isSuperAdmin,
        rbacLoading,
        hasPermission,
        hasModuleAccess,
        hasAnyPermission,
        reloadPermissions,
      }}
    >
      {children}
    </RBACContext.Provider>
  );
}

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error("useRBAC must be used within an RBACProvider");
  }
  return context;
};
