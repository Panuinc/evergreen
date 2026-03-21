"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGuard moduleId="settings">{children}</PermissionGuard>;
}
