"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { get } from "@/lib/apiClient";
import ConfigCheckView from "@/modules/settings/components/configCheckView";
import type { ConfigCheckClientProps, SystemStatusData } from "@/modules/settings/types";

export default function ConfigCheckClient({ initialStatus }: ConfigCheckClientProps) {
  const [status, setStatus] = useState<SystemStatusData | null>(initialStatus);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await get<SystemStatusData>("/api/configCheck");
      setStatus(data);
    } catch {
      toast.error("ตรวจสอบสถานะการตั้งค่าล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  return <ConfigCheckView status={status} loading={loading} refetch={refetch} />;
}
