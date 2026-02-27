"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getCoreMaterials } from "@/actions/production";

const EMPTY_CORES = {
  foam: [],
  rockwool: [],
  particle: [],
  plywood: [],
  honeycomb: [],
};

export function useCores() {
  const [cores, setCores] = useState(EMPTY_CORES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCores();
  }, []);

  const loadCores = async () => {
    try {
      setLoading(true);
      const data = await getCoreMaterials();
      setCores(data);
    } catch (error) {
      toast.error("โหลดข้อมูลไส้ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return { cores, loading, reload: loadCores };
}
