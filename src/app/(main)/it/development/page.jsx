"use client";

import { useItDevRequests } from "@/modules/it/hooks/useItDevRequests";
import DevelopmentView from "@/modules/it/components/DevelopmentView";

export default function DevelopmentPage() {
  const hook = useItDevRequests();

  return (
    <DevelopmentView
      requests={hook.requests}
      loading={hook.loading}
      saving={hook.saving}
      editingRequest={hook.editingRequest}
      formData={hook.formData}
      validationErrors={hook.validationErrors}
      deletingRequest={hook.deletingRequest}
      isOpen={hook.isOpen}
      onClose={hook.onClose}
      deleteModal={hook.deleteModal}
      updateField={hook.updateField}
      handleOpen={hook.handleOpen}
      handleSave={hook.handleSave}
      confirmDelete={hook.confirmDelete}
      handleDelete={hook.handleDelete}
      progressModal={hook.progressModal}
      selectedRequest={hook.selectedRequest}
      progressLogs={hook.progressLogs}
      progressLoading={hook.progressLoading}
      progressSaving={hook.progressSaving}
      progressForm={hook.progressForm}
      openProgress={hook.openProgress}
      handleAddProgress={hook.handleAddProgress}
      updateProgressField={hook.updateProgressField}
    />
  );
}
