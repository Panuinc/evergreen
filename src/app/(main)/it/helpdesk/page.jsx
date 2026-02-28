"use client";

import { useItTickets } from "@/hooks/it/useItTickets";
import HelpDeskView from "@/components/it/HelpDeskView";

export default function HelpDeskPage() {
  const hook = useItTickets();

  return (
    <HelpDeskView
      tickets={hook.tickets}
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
    />
  );
}
