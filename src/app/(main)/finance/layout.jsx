"use client";

import PermissionGuard from "@/components/guards/PermissionGuard";

export default function FinanceLayout({ children }) {
  return <PermissionGuard moduleId="finance">{children}</PermissionGuard>;
}
