"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function ITLayout({ children }) {
  return <PermissionGuard moduleId="it">{children}</PermissionGuard>;
}
