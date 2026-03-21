import { api } from "@/lib/api.server";
import ProdDashboardClient from "@/modules/production/prodDashboardClient";
import type { DashboardResponse } from "@/modules/production/types";

export default async function ProductionDashboardPage() {
  const data = await api<DashboardResponse>("/api/production/dashboard");

  return <ProdDashboardClient initialData={data} />;
}
