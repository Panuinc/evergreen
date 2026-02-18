"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getDivisions,
  createDivision,
  updateDivision,
  deleteDivision,
} from "@/actions/hr";

const emptyForm = {
  divisionName: "",
  divisionDescription: "",
};

export function useDivisions() {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDiv, setEditingDiv] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingDiv, setDeletingDiv] = useState(null);

  useEffect(() => {
    loadDivisions();
  }, []);

  const loadDivisions = async () => {
    try {
      setLoading(true);
      const data = await getDivisions();
      setDivisions(data);
    } catch (error) {
      toast.error("Failed to load divisions");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (div = null) => {
    if (div) {
      setEditingDiv(div);
      setFormData({
        divisionName: div.divisionName || "",
        divisionDescription: div.divisionDescription || "",
      });
    } else {
      setEditingDiv(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.divisionName.trim()) {
      toast.error("Division name is required");
      return;
    }

    try {
      setSaving(true);
      if (editingDiv) {
        await updateDivision(editingDiv.divisionId, formData);
        toast.success("Division updated");
      } else {
        await createDivision(formData);
        toast.success("Division created");
      }
      onClose();
      loadDivisions();
    } catch (error) {
      toast.error(error.message || "Failed to save division");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (div) => {
    setDeletingDiv(div);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingDiv) return;
    try {
      await deleteDivision(deletingDiv.divisionId);
      toast.success("Division deleted");
      deleteModal.onClose();
      setDeletingDiv(null);
      loadDivisions();
    } catch (error) {
      toast.error(error.message || "Failed to delete division");
    }
  };

  return {
    divisions,
    loading,
    saving,
    editingDiv,
    formData,
    setFormData,
    deletingDiv,
    isOpen,
    onClose,
    deleteModal,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  };
}
