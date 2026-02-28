"use client";

import { useItNetwork } from "@/hooks/it/useItNetwork";
import NetworkView from "@/components/it/NetworkView";

export default function NetworkPage() {
  const hook = useItNetwork();

  return (
    <NetworkView
      devices={hook.devices}
      loading={hook.loading}
      saving={hook.saving}
      editingDevice={hook.editingDevice}
      formData={hook.formData}
      validationErrors={hook.validationErrors}
      deletingDevice={hook.deletingDevice}
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
