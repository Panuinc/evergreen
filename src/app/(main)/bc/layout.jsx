"use client";

import PermissionGuard from "@/components/guards/PermissionGuard";

export default function BCLayout({ children }) {
  return <PermissionGuard moduleId="bc">{children}</PermissionGuard>;
}
