import { api } from "@/lib/api.server";
import TmsDashboardClient from "@/modules/tms/TmsDashboardClient";

export default async function TmsDashboardPage() {
  const stats = await api("/api/tms/dashboard");

  return <TmsDashboardClient initialStats={stats} />;
}
