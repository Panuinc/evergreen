import { api } from "@/lib/api.server";
import MktSalesOrdersClient from "@/modules/marketing/MktSalesOrdersClient";

export default async function MarketingSalesOrdersPage() {
  const data = await api("/api/marketing/salesOrders");

  return <MktSalesOrdersClient initialOrders={data?.orders || []} />;
}
