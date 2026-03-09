"use client";

import { useItTickets } from "@/modules/it/hooks/useItTickets";
import HelpDeskView from "@/modules/it/components/HelpDeskView";

export default function HelpDeskPage() {
  const hook = useItTickets();

  return (
    <HelpDeskView
      tickets={hook.tickets}
      employees={hook.employees}
      loading={hook.loading}
      saving={hook.saving}
      editingTicket={hook.editingTicket}
      formData={hook.formData}
      validationErrors={hook.validationErrors}
      deletingTicket={hook.deletingTicket}
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
