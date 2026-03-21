"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import EntriesView from "@/modules/production/components/entriesView";

export default function EntriesClient({ initialData }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const { get } = await import("@/lib/apiClient");
      const result = await get("/api/bc/production");
      setData(result);
    } catch (error) {
      toast.error("โหลดข้อมูลการผลิตล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  return <EntriesView data={data} loading={loading} />;
}
