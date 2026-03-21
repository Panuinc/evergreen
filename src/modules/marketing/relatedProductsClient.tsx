"use client";

import { useState } from "react";
import { toast } from "sonner";
import { post, del } from "@/lib/apiClient";
import RelatedProductsView from "@/modules/marketing/components/relatedProductsView";
import type { RelatedProductsClientProps, MktRelatedProduct } from "@/modules/marketing/types";

export default function RelatedProductsClient({ initialRelatedProducts, initialStockItems }: RelatedProductsClientProps) {
  const [relatedProducts, setRelatedProducts] = useState<MktRelatedProduct[]>(initialRelatedProducts);
  const [loading, setLoading] = useState(false);

  const add = async (data) => {
    const result = await post<MktRelatedProduct>("/api/marketing/omnichannel/relatedProducts", data);
    const rp = result as MktRelatedProduct;
    setRelatedProducts((prev) => {
      const exists = prev.findIndex(
        (p) => p.mktRelatedProductId === rp.mktRelatedProductId
      );
      if (exists >= 0) {
        return prev.map((p) =>
          p.mktRelatedProductId === rp.mktRelatedProductId ? rp : p
        );
      }
      return [rp, ...prev];
    });
    toast.success("บันทึกสินค้าที่เกี่ยวข้องเรียบร้อย");
    return rp;
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
