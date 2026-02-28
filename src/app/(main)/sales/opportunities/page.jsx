"use client";

import { useCrmOpportunities } from "@/hooks/sales/useCrmOpportunities";
import OpportunitiesView from "@/components/sales/OpportunitiesView";

export default function OpportunitiesPage() {
  const {
    opportunities,
    loading,
    saving,
    editingOpp,
    formData,
    validationErrors,
    deletingOpp,
    viewMode,
    setViewMode,
    lostReason,
    setLostReason,
    lostReasonModal,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    handleStageChange,
    handleCloseLost,
    confirmDelete,
    handleDelete,
  } = useCrmOpportunities();

  return (
    <OpportunitiesView
      opportunities={opportunities}
      loading={loading}
      saving={saving}
      editingOpp={editingOpp}
      formData={formData}
      validationErrors={validationErrors}
      deletingOpp={deletingOpp}
      viewMode={viewMode}
      setViewMode={setViewMode}
      lostReason={lostReason}
      setLostReason={setLostReason}
      lostReasonModal={lostReasonModal}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      handleStageChange={handleStageChange}
      handleCloseLost={handleCloseLost}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
    />
  );
}
