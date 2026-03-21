import { api } from "@/lib/api.server";
import HrDashboardClient from "@/modules/hr/hrDashboardClient";

export default async function HRDashboardPage() {
  const stats = await api("/api/hr/dashboard");

  return <HrDashboardClient initialStats={stats} />;
}
