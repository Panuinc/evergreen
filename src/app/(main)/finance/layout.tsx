"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGuard moduleId="finance">{children}</PermissionGuard>;
}
