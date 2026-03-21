import { api } from "@/lib/api.server";
import BcSalesOrdersClient from "@/modules/bc/bcSalesOrdersClient";
import type { BcSalesOrder } from "@/modules/bc/types";

export default async function BcSalesOrdersPage() {
  const salesOrders = await api<BcSalesOrder[]>("/api/bc/salesOrders");

  return <BcSalesOrdersClient initialSalesOrders={salesOrders || []} />;
}
