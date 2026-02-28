"use client";

import { useQuotations } from "@/modules/marketing/hooks/useQuotations";
import OmnichannelQuotationsView from "@/modules/marketing/components/OmnichannelQuotationsView";

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
