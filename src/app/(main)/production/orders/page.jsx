import { api } from "@/lib/api.server";
import ProdOrdersClient from "@/modules/production/ProdOrdersClient";

export default async function ProductionOrdersPage() {
  const data = await api("/api/bc/productionOrders");

  return <ProdOrdersClient initialData={data || []} />;
}
