"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getSoftware,
  createSoftware,
  updateSoftware,
  deleteSoftware,
} from "@/modules/it/actions";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  itSoftwareName: "",
  itSoftwareVendor: "",
  itSoftwareVersion: "",
  itSoftwareLicenseKey: "",
  itSoftwareLicenseType: "perpetual",
  itSoftwareLicenseCount: "",
  itSoftwareUsedCount: "",
  itSoftwareExpiryDate: "",
  itSoftwareStatus: "active",
  itSoftwareNotes: "",
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
        itSoftwareName: item.itSoftwareName || "",
        itSoftwareVendor: item.itSoftwareVendor || "",
        itSoftwareVersion: item.itSoftwareVersion || "",
        itSoftwareLicenseKey: item.itSoftwareLicenseKey || "",
        itSoftwareLicenseType: item.itSoftwareLicenseType || "perpetual",
        itSoftwareLicenseCount: item.itSoftwareLicenseCount?.toString() || "",
        itSoftwareUsedCount: item.itSoftwareUsedCount?.toString() || "",
        itSoftwareExpiryDate: item.itSoftwareExpiryDate || "",
        itSoftwareStatus: item.itSoftwareStatus || "active",
        itSoftwareNotes: item.itSoftwareNotes || "",
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
      itSoftwareName: [(v) => !isRequired(v) && "กรุณาระบุชื่อซอฟต์แวร์"],
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
        itSoftwareLicenseCount: formData.itSoftwareLicenseCount ? parseInt(formData.itSoftwareLicenseCount) : 0,
        itSoftwareUsedCount: formData.itSoftwareUsedCount ? parseInt(formData.itSoftwareUsedCount) : 0,
      };
      if (editingSoftware) {
        await updateSoftware(editingSoftware.itSoftwareId, payload);
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
      await deleteSoftware(deletingSoftware.itSoftwareId);
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
