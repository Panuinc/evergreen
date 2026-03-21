"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function TMSLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGuard moduleId="logistics">{children}</PermissionGuard>;
}
