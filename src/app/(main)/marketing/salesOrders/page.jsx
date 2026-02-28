"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMarketingSalesOrders } from "@/modules/marketing/hooks/useMarketingSalesOrders";
import SalesOrdersView from "@/modules/marketing/components/SalesOrdersView";

export default function MarketingSalesOrdersPage() {
  const router = useRouter();
  const { orders, loading, shipFilter, setShipFilter, reload } = useMarketingSalesOrders();

  const handleNavigateToOrder = useCallback(
    (no) => router.push(`/marketing/salesOrders/${encodeURIComponent(no)}`),
    [router]
  );

  return (
    <SalesOrdersView
      orders={orders}
      loading={loading}
      shipFilter={shipFilter}
      setShipFilter={setShipFilter}
      reload={reload}
      onNavigateToOrder={handleNavigateToOrder}
    />
  );
}
