"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
} from "@/actions/it";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  itAssetName: "",
  itAssetTag: "",
  itAssetCategory: "computer",
  itAssetBrand: "",
  itAssetModel: "",
  itAssetSerialNumber: "",
  itAssetStatus: "active",
  itAssetAssignedTo: "",
  itAssetLocation: "",
  itAssetPurchaseDate: "",
  itAssetWarrantyExpiry: "",
  itAssetNotes: "",
};

export function useItAssets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingAsset, setDeletingAsset] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAssets();
      setAssets(data);
    } catch (error) {
      toast.error("โหลดทรัพย์สินล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (asset = null) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        itAssetName: asset.itAssetName || "",
        itAssetTag: asset.itAssetTag || "",
        itAssetCategory: asset.itAssetCategory || "computer",
        itAssetBrand: asset.itAssetBrand || "",
        itAssetModel: asset.itAssetModel || "",
        itAssetSerialNumber: asset.itAssetSerialNumber || "",
        itAssetStatus: asset.itAssetStatus || "active",
        itAssetAssignedTo: asset.itAssetAssignedTo || "",
        itAssetLocation: asset.itAssetLocation || "",
        itAssetPurchaseDate: asset.itAssetPurchaseDate || "",
        itAssetWarrantyExpiry: asset.itAssetWarrantyExpiry || "",
        itAssetNotes: asset.itAssetNotes || "",
      });
    } else {
      setEditingAsset(null);
      setFormData(emptyForm);
    }
    setValidationErrors({});
    onOpen();
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm(formData, {
      itAssetName: [(v) => !isRequired(v) && "กรุณาระบุชื่อทรัพย์สิน"],
    });
    if (!isValid) {
      setValidationErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    setValidationErrors({});

    try {
      setSaving(true);
      if (editingAsset) {
        await updateAsset(editingAsset.itAssetId, formData);
        toast.success("อัปเดตทรัพย์สินสำเร็จ");
      } else {
        await createAsset(formData);
        toast.success("สร้างทรัพย์สินสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกทรัพย์สินล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (asset) => {
    setDeletingAsset(asset);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingAsset) return;
    try {
      await deleteAsset(deletingAsset.itAssetId);
      toast.success("ลบทรัพย์สินสำเร็จ");
      deleteModal.onClose();
      setDeletingAsset(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบทรัพย์สินล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    assets,
    loading,
    saving,
    editingAsset,
    formData,
    validationErrors,
    deletingAsset,
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
