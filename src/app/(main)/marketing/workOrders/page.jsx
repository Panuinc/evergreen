"use client";

import { useWorkOrders } from "@/modules/marketing/hooks/useWorkOrders";
import WorkOrdersView from "@/modules/marketing/components/WorkOrdersView";

export default function WorkOrdersPage() {
  const hook = useWorkOrders();

  return (
    <WorkOrdersView
      workOrders={hook.workOrders}
      employees={hook.employees}
      loading={hook.loading}
      saving={hook.saving}
      editingWorkOrder={hook.editingWorkOrder}
      formData={hook.formData}
      validationErrors={hook.validationErrors}
      deletingWorkOrder={hook.deletingWorkOrder}
      isOpen={hook.isOpen}
      onClose={hook.onClose}
      deleteModal={hook.deleteModal}
      updateField={hook.updateField}
      handleOpen={hook.handleOpen}
      handleSave={hook.handleSave}
      confirmDelete={hook.confirmDelete}
      handleDelete={hook.handleDelete}
      progressModal={hook.progressModal}
      selectedWorkOrder={hook.selectedWorkOrder}
      progressLogs={hook.progressLogs}
      progressLoading={hook.progressLoading}
      progressSaving={hook.progressSaving}
      progressForm={hook.progressForm}
      openProgress={hook.openProgress}
      handleAddProgress={hook.handleAddProgress}
      updateProgressField={hook.updateProgressField}
      toggleActive={hook.toggleActive}
    />
  );
}
