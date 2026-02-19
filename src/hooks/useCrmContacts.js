"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from "@/actions/sales";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  contactFirstName: "",
  contactLastName: "",
  contactEmail: "",
  contactPhone: "",
  contactPosition: "",
  contactAccountId: "",
  contactAddress: "",
  contactTags: "",
  contactNotes: "",
};

export function useCrmContacts() {
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
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        contactFirstName: contact.contactFirstName || "",
        contactLastName: contact.contactLastName || "",
        contactEmail: contact.contactEmail || "",
        contactPhone: contact.contactPhone || "",
        contactPosition: contact.contactPosition || "",
        contactAccountId: contact.contactAccountId || "",
        contactAddress: contact.contactAddress || "",
        contactTags: contact.contactTags || "",
        contactNotes: contact.contactNotes || "",
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
      contactFirstName: [
        (v) => !isRequired(v) && "First name is required",
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
      if (!payload.contactAccountId) delete payload.contactAccountId;

      if (editingContact) {
        await updateContact(editingContact.contactId, payload);
        toast.success("Contact updated");
      } else {
        await createContact(payload);
        toast.success("Contact created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save contact");
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
      await deleteContact(deletingContact.contactId);
      toast.success("Contact deleted");
      deleteModal.onClose();
      setDeletingContact(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete contact");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
  };
}
