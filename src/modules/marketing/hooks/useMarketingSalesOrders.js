"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getSalesOrders } from "@/modules/marketing/actions";

export function useMarketingSalesOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shipFilter, setShipFilter] = useState("all");

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSalesOrders();
      setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    if (shipFilter === "all") return orders;
    if (shipFilter === "shipped") return orders.filter((o) => o.Completely_Shipped);
    return orders.filter((o) => !o.Completely_Shipped);
  }, [orders, shipFilter]);

  return {
    orders: filteredOrders,
    loading,
    shipFilter,
    setShipFilter,
    reload: loadOrders,
  };
}
