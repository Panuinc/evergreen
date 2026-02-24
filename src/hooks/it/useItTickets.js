"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getTickets,
  createTicket,
  updateTicket,
  deleteTicket,
} from "@/actions/it";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  ticketTitle: "",
  ticketDescription: "",
  ticketCategory: "other",
  ticketPriority: "medium",
  ticketStatus: "open",
  ticketRequestedBy: "",
  ticketAssignedTo: "",
  ticketNotes: "",
};

export function useItTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingTicket, setDeletingTicket] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getTickets();
      setTickets(data);
    } catch (error) {
      toast.error("โหลดตั๋วล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (ticket = null) => {
    if (ticket) {
      setEditingTicket(ticket);
      setFormData({
        ticketTitle: ticket.ticketTitle || "",
        ticketDescription: ticket.ticketDescription || "",
        ticketCategory: ticket.ticketCategory || "other",
        ticketPriority: ticket.ticketPriority || "medium",
        ticketStatus: ticket.ticketStatus || "open",
        ticketRequestedBy: ticket.ticketRequestedBy || "",
        ticketAssignedTo: ticket.ticketAssignedTo || "",
        ticketNotes: ticket.ticketNotes || "",
      });
    } else {
      setEditingTicket(null);
      setFormData(emptyForm);
    }
    setValidationErrors({});
    onOpen();
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm(formData, {
      ticketTitle: [(v) => !isRequired(v) && "กรุณาระบุหัวข้อตั๋ว"],
    });
    if (!isValid) {
      setValidationErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    setValidationErrors({});

    try {
      setSaving(true);
      if (editingTicket) {
        await updateTicket(editingTicket.ticketId, formData);
        toast.success("อัปเดตตั๋วสำเร็จ");
      } else {
        await createTicket(formData);
        toast.success("สร้างตั๋วสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกตั๋วล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (ticket) => {
    setDeletingTicket(ticket);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingTicket) return;
    try {
      await deleteTicket(deletingTicket.ticketId);
      toast.success("ลบตั๋วสำเร็จ");
      deleteModal.onClose();
      setDeletingTicket(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบตั๋วล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    tickets,
    loading,
    saving,
    editingTicket,
    formData,
    validationErrors,
    deletingTicket,
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
