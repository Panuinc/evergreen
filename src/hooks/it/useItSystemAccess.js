"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getSystemAccess,
  createSystemAccess,
  updateSystemAccess,
  deleteSystemAccess,
} from "@/actions/it";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  itSystemAccessSystem: "",
  itSystemAccessType: "grant",
  itSystemAccessRequestedFor: "",
  itSystemAccessRequestedBy: "",
  itSystemAccessStatus: "pending",
  itSystemAccessApprovedBy: "",
  itSystemAccessNotes: "",
};

export function useItSystemAccess() {
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingAccess, setEditingAccess] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingAccess, setDeletingAccess] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSystemAccess();
      setAccessRequests(data);
    } catch (error) {
      toast.error("โหลดคำขอเข้าถึงระบบล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (access = null) => {
    if (access) {
      setEditingAccess(access);
      setFormData({
        itSystemAccessSystem: access.itSystemAccessSystem || "",
        itSystemAccessType: access.itSystemAccessType || "grant",
        itSystemAccessRequestedFor: access.itSystemAccessRequestedFor || "",
        itSystemAccessRequestedBy: access.itSystemAccessRequestedBy || "",
        itSystemAccessStatus: access.itSystemAccessStatus || "pending",
        itSystemAccessApprovedBy: access.itSystemAccessApprovedBy || "",
        itSystemAccessNotes: access.itSystemAccessNotes || "",
      });
    } else {
      setEditingAccess(null);
      setFormData(emptyForm);
    }
    setValidationErrors({});
    onOpen();
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm(formData, {
      itSystemAccessSystem: [(v) => !isRequired(v) && "กรุณาระบุชื่อระบบ"],
    });
    if (!isValid) {
      setValidationErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    setValidationErrors({});

    try {
      setSaving(true);
      if (editingAccess) {
        await updateSystemAccess(editingAccess.itSystemAccessId, formData);
        toast.success("อัปเดตคำขอเข้าถึงสำเร็จ");
      } else {
        await createSystemAccess(formData);
        toast.success("สร้างคำขอเข้าถึงสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกคำขอเข้าถึงล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (access) => {
    setDeletingAccess(access);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingAccess) return;
    try {
      await deleteSystemAccess(deletingAccess.itSystemAccessId);
      toast.success("ลบคำขอเข้าถึงสำเร็จ");
      deleteModal.onClose();
      setDeletingAccess(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบคำขอเข้าถึงล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    accessRequests,
    loading,
    saving,
    editingAccess,
    formData,
    validationErrors,
    deletingAccess,
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
