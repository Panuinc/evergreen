"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function FinanceLayout({ children }) {
  return <PermissionGuard moduleId="finance">{children}</PermissionGuard>;
}
