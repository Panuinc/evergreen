"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion as deletePromoAction,
} from "@/modules/marketing/actions";

export function usePromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPromotions();
      setPromotions(data);
    } catch {
      toast.error("โหลดโปรโมชั่นล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (data) => {
    const result = await createPromotion(data);
    setPromotions((prev) => [result, ...prev]);
    toast.success("สร้างโปรโมชั่นเรียบร้อย");
    return result;
  };

  const update = async (id, data) => {
    const result = await updatePromotion(id, data);
    setPromotions((prev) => prev.map((p) => (p.omPromotionId === id ? result : p)));
    toast.success("อัปเดตโปรโมชั่นเรียบร้อย");
    return result;
  };

  const remove = async (id) => {
    await deletePromoAction(id);
    setPromotions((prev) => prev.filter((p) => p.omPromotionId !== id));
    toast.success("ลบโปรโมชั่นเรียบร้อย");
  };

  return { promotions, loading, reload: load, add, update, remove };
}
