"use client";

import PermissionGuard from "@/components/guards/PermissionGuard";

export default function SettingsLayout({ children }) {
  return <PermissionGuard moduleId="settings">{children}</PermissionGuard>;
}
