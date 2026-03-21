"use client";

import { useParams } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import { get } from "@/lib/apiClient";
import WarehouseInventoryGroupView from "@/modules/warehouse/components/warehouseInventoryGroupView";
import type { BcItem } from "@/modules/warehouse/types";

const fetcher = (url: string) => get<BcItem[]>(url);

export default function WarehouseInventoryGroupClient() {
  const { group } = useParams();
  const decodedGroup = decodeURIComponent(group as string);
  const params = decodedGroup ? `?category=${encodeURIComponent(decodedGroup)}` : "";

  const { data, isLoading: loading } = useSWR<BcItem[]>(
    `/api/warehouse/inventory${params}`,
    fetcher,
    { onError: () => toast.error("ไม่สามารถโหลดข้อมูลคลังสินค้าได้") },
  );
  const items = data || [];

  return <WarehouseInventoryGroupView items={items} loading={loading ?? false} />;
}
