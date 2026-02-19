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
      toast.error("Failed to load tickets");
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
      ticketTitle: [(v) => !isRequired(v) && "Ticket title is required"],
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
        toast.success("Ticket updated");
      } else {
        await createTicket(formData);
        toast.success("Ticket created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save ticket");
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
      toast.success("Ticket deleted");
      deleteModal.onClose();
      setDeletingTicket(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete ticket");
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
