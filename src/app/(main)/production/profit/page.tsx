import { api } from "@/lib/api.server";
import ProfitClient from "@/modules/production/profitClient";
import type { DashboardResponse } from "@/modules/production/types";

export default async function ProductionProfitPage() {
  const data = await api<DashboardResponse>("/api/production/dashboard");

  return <ProfitClient initialData={data} />;
}
