"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import SalesOrdersView from "@/modules/marketing/components/salesOrdersView";

export default function SalesOrdersClient({ initialOrders }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState(false);
  const [shipFilter, setShipFilter] = useState("all");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const { get } = await import("@/lib/apiClient");
      const data = await get("/api/marketing/salesOrders");
      setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredOrders = useMemo(() => {
    if (shipFilter === "all") return orders;
    if (shipFilter === "shipped") return orders.filter((o) => o.bcSalesOrderCompletelyShipped === "true");
    return orders.filter((o) => o.bcSalesOrderCompletelyShipped !== "true");
  }, [orders, shipFilter]);

  const handleNavigateToOrder = useCallback(
    (no) => router.push(`/marketing/salesOrders/${encodeURIComponent(no)}`),
    [router]
  );

  return (
    <SalesOrdersView
      orders={filteredOrders}
      loading={loading}
      shipFilter={shipFilter}
      setShipFilter={setShipFilter}
      reload={reload}
      onNavigateToOrder={handleNavigateToOrder}
    />
  );
}
