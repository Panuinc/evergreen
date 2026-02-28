"use client";

import { useCrmAccounts } from "@/modules/sales/hooks/useCrmAccounts";
import AccountsView from "@/modules/sales/components/AccountsView";

export default function AccountsPage() {
  const {
    accounts,
    loading,
    saving,
    editingAccount,
    formData,
    validationErrors,
    deletingAccount,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useCrmAccounts();

  return (
    <AccountsView
      accounts={accounts}
      loading={loading}
      saving={saving}
      editingAccount={editingAccount}
      formData={formData}
      validationErrors={validationErrors}
      deletingAccount={deletingAccount}
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
