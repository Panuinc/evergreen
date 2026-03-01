"use client";

import { useItSystemAccess } from "@/modules/it/hooks/useItSystemAccess";
import SystemAccessView from "@/modules/it/components/SystemAccessView";

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
      toggleActive={hook.toggleActive}
    />
  );
}
