"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import { validateForm, isRequired } from "@/lib/validation";
import AccountsView from "@/modules/sales/components/accountsView";

const emptyForm = {
  salesAccountName: "",
  salesAccountIndustry: "",
  salesAccountWebsite: "",
  salesAccountPhone: "",
  salesAccountEmail: "",
  salesAccountEmployees: "",
  salesAccountAnnualRevenue: "",
  salesAccountAddress: "",
  salesAccountNotes: "",
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
        salesAccountName: account.salesAccountName || "",
        salesAccountIndustry: account.salesAccountIndustry || "",
        salesAccountWebsite: account.salesAccountWebsite || "",
        salesAccountPhone: account.salesAccountPhone || "",
        salesAccountEmail: account.salesAccountEmail || "",
        salesAccountEmployees: account.salesAccountEmployees?.toString() || "",
        salesAccountAnnualRevenue: account.salesAccountAnnualRevenue?.toString() || "",
        salesAccountAddress: account.salesAccountAddress || "",
        salesAccountNotes: account.salesAccountNotes || "",
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
      salesAccountName: [(v) => !isRequired(v) && "กรุณาระบุชื่อบัญชี"],
    });
    if (!isValid) {
      setValidationErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg as string));
      return;
    }
    setValidationErrors({});

    try {
      setSaving(true);
      const payload = {
        ...formData,
        salesAccountEmployees: formData.salesAccountEmployees
          ? parseInt(formData.salesAccountEmployees)
          : null,
        salesAccountAnnualRevenue: formData.salesAccountAnnualRevenue
          ? parseFloat(formData.salesAccountAnnualRevenue)
          : null,
      };

      if (editingAccount) {
        await put(`/api/sales/accounts/${editingAccount.salesAccountId}`, payload);
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
      await del(`/api/sales/accounts/${deletingAccount.salesAccountId}`);
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
      await put(`/api/sales/accounts/${item.salesAccountId}`, { isActive: !item.isActive });
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
