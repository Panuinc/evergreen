"use client";

import { useState } from "react";
import { toast } from "sonner";
import { post, del } from "@/lib/apiClient";
import RelatedProductsView from "@/modules/marketing/components/relatedProductsView";

export default function RelatedProductsClient({ initialRelatedProducts, initialStockItems }) {
  const [relatedProducts, setRelatedProducts] = useState(initialRelatedProducts);
  const [loading, setLoading] = useState(false);

  const add = async (data) => {
    const result = await post("/api/marketing/omnichannel/relatedProducts", data);
    setRelatedProducts((prev) => {
      const exists = prev.findIndex(
        (p) => p.mktRelatedProductId === result.mktRelatedProductId
      );
      if (exists >= 0) {
        return prev.map((p) =>
          p.mktRelatedProductId === result.mktRelatedProductId ? result : p
        );
      }
      return [result, ...prev];
    });
    toast.success("บันทึกสินค้าที่เกี่ยวข้องเรียบร้อย");
    return result;
  };

  const remove = async (id) => {
    await del(`/api/marketing/omnichannel/relatedProducts/${id}`);
    setRelatedProducts((prev) =>
      prev.filter((p) => p.mktRelatedProductId !== id)
    );
    toast.success("ลบสินค้าที่เกี่ยวข้องเรียบร้อย");
  };

  return (
    <RelatedProductsView
      relatedProducts={relatedProducts}
      loading={loading}
      stockItems={initialStockItems}
      onAdd={add}
      onDelete={remove}
    />
  );
}
