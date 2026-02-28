"use client";

import { useParams, useRouter } from "next/navigation";
import { useMarketingSalesOrderDetail } from "@/hooks/marketing/useMarketingSalesOrderDetail";
import SalesOrderDetailView from "@/components/marketing/SalesOrderDetailView";

export default function SalesOrderDetailPage() {
  const { no } = useParams();
  const router = useRouter();
  const { order, customerPhone, loading, labelModal } = useMarketingSalesOrderDetail(no);

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
