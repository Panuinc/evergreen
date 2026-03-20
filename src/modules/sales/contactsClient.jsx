"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import { validateForm, isRequired } from "@/lib/validation";
import ContactsView from "@/modules/sales/components/contactsView";

const emptyForm = {
  salesContactFirstName: "",
  salesContactLastName: "",
  salesContactEmail: "",
  salesContactPhone: "",
  salesContactPosition: "",
  salesContactAccountId: "",
  salesContactAddress: "",
  salesContactTags: "",
  salesContactNotes: "",
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
        salesContactFirstName: contact.salesContactFirstName || "",
        salesContactLastName: contact.salesContactLastName || "",
        salesContactEmail: contact.salesContactEmail || "",
        salesContactPhone: contact.salesContactPhone || "",
        salesContactPosition: contact.salesContactPosition || "",
        salesContactAccountId: contact.salesContactAccountId || "",
        salesContactAddress: contact.salesContactAddress || "",
        salesContactTags: contact.salesContactTags || "",
        salesContactNotes: contact.salesContactNotes || "",
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
      salesContactFirstName: [(v) => !isRequired(v) && "กรุณาระบุชื่อ"],
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
      if (!payload.salesContactAccountId) delete payload.salesContactAccountId;

      if (editingContact) {
        await put(`/api/sales/contacts/${editingContact.salesContactId}`, payload);
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
      await del(`/api/sales/contacts/${deletingContact.salesContactId}`);
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
      await put(`/api/sales/contacts/${item.salesContactId}`, { isActive: !item.isActive });
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
