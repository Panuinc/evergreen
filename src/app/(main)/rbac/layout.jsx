"use client";

import PermissionGuard from "@/components/guards/PermissionGuard";

export default function RBACLayout({ children }) {
  return <PermissionGuard moduleId="rbac">{children}</PermissionGuard>;
}
