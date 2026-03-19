"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function RBACLayout({ children }) {
  return <PermissionGuard moduleId="rbac">{children}</PermissionGuard>;
}
