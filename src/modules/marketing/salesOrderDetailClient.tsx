"use client";

import { useParams, useRouter } from "next/navigation";
import { useDisclosure } from "@heroui/react";
import useSWR from "swr";
import { get } from "@/lib/apiClient";
import SalesOrderDetailView from "@/modules/marketing/components/salesOrderDetailView";
import type { MktSalesOrder } from "@/modules/marketing/types";

const fetcher = (url: string) => get<{ order: MktSalesOrder; customerPhone: string }>(url);

export default function SalesOrderDetailClient() {
  const { no } = useParams();
  const router = useRouter();
  const labelModal = useDisclosure();

  const encodedNo = encodeURIComponent(decodeURIComponent(no as string));
  const { data, isLoading: loading } = useSWR<{ order: MktSalesOrder; customerPhone: string }>(`/api/marketing/salesOrders/${encodedNo}`, fetcher);

  const order = data?.order || null;
  const customerPhone = data?.customerPhone || "";

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

