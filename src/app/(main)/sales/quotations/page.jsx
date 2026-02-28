"use client";

import { useCrmQuotations } from "@/hooks/sales/useCrmQuotations";
import QuotationsView from "@/components/sales/QuotationsView";

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
