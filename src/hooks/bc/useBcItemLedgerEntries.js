"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getBcItemLedgerEntries } from "@/actions/bc";

export function useBcItemLedgerEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await getBcItemLedgerEntries();
      setEntries(data);
    } catch (error) {
      toast.error("โหลดรายการเคลื่อนไหวสินค้าจาก Business Central ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return { entries, loading };
}
