"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function RBACLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGuard moduleId="rbac">{children}</PermissionGuard>;
}
