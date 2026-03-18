"use client";

import { useState, useEffect, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { get } from "@/lib/apiClient";

export function useMarketingSalesOrderDetail(no) {
  const [order, setOrder] = useState(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const labelModal = useDisclosure();

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const data = await get(`/api/marketing/salesOrders/${encodeURIComponent(decodeURIComponent(no))}`);
      setOrder(data.order || null);
      setCustomerPhone(data.customerPhone || "");
    } finally {
      setLoading(false);
    }
  }, [no]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  return {
    order,
    customerPhone,
    loading,
    labelModal,
  };
}
