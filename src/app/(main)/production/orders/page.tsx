import { api } from "@/lib/api.server";
import ProdOrdersClient from "@/modules/production/prodOrdersClient";
import type { ProductionOrder } from "@/modules/production/types";

export default async function ProductionOrdersPage() {
  const data = await api<ProductionOrder[]>("/api/production/orders");

  return <ProdOrdersClient initialData={data || []} />;
}
