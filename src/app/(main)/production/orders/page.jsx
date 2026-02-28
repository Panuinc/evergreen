"use client";

import { useProductionOrders } from "@/hooks/production/useProductionOrders";
import OrdersView from "@/components/production/OrdersView";

export default function ProductionOrdersPage() {
  const { data, loading } = useProductionOrders();

  return <OrdersView data={data} loading={loading} />;
}
