import { api } from "@/lib/api.server";
import MktSalesOrdersClient from "@/modules/marketing/mktSalesOrdersClient";
import type { MktSalesOrder } from "@/modules/marketing/types";

export default async function MarketingSalesOrdersPage() {
  const data = await api<{ orders: MktSalesOrder[] }>("/api/marketing/salesOrders");

  return <MktSalesOrdersClient initialOrders={data?.orders || []} />;
}
