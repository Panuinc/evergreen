"use client";

import PermissionGuard from "@/components/guards/PermissionGuard";

export default function SalesLayout({ children }) {
  return <PermissionGuard moduleId="sales">{children}</PermissionGuard>;
}
