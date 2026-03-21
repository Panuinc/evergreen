"use client";

import { useParams } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import { get } from "@/lib/apiClient";
import WarehouseInventoryGroupView from "@/modules/warehouse/components/warehouseInventoryGroupView";

const fetcher = (url) => get(url);

export default function WarehouseInventoryGroupClient() {
  const { group } = useParams();
  const decodedGroup = decodeURIComponent(group as string);
  const params = decodedGroup ? `?group=${encodeURIComponent(decodedGroup)}` : "";

  const { data, isLoading: loading } = useSWR(
    `/api/warehouse/inventory${params}`,
    fetcher,
    { onError: () => toast.error("ไม่สามารถโหลดข้อมูลคลังสินค้าได้") },
  );
  const items = data || [];

  return <WarehouseInventoryGroupView items={items} loading={loading} />;
}
