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
      toast.error("Failed to load software");
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
      softwareName: [(v) => !isRequired(v) && "Software name is required"],
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
        toast.success("Software updated");
      } else {
        await createSoftware(payload);
        toast.success("Software created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save software");
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
      toast.success("Software deleted");
      deleteModal.onClose();
      setDeletingSoftware(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete software");
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
