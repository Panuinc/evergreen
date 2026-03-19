"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function SalesLayout({ children }) {
  return <PermissionGuard moduleId="sales">{children}</PermissionGuard>;
}
