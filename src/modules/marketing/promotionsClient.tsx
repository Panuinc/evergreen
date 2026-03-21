"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import PromotionsView from "@/modules/marketing/components/promotionsView";
import type { PromotionsClientProps, MktPromotion } from "@/modules/marketing/types";

export default function PromotionsClient({ initialPromotions, initialStockItems }: PromotionsClientProps) {
  const [promotions, setPromotions] = useState<MktPromotion[]>(initialPromotions);
  const [loading, setLoading] = useState(false);

  const add = async (data) => {
    const result = await post<MktPromotion>("/api/marketing/omnichannel/promotions", data);
    setPromotions((prev) => [result as MktPromotion, ...prev]);
    toast.success("สร้างโปรโมชั่นเรียบร้อย");
    return result as MktPromotion;
  };

  const update = async (id, data) => {
    const result = await put<MktPromotion>(`/api/marketing/omnichannel/promotions/${id}`, data);
    setPromotions((prev) => prev.map((p) => (p.mktPromotionId === id ? (result as MktPromotion) : p)));
    toast.success("อัปเดตโปรโมชั่นเรียบร้อย");
    return result as MktPromotion;
  };

  const remove = async (id) => {
    await del(`/api/marketing/omnichannel/promotions/${id}`);
    setPromotions((prev) => prev.filter((p) => p.mktPromotionId !== id));
    toast.success("ลบโปรโมชั่นเรียบร้อย");
  };

  return (
    <PromotionsView
      promotions={promotions}
      loading={loading}
      stockItems={initialStockItems}
      onAdd={add}
      onUpdate={update}
      onDelete={remove}
    />
  );
}
