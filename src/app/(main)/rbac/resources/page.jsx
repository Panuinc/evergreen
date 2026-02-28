"use client";

import { useResources } from "@/modules/rbac/hooks/useResources";
import ResourcesView from "@/modules/rbac/components/ResourcesView";

export default function ResourcesPage() {
  const {
    resources,
    loading,
    editingResource,
    formData,
    setFormData,
    isOpen,
    onClose,
    handleOpen,
    handleSave,
    handleDelete,
  } = useResources();

  return (
    <ResourcesView
      resources={resources}
      loading={loading}
      editingResource={editingResource}
      formData={formData}
      setFormData={setFormData}
      isOpen={isOpen}
      onClose={onClose}
      handleOpen={handleOpen}
      handleSave={handleSave}
      handleDelete={handleDelete}
    />
  );
}
