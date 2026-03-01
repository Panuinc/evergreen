"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from "@/modules/sales/actions";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  crmContactFirstName: "",
  crmContactLastName: "",
  crmContactEmail: "",
  crmContactPhone: "",
  crmContactPosition: "",
  crmContactAccountId: "",
  crmContactAddress: "",
  crmContactTags: "",
  crmContactNotes: "",
};

export function useSalesContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingContact, setDeletingContact] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getContacts();
      setContacts(data);
    } catch (error) {
      toast.error("โหลดผู้ติดต่อล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        crmContactFirstName: contact.crmContactFirstName || "",
        crmContactLastName: contact.crmContactLastName || "",
        crmContactEmail: contact.crmContactEmail || "",
        crmContactPhone: contact.crmContactPhone || "",
        crmContactPosition: contact.crmContactPosition || "",
        crmContactAccountId: contact.crmContactAccountId || "",
        crmContactAddress: contact.crmContactAddress || "",
        crmContactTags: contact.crmContactTags || "",
        crmContactNotes: contact.crmContactNotes || "",
      });
    } else {
      setEditingContact(null);
      setFormData(emptyForm);
    }
    setValidationErrors({});
    onOpen();
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm(formData, {
      crmContactFirstName: [
        (v) => !isRequired(v) && "กรุณาระบุชื่อ",
      ],
    });
    if (!isValid) {
      setValidationErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    setValidationErrors({});

    try {
      setSaving(true);
      const payload = { ...formData };
      if (!payload.crmContactAccountId) delete payload.crmContactAccountId;

      if (editingContact) {
        await updateContact(editingContact.crmContactId, payload);
        toast.success("อัปเดตผู้ติดต่อสำเร็จ");
      } else {
        await createContact(payload);
        toast.success("สร้างผู้ติดต่อสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกผู้ติดต่อล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (contact) => {
    setDeletingContact(contact);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingContact) return;
    try {
      await deleteContact(deletingContact.crmContactId);
      toast.success("ลบผู้ติดต่อสำเร็จ");
      deleteModal.onClose();
      setDeletingContact(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบผู้ติดต่อล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleActive = async (item) => {
    try {
      await updateContact(item.crmContactId, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      loadData();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  return {
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
  };
}
