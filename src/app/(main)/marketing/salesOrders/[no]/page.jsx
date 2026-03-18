"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDisclosure } from "@heroui/react";
import { get } from "@/lib/apiClient";
import SalesOrderDetailView from "@/modules/marketing/components/SalesOrderDetailView";

export default function SalesOrderDetailPage() {
  const { no } = useParams();
  const router = useRouter();

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

  return (
    <SalesOrderDetailView
      order={order}
      customerPhone={customerPhone}
      loading={loading}
      labelModal={labelModal}
      onBack={() => router.push("/marketing/salesOrders")}
    />
  );
}
