"use client";

import { useItSoftware } from "@/hooks/it/useItSoftware";
import SoftwareView from "@/components/it/SoftwareView";

export default function SoftwarePage() {
  const hook = useItSoftware();

  return (
    <SoftwareView
      software={hook.software}
      loading={hook.loading}
      saving={hook.saving}
      editingSoftware={hook.editingSoftware}
      formData={hook.formData}
      validationErrors={hook.validationErrors}
      deletingSoftware={hook.deletingSoftware}
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
