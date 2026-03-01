"use client";

import { useCrmActivities } from "@/modules/sales/hooks/useCrmActivities";
import ActivitiesView from "@/modules/sales/components/ActivitiesView";

export default function ActivitiesPage() {
  const {
    activities,
    loading,
    saving,
    editingActivity,
    formData,
    validationErrors,
    deletingActivity,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    handleToggleComplete,
    confirmDelete,
    handleDelete,
    toggleActive,
  } = useCrmActivities();

  return (
    <ActivitiesView
      activities={activities}
      loading={loading}
      saving={saving}
      editingActivity={editingActivity}
      formData={formData}
      validationErrors={validationErrors}
      deletingActivity={deletingActivity}
      typeFilter={typeFilter}
      setTypeFilter={setTypeFilter}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      handleToggleComplete={handleToggleComplete}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
      toggleActive={toggleActive}
    />
  );
}
