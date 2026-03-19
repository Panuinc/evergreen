"use client";

import PermissionGuard from "@/components/guards/permissionGuard";

export default function SettingsLayout({ children }) {
  return <PermissionGuard moduleId="settings">{children}</PermissionGuard>;
}
