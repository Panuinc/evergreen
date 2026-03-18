import { api } from "@/lib/api.server";
import ItDashboardClient from "@/modules/it/ItDashboardClient";

export default async function ITDashboardPage() {
  const stats = await api("/api/it/dashboard");

  return <ItDashboardClient initialStats={stats} />;
}
