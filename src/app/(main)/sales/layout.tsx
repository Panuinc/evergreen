"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGuard moduleId="sales">{children}</PermissionGuard>;
}
