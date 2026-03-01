"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "@/modules/sales/actions";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  crmAccountName: "",
  crmAccountIndustry: "",
  crmAccountWebsite: "",
  crmAccountPhone: "",
  crmAccountEmail: "",
  crmAccountEmployees: "",
  crmAccountAnnualRevenue: "",
  crmAccountAddress: "",
  crmAccountNotes: "",
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
      toast.error("โหลดบัญชีลูกค้าล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        crmAccountName: account.crmAccountName || "",
        crmAccountIndustry: account.crmAccountIndustry || "",
        crmAccountWebsite: account.crmAccountWebsite || "",
        crmAccountPhone: account.crmAccountPhone || "",
        crmAccountEmail: account.crmAccountEmail || "",
        crmAccountEmployees: account.crmAccountEmployees?.toString() || "",
        crmAccountAnnualRevenue: account.crmAccountAnnualRevenue?.toString() || "",
        crmAccountAddress: account.crmAccountAddress || "",
        crmAccountNotes: account.crmAccountNotes || "",
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
      crmAccountName: [(v) => !isRequired(v) && "กรุณาระบุชื่อบัญชี"],
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
        crmAccountEmployees: formData.crmAccountEmployees
          ? parseInt(formData.crmAccountEmployees)
          : null,
        crmAccountAnnualRevenue: formData.crmAccountAnnualRevenue
          ? parseFloat(formData.crmAccountAnnualRevenue)
          : null,
      };

      if (editingAccount) {
        await updateAccount(editingAccount.crmAccountId, payload);
        toast.success("อัปเดตบัญชีสำเร็จ");
      } else {
        await createAccount(payload);
        toast.success("สร้างบัญชีสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกบัญชีล้มเหลว");
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
      await deleteAccount(deletingAccount.crmAccountId);
      toast.success("ลบบัญชีสำเร็จ");
      deleteModal.onClose();
      setDeletingAccount(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบบัญชีล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleActive = async (item) => {
    try {
      await updateAccount(item.crmAccountId, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      loadData();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
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
    toggleActive,
  };
}
