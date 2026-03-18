"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { get } from "@/lib/apiClient";
import WarehouseInventoryGroupView from "@/modules/warehouse/components/WarehouseInventoryGroupView";

export default function WarehouseGroupPage() {
  const { group } = useParams();
  const decodedGroup = decodeURIComponent(group);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedGroup]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const params = decodedGroup ? `?group=${encodeURIComponent(decodedGroup)}` : "";
      const data = await get(`/api/warehouse/inventory${params}`);
      setItems(data);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลคลังสินค้าได้");
    } finally {
      setLoading(false);
    }
  };

  return <WarehouseInventoryGroupView items={items} loading={loading} />;
}
