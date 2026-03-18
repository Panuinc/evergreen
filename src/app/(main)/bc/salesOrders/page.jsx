import { api } from "@/lib/api.server";
import BcSalesOrdersClient from "@/modules/bc/BcSalesOrdersClient";

export default async function BcSalesOrdersPage() {
  const salesOrders = await api("/api/bc/salesOrders");

  return <BcSalesOrdersClient initialSalesOrders={salesOrders || []} />;
}
