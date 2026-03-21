import { api } from "@/lib/api.server";
import ProfitClient from "@/modules/production/profitClient";

export default async function ProductionProfitPage() {
  const data = await api("/api/production/dashboard");

  return <ProfitClient initialData={data} />;
}
