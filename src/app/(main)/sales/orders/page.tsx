import { api } from "@/lib/api.server";
import OrdersClient from "@/modules/sales/ordersClient";
import type { SalesOrder } from "@/modules/sales/types";

export default async function OrdersPage() {
  const orders = await api<SalesOrder[]>("/api/sales/orders");

  return <OrdersClient initialOrders={orders || []} />;
}
