"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import OrdersView from "@/modules/production/components/ordersView";
import type { OrdersClientProps, ProductionOrder } from "@/modules/production/types";

export default function OrdersClient({ initialData }: OrdersClientProps) {
  const [data, setData] = useState<ProductionOrder[]>(initialData);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const { get } = await import("@/lib/apiClient");
      const result = await get<ProductionOrder[]>("/api/production/orders");
      setData(result);
    } catch {
      toast.error("โหลดข้อมูลใบสั่งผลิตล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  return <OrdersView data={data} loading={loading} />;
}
