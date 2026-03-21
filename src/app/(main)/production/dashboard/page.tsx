import { api } from "@/lib/api.server";
import ProdDashboardClient from "@/modules/production/prodDashboardClient";

export default async function ProductionDashboardPage() {
  const data = await api("/api/production/dashboard");

  return <ProdDashboardClient initialData={data} />;
}
