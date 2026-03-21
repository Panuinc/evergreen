"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import EntriesView from "@/modules/production/components/entriesView";
import type { EntriesClientProps, ItemLedgerEntry } from "@/modules/production/types";

export default function EntriesClient({ initialData }: EntriesClientProps) {
  const [data, setData] = useState<ItemLedgerEntry[]>(initialData);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const { get } = await import("@/lib/apiClient");
      const result = await get<ItemLedgerEntry[]>("/api/bc/production");
      setData(result);
    } catch {
      toast.error("โหลดข้อมูลการผลิตล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  return <EntriesView data={data} loading={loading} />;
}
