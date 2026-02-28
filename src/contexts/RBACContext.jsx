"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPermissions } from "@/modules/rbac/actions";

const RBACContext = createContext({});

export function RBACProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [permissions, setPermissions] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [rbacLoading, setRbacLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setPermissions([]);
      setIsSuperAdmin(false);
      return;
    }

    setRbacLoading(true);

    const loadPermissions = async () => {
      try {
        const data = await getUserPermissions(userId);
        const permStrings = data
          .map((d) => d.permission)
          .filter((p) => p !== "__superadmin__");
        const superAdmin = data.some((d) => d.isSuperadmin);
        setPermissions(permStrings);
        setIsSuperAdmin(superAdmin);
      } catch (error) {
        console.error("Failed to load permissions:", error);
        setPermissions([]);
        setIsSuperAdmin(false);
      } finally {
        setRbacLoading(false);
      }
    };

    loadPermissions();
  }, [userId]);

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

  const reloadPermissions = useCallback(async () => {
    if (!user) return;
    setRbacLoading(true);
    try {
      const data = await getUserPermissions(user.id);
      const permStrings = data
        .map((d) => d.permission)
        .filter((p) => p !== "__superadmin__");
      const superAdmin = data.some((d) => d.isSuperadmin);
      setPermissions(permStrings);
      setIsSuperAdmin(superAdmin);
    } catch (error) {
      console.error("Failed to reload permissions:", error);
    } finally {
      setRbacLoading(false);
    }
  }, [user]);

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
