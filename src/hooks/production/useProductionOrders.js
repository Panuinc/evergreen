"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getProductionOrders } from "@/actions/production";

export function useProductionOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getProductionOrders();
        setOrders(data);
      } catch {
        toast.error("โหลดข้อมูลใบสั่งผลิตล้มเหลว");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { orders, loading };
}
