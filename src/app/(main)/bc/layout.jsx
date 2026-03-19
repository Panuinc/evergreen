"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function BCLayout({ children }) {
  return <PermissionGuard moduleId="bc">{children}</PermissionGuard>;
}
