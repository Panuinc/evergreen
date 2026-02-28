"use client";

import { useQuotations } from "@/hooks/marketing/useQuotations";
import OmnichannelQuotationsView from "@/components/marketing/OmnichannelQuotationsView";

export default function QuotationListPage() {
  const { quotations, loading, statusFilter, setStatusFilter, handleNavigateToQuotation } =
    useQuotations();

  return (
    <OmnichannelQuotationsView
      quotations={quotations}
      loading={loading}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      onNavigateToQuotation={handleNavigateToQuotation}
    />
  );
}
