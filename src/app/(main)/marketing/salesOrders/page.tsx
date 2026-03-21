import { api } from "@/lib/api.server";
import MktSalesOrdersClient from "@/modules/marketing/mktSalesOrdersClient";

export default async function MarketingSalesOrdersPage() {
  const data = await api("/api/marketing/salesOrders");

  return <MktSalesOrdersClient initialOrders={data?.orders || []} />;
}
