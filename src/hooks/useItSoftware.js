"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getSoftware,
  createSoftware,
  updateSoftware,
  deleteSoftware,
} from "@/actions/it";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  softwareName: "",
  softwareVendor: "",
  softwareVersion: "",
  softwareLicenseKey: "",
  softwareLicenseType: "perpetual",
  softwareLicenseCount: "",
  softwareUsedCount: "",
  softwareExpiryDate: "",
  softwareStatus: "active",
  softwareNotes: "",
};

export function useItSoftware() {
  const [software, setSoftware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingSoftware, setDeletingSoftware] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSoftware();
      setSoftware(data);
    } catch (error) {
      toast.error("โหลดข้อมูลซอฟต์แวร์ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (item = null) => {
    if (item) {
      setEditingSoftware(item);
      setFormData({
        softwareName: item.softwareName || "",
        softwareVendor: item.softwareVendor || "",
        softwareVersion: item.softwareVersion || "",
        softwareLicenseKey: item.softwareLicenseKey || "",
        softwareLicenseType: item.softwareLicenseType || "perpetual",
        softwareLicenseCount: item.softwareLicenseCount?.toString() || "",
        softwareUsedCount: item.softwareUsedCount?.toString() || "",
        softwareExpiryDate: item.softwareExpiryDate || "",
        softwareStatus: item.softwareStatus || "active",
        softwareNotes: item.softwareNotes || "",
      });
    } else {
      setEditingSoftware(null);
      setFormData(emptyForm);
    }
    setValidationErrors({});
    onOpen();
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm(formData, {
      softwareName: [(v) => !isRequired(v) && "กรุณาระบุชื่อซอฟต์แวร์"],
    });
    if (!isValid) {
      setValidationErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    setValidationErrors({});

    try {
      setSaving(true);
      const payload = {
        ...formData,
        softwareLicenseCount: formData.softwareLicenseCount ? parseInt(formData.softwareLicenseCount) : 0,
        softwareUsedCount: formData.softwareUsedCount ? parseInt(formData.softwareUsedCount) : 0,
      };
      if (editingSoftware) {
        await updateSoftware(editingSoftware.softwareId, payload);
        toast.success("อัปเดตซอฟต์แวร์สำเร็จ");
      } else {
        await createSoftware(payload);
        toast.success("สร้างซอฟต์แวร์สำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกซอฟต์แวร์ล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item) => {
    setDeletingSoftware(item);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingSoftware) return;
    try {
      await deleteSoftware(deletingSoftware.softwareId);
      toast.success("ลบซอฟต์แวร์สำเร็จ");
      deleteModal.onClose();
      setDeletingSoftware(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบซอฟต์แวร์ล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    software,
    loading,
    saving,
    editingSoftware,
    formData,
    validationErrors,
    deletingSoftware,
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
