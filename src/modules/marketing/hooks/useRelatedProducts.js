"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getRelatedProducts,
  createRelatedProduct,
  deleteRelatedProduct as deleteAction,
} from "@/modules/marketing/actions";

export function useRelatedProducts() {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRelatedProducts();
      setRelatedProducts(data);
    } catch {
      toast.error("โหลดสินค้าที่เกี่ยวข้องล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (data) => {
    const result = await createRelatedProduct(data);
    setRelatedProducts((prev) => {
      const exists = prev.findIndex(
        (p) => p.omRelatedProductId === result.omRelatedProductId
      );
      if (exists >= 0) {
        return prev.map((p) =>
          p.omRelatedProductId === result.omRelatedProductId ? result : p
        );
      }
      return [result, ...prev];
    });
    toast.success("บันทึกสินค้าที่เกี่ยวข้องเรียบร้อย");
    return result;
  };

  const remove = async (id) => {
    await deleteAction(id);
    setRelatedProducts((prev) =>
      prev.filter((p) => p.omRelatedProductId !== id)
    );
    toast.success("ลบสินค้าที่เกี่ยวข้องเรียบร้อย");
  };

  return { relatedProducts, loading, reload: load, add, remove };
}
