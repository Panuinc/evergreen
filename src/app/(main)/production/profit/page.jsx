import { api } from "@/lib/api.server";
import ProfitClient from "@/modules/production/ProfitClient";

export default async function ProductionProfitPage() {
  const data = await api("/api/production/dashboard");

  return <ProfitClient initialData={data} />;
}
