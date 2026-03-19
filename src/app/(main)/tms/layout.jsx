"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function TMSLayout({ children }) {
  return <PermissionGuard moduleId="logistics">{children}</PermissionGuard>;
}
