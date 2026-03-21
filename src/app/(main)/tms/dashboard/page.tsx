import { api } from "@/lib/api.server";
import TmsDashboardClient from "@/modules/tms/tmsDashboardClient";
import type { TmsDashboardStats } from "@/modules/tms/types";

export default async function TmsDashboardPage() {
  const stats = await api("/api/tms/dashboard") as TmsDashboardStats | null;

  return <TmsDashboardClient initialStats={stats} />;
}
