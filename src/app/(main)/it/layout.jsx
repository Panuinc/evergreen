"use client";

import PermissionGuard from "@/components/guards/PermissionGuard";

export default function ITLayout({ children }) {
  return <PermissionGuard moduleId="it">{children}</PermissionGuard>;
}
