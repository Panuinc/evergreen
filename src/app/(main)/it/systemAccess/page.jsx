"use client";

import { useItSystemAccess } from "@/hooks/it/useItSystemAccess";
import SystemAccessView from "@/components/it/SystemAccessView";

export default function SystemAccessPage() {
  const hook = useItSystemAccess();

  return (
    <SystemAccessView
      accessRequests={hook.accessRequests}
      loading={hook.loading}
      saving={hook.saving}
      editingAccess={hook.editingAccess}
      formData={hook.formData}
      validationErrors={hook.validationErrors}
      deletingAccess={hook.deletingAccess}
      isOpen={hook.isOpen}
      onClose={hook.onClose}
      deleteModal={hook.deleteModal}
      updateField={hook.updateField}
      handleOpen={hook.handleOpen}
      handleSave={hook.handleSave}
      confirmDelete={hook.confirmDelete}
      handleDelete={hook.handleDelete}
    />
  );
}
