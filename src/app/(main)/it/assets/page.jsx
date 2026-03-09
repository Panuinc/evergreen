"use client";

import { useItAssets } from "@/modules/it/hooks/useItAssets";
import AssetsView from "@/modules/it/components/AssetsView";

export default function AssetsPage() {
  const hook = useItAssets();

  return (
    <AssetsView
      assets={hook.assets}
      employees={hook.employees}
      loading={hook.loading}
      saving={hook.saving}
      editingAsset={hook.editingAsset}
      formData={hook.formData}
      validationErrors={hook.validationErrors}
      deletingAsset={hook.deletingAsset}
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
