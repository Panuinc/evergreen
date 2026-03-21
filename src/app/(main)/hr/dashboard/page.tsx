import { api } from "@/lib/api.server";
import HrDashboardClient from "@/modules/hr/hrDashboardClient";
import type { HrDashboardResponse } from "@/modules/hr/types";

export default async function HRDashboardPage() {
  const stats = await api("/api/hr/dashboard");

  return <HrDashboardClient initialStats={(stats as HrDashboardResponse) || null} />;
}
