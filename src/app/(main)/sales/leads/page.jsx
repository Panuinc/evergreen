"use client";

import { useCrmLeads } from "@/modules/sales/hooks/useCrmLeads";
import LeadsView from "@/modules/sales/components/LeadsView";

export default function LeadsPage() {
  const {
    leads,
    loading,
    saving,
    editingLead,
    formData,
    validationErrors,
    deletingLead,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
    handleConvert,
    toggleActive,
  } = useCrmLeads();

  return (
    <LeadsView
      leads={leads}
      loading={loading}
      saving={saving}
      editingLead={editingLead}
      formData={formData}
      validationErrors={validationErrors}
      deletingLead={deletingLead}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
      handleConvert={handleConvert}
      toggleActive={toggleActive}
    />
  );
}
