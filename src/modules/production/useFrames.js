"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { get } from "@/lib/apiClient";

const EMPTY_FRAMES = { rubberwood: [], sadao: [], lvl: [] };

export function useFrames() {
  const [frames, setFrames] = useState(EMPTY_FRAMES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFrames();
  }, []);

  const loadFrames = async () => {
    try {
      setLoading(true);
      const data = await get("/api/production/frames");
      setFrames(data);
    } catch (error) {
      toast.error("โหลดข้อมูลกรอบไม้ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return { frames, loading, reload: loadFrames };
}
