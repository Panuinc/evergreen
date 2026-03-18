"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import { validateForm, isRequired } from "@/lib/validation";
import AccountsView from "@/modules/sales/components/AccountsView";

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

export default function AccountsClient({ initialAccounts }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [saving, setSaving] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingAccount, setDeletingAccount] = useState(null);

  const reloadAccounts = async () => {
    try {
      const { get } = await import("@/lib/apiClient");
      const data = await get("/api/sales/accounts");
      setAccounts(data);
    } catch {}
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
        await put(`/api/sales/accounts/${editingAccount.crmAccountId}`, payload);
        toast.success("อัปเดตบัญชีสำเร็จ");
      } else {
        await post("/api/sales/accounts", payload);
        toast.success("สร้างบัญชีสำเร็จ");
      }
      onClose();
      reloadAccounts();
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
      await del(`/api/sales/accounts/${deletingAccount.crmAccountId}`);
      toast.success("ลบบัญชีสำเร็จ");
      deleteModal.onClose();
      setDeletingAccount(null);
      reloadAccounts();
    } catch (error) {
      toast.error(error.message || "ลบบัญชีล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await put(`/api/sales/accounts/${item.crmAccountId}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      reloadAccounts();
    } catch {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AccountsView
      accounts={accounts}
      loading={false}
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
      toggleActive={toggleActive}
    />
  );
}
