"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import SalesOrdersView from "@/modules/marketing/components/salesOrdersView";
import type { MktSalesOrder, SalesOrdersClientProps } from "@/modules/marketing/types";

export default function SalesOrdersClient({ initialOrders }: SalesOrdersClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<MktSalesOrder[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [shipFilter, setShipFilter] = useState("all");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const { get } = await import("@/lib/apiClient");
      const data = await get<{ orders: MktSalesOrder[] }>("/api/marketing/salesOrders");
      setOrders(data?.orders ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredOrders = useMemo(() => {
    if (shipFilter === "all") return orders;
    if (shipFilter === "shipped") return orders.filter((o) => o.bcSalesOrderCompletelyShipped === true);
    return orders.filter((o) => o.bcSalesOrderCompletelyShipped !== true);
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
