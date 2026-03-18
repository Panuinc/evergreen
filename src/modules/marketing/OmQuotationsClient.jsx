"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import OmnichannelQuotationsView from "@/modules/marketing/components/OmnichannelQuotationsView";

export default function QuotationsClient({ initialQuotations }) {
  const router = useRouter();
  const [quotations, setQuotations] = useState(initialQuotations);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const handleStatusFilterChange = useCallback(async (newFilter) => {
    setStatusFilter(newFilter);
    try {
      setLoading(true);
      const { get } = await import("@/lib/apiClient");
      const url =
        newFilter === "all"
          ? "/api/marketing/omnichannel/quotations"
          : `/api/marketing/omnichannel/quotations?status=${newFilter}`;
      const data = await get(url);
      setQuotations(data || []);
    } catch {
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNavigateToQuotation = useCallback(
    (id) => router.push(`/marketing/omnichannel/quotations/${id}`),
    [router]
  );

  return (
    <OmnichannelQuotationsView
      quotations={quotations}
      loading={loading}
      statusFilter={statusFilter}
      setStatusFilter={handleStatusFilterChange}
      onNavigateToQuotation={handleNavigateToQuotation}
    />
  );
}
