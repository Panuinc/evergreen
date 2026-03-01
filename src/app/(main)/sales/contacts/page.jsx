"use client";

import { useSalesContacts } from "@/modules/sales/hooks/useSalesContacts";
import ContactsView from "@/modules/sales/components/ContactsView";

export default function ContactsPage() {
  const {
    contacts,
    loading,
    saving,
    editingContact,
    formData,
    validationErrors,
    deletingContact,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
    toggleActive,
  } = useSalesContacts();

  return (
    <ContactsView
      contacts={contacts}
      loading={loading}
      saving={saving}
      editingContact={editingContact}
      formData={formData}
      validationErrors={validationErrors}
      deletingContact={deletingContact}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
      toggleActive={toggleActive}
    />
  );
}
