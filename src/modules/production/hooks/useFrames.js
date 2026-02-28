"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getFrameMaterials } from "@/modules/production/actions";

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
      const data = await getFrameMaterials();
      setFrames(data);
    } catch (error) {
      toast.error("โหลดข้อมูลกรอบไม้ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return { frames, loading, reload: loadFrames };
}
