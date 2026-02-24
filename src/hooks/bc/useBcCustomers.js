"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getBcCustomers } from "@/actions/bc";

export function useBcCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getBcCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error("โหลดลูกค้าจาก Business Central ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return { customers, loading };
}
