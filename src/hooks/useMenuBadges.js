"use client";

import { useState, useEffect } from "react";
import { get } from "@/lib/apiClient";

export function useMenuBadges() {
  const [badges, setBadges] = useState({});

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const alertData = await get("/api/tms/alerts");
        setBadges((prev) => ({ ...prev, tmsAlertCount: alertData.totalCount }));
      } catch {
        // Silent fail - badges are non-critical
      }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  return badges;
}
