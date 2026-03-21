"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function ITLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGuard moduleId="it">{children}</PermissionGuard>;
}
