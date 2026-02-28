"use client";

import { useItSecurity } from "@/modules/it/hooks/useItSecurity";
import SecurityView from "@/modules/it/components/SecurityView";

export default function SecurityPage() {
  const hook = useItSecurity();

  return (
    <SecurityView
      incidents={hook.incidents}
      loading={hook.loading}
      saving={hook.saving}
      editingIncident={hook.editingIncident}
      formData={hook.formData}
      validationErrors={hook.validationErrors}
      deletingIncident={hook.deletingIncident}
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
