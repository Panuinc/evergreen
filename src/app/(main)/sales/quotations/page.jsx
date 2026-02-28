"use client";

import { useCrmQuotations } from "@/modules/sales/hooks/useCrmQuotations";
import QuotationsView from "@/modules/sales/components/QuotationsView";

export default function QuotationsPage() {
  const {
    quotations,
    loading,
    statusFilter,
    setStatusFilter,
    deletingQuotation,
    deleteModal,
    confirmDelete,
    handleDelete,
    handleNew,
    onNavigateToQuotation,
  } = useCrmQuotations();

  return (
    <QuotationsView
      quotations={quotations}
      loading={loading}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      deletingQuotation={deletingQuotation}
      deleteModal={deleteModal}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
      handleNew={handleNew}
      onNavigateToQuotation={onNavigateToQuotation}
    />
  );
}
