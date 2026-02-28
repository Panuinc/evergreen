"use client";

import { useItAssets } from "@/hooks/it/useItAssets";
import AssetsView from "@/components/it/AssetsView";

export default function AssetsPage() {
  const hook = useItAssets();

  return (
    <AssetsView
      assets={hook.assets}
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
    />
  );
}
