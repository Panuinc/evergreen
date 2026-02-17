"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getQuotations } from "@/actions/omnichannel";

export function useQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadQuotations();
  }, [statusFilter]);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const data = await getQuotations(statusFilter);
      setQuotations(data);
    } catch {
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  return { quotations, loading, statusFilter, setStatusFilter };
}
