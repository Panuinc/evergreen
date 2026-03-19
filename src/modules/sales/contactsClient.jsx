"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import { validateForm, isRequired } from "@/lib/validation";
import ContactsView from "@/modules/sales/components/contactsView";

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

export default function ContactsClient({ initialContacts }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [saving, setSaving] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingContact, setDeletingContact] = useState(null);

  const reloadContacts = async () => {
    try {
      const { get } = await import("@/lib/apiClient");
      const data = await get("/api/sales/contacts");
      setContacts(data);
    } catch {}
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
      crmContactFirstName: [(v) => !isRequired(v) && "กรุณาระบุชื่อ"],
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
        await put(`/api/sales/contacts/${editingContact.crmContactId}`, payload);
        toast.success("อัปเดตผู้ติดต่อสำเร็จ");
      } else {
        await post("/api/sales/contacts", payload);
        toast.success("สร้างผู้ติดต่อสำเร็จ");
      }
      onClose();
      reloadContacts();
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
      await del(`/api/sales/contacts/${deletingContact.crmContactId}`);
      toast.success("ลบผู้ติดต่อสำเร็จ");
      deleteModal.onClose();
      setDeletingContact(null);
      reloadContacts();
    } catch (error) {
      toast.error(error.message || "ลบผู้ติดต่อล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await put(`/api/sales/contacts/${item.crmContactId}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      reloadContacts();
    } catch {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <ContactsView
      contacts={contacts}
      loading={false}
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
