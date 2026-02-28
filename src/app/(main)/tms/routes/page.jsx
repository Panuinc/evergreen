"use client";

import { useRoutes } from "@/hooks/tms/useRoutes";
import RoutesView from "@/components/tms/RoutesView";

export default function RoutesPage() {
  const {
    routes,
    loading,
    saving,
    editingRoute,
    formData,
    deletingRoute,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useRoutes();

  return (
    <RoutesView
      routes={routes}
      loading={loading}
      saving={saving}
      editingRoute={editingRoute}
      formData={formData}
      deletingRoute={deletingRoute}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
    />
  );
}
