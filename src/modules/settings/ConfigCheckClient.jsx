"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { get } from "@/lib/apiClient";
import ConfigCheckView from "@/modules/settings/components/ConfigCheckView";

export default function ConfigCheckClient({ initialStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await get("/api/configCheck");
      setStatus(data);
    } catch (error) {
      toast.error("ตรวจสอบสถานะการตั้งค่าล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  return <ConfigCheckView status={status} loading={loading} refetch={refetch} />;
}
