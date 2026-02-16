"use client";

import PermissionGuard from "@/components/guards/PermissionGuard";

export default function TMSLayout({ children }) {
  return <PermissionGuard moduleId="logistics">{children}</PermissionGuard>;
}
