"use client";

import { useOmQuotations } from "@/modules/marketing/hooks/useOmQuotations";
import OmnichannelQuotationsView from "@/modules/marketing/components/OmnichannelQuotationsView";

export default function QuotationListPage() {
  const { quotations, loading, statusFilter, setStatusFilter, handleNavigateToQuotation } =
    useOmQuotations();

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
