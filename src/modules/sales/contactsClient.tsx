"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import { validateForm, isRequired } from "@/lib/validation";
import ContactsView from "@/modules/sales/components/contactsView";
import type { SalesContact, ContactsViewProps } from "@/modules/sales/types";

type ContactFormData = Partial<SalesContact>;

const emptyForm: ContactFormData = {
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

interface ContactsClientProps {
  initialContacts: SalesContact[];
}

export default function ContactsClient({ initialContacts }: ContactsClientProps) {
  const [contacts, setContacts] = useState<SalesContact[]>(initialContacts);
  const [saving, setSaving] = useState(false);
  const [editingContact, setEditingContact] = useState<SalesContact | null>(null);
  const [formData, setFormData] = useState<ContactFormData>(emptyForm);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingContact, setDeletingContact] = useState<SalesContact | null>(null);

  const reloadContacts = async () => {
    try {
      const { get } = await import("@/lib/apiClient");
      const data = await get<SalesContact[]>("/api/sales/contacts");
      setContacts(data);
    } catch {}
  };

  const handleOpen = (contact: SalesContact | null = null) => {
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
      salesContactFirstName: [(v: string) => !isRequired(v) && "กรุณาระบุชื่อ"],
    });
    if (!isValid) {
      setValidationErrors(errors as Record<string, string>);
      Object.values(errors).forEach((msg) => toast.error(msg as string));
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
      toast.error((error as Error).message || "บันทึกผู้ติดต่อล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (contact: SalesContact) => {
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
      toast.error((error as Error).message || "ลบผู้ติดต่อล้มเหลว");
    }
  };

  const toggleActive = async (item: SalesContact) => {
    try {
      await put(`/api/sales/contacts/${item.salesContactId}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      reloadContacts();
    } catch {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Build props that satisfy ContactsViewProps
  const viewProps: ContactsViewProps = {
    contacts,
    loading: false,
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

  return <ContactsView {...viewProps} />;
}
