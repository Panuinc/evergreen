"use client";

import PermissionGuard from "@/components/guards/PermissionGuard";

export default function HRLayout({ children }) {
  return <PermissionGuard moduleId="hr">{children}</PermissionGuard>;
}
