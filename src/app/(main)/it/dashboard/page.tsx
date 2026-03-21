import { api } from "@/lib/api.server";
import ItDashboardClient from "@/modules/it/itDashboardClient";
import type { ItDashboardStats } from "@/modules/it/types";

export default async function ITDashboardPage() {
  const stats = await api<ItDashboardStats>("/api/it/dashboard");

  return <ItDashboardClient initialStats={stats} />;
}
