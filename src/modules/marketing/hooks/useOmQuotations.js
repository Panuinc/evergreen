"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getQuotations } from "@/modules/marketing/actions";

export function useOmQuotations() {
  const router = useRouter();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadQuotations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleNavigateToQuotation = useCallback(
    (id) => router.push(`/marketing/omnichannel/quotations/${id}`),
    [router]
  );

  return { quotations, loading, statusFilter, setStatusFilter, handleNavigateToQuotation };
}
