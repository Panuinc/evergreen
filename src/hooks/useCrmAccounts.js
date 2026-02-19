"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "@/actions/sales";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  accountName: "",
  accountIndustry: "",
  accountWebsite: "",
  accountPhone: "",
  accountEmail: "",
  accountEmployees: "",
  accountAnnualRevenue: "",
  accountAddress: "",
  accountNotes: "",
};

export function useCrmAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingAccount, setDeletingAccount] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAccounts();
      setAccounts(data);
    } catch (error) {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        accountName: account.accountName || "",
        accountIndustry: account.accountIndustry || "",
        accountWebsite: account.accountWebsite || "",
        accountPhone: account.accountPhone || "",
        accountEmail: account.accountEmail || "",
        accountEmployees: account.accountEmployees?.toString() || "",
        accountAnnualRevenue: account.accountAnnualRevenue?.toString() || "",
        accountAddress: account.accountAddress || "",
        accountNotes: account.accountNotes || "",
      });
    } else {
      setEditingAccount(null);
      setFormData(emptyForm);
    }
    setValidationErrors({});
    onOpen();
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm(formData, {
      accountName: [(v) => !isRequired(v) && "Account name is required"],
    });
    if (!isValid) {
      setValidationErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    setValidationErrors({});

    try {
      setSaving(true);
      const payload = {
        ...formData,
        accountEmployees: formData.accountEmployees
          ? parseInt(formData.accountEmployees)
          : null,
        accountAnnualRevenue: formData.accountAnnualRevenue
          ? parseFloat(formData.accountAnnualRevenue)
          : null,
      };

      if (editingAccount) {
        await updateAccount(editingAccount.accountId, payload);
        toast.success("Account updated");
      } else {
        await createAccount(payload);
        toast.success("Account created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (account) => {
    setDeletingAccount(account);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingAccount) return;
    try {
      await deleteAccount(deletingAccount.accountId);
      toast.success("Account deleted");
      deleteModal.onClose();
      setDeletingAccount(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete account");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
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
  };
}
