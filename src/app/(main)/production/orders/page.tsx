import { api } from "@/lib/api.server";
import ProdOrdersClient from "@/modules/production/prodOrdersClient";

export default async function ProductionOrdersPage() {
  const data = await api("/api/production/orders");

  return <ProdOrdersClient initialData={data || []} />;
}
