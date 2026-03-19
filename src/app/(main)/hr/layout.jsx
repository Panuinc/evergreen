"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function HRLayout({ children }) {
  return <PermissionGuard moduleId="hr">{children}</PermissionGuard>;
}
