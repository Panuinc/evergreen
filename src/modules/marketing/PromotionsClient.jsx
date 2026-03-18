"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import PromotionsView from "@/modules/marketing/components/PromotionsView";

export default function PromotionsClient({ initialPromotions, initialStockItems }) {
  const [promotions, setPromotions] = useState(initialPromotions);
  const [loading, setLoading] = useState(false);

  const add = async (data) => {
    const result = await post("/api/marketing/omnichannel/promotions", data);
    setPromotions((prev) => [result, ...prev]);
    toast.success("สร้างโปรโมชั่นเรียบร้อย");
    return result;
  };

  const update = async (id, data) => {
    const result = await put(`/api/marketing/omnichannel/promotions/${id}`, data);
    setPromotions((prev) => prev.map((p) => (p.omPromotionId === id ? result : p)));
    toast.success("อัปเดตโปรโมชั่นเรียบร้อย");
    return result;
  };

  const remove = async (id) => {
    await del(`/api/marketing/omnichannel/promotions/${id}`);
    setPromotions((prev) => prev.filter((p) => p.omPromotionId !== id));
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
