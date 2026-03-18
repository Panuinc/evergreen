"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import OrdersView from "@/modules/production/components/OrdersView";

export default function OrdersClient({ initialData }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const { get } = await import("@/lib/apiClient");
      const result = await get("/api/bc/productionOrders");
      setData(result);
    } catch (error) {
      toast.error("โหลดข้อมูลใบสั่งผลิตล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  return <OrdersView data={data} loading={loading} />;
}
