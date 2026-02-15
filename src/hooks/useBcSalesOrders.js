"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getBcSalesOrders } from "@/actions/bc";

export function useBcSalesOrders() {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSalesOrders();
  }, []);

  const loadSalesOrders = async () => {
    try {
      setLoading(true);
      const data = await getBcSalesOrders();
      setSalesOrders(data);
    } catch (error) {
      toast.error("Failed to load sales orders from Business Central");
    } finally {
      setLoading(false);
    }
  };

  return { salesOrders, loading };
}
