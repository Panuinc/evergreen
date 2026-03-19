import { api } from "@/lib/api.server";
import OrdersClient from "@/modules/sales/ordersClient";

export default async function OrdersPage() {
  const orders = await api("/api/sales/orders");

  return <OrdersClient initialOrders={orders || []} />;
}
