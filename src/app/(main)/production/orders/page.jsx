"use client";

import { useProductionOrders } from "@/modules/production/hooks/useProductionOrders";
import OrdersView from "@/modules/production/components/OrdersView";

export default function ProductionOrdersPage() {
  const { data, loading } = useProductionOrders();

  return <OrdersView data={data} loading={loading} />;
}
