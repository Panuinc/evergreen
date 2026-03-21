"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGuard moduleId="hr">{children}</PermissionGuard>;
}
