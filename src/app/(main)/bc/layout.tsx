"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function BCLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGuard moduleId="bc">{children}</PermissionGuard>;
}
