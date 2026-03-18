"use client";

import { useParams, useRouter } from "next/navigation";
import { useMarketingSalesOrderDetail } from "@/modules/marketing/useMarketingSalesOrderDetail";
import SalesOrderDetailView from "@/modules/marketing/components/SalesOrderDetailView";

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
