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
  assetName: "",
  assetTag: "",
  assetCategory: "computer",
  assetBrand: "",
  assetModel: "",
  assetSerialNumber: "",
  assetStatus: "active",
  assetAssignedTo: "",
  assetLocation: "",
  assetPurchaseDate: "",
  assetWarrantyExpiry: "",
  assetNotes: "",
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
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (asset = null) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        assetName: asset.assetName || "",
        assetTag: asset.assetTag || "",
        assetCategory: asset.assetCategory || "computer",
        assetBrand: asset.assetBrand || "",
        assetModel: asset.assetModel || "",
        assetSerialNumber: asset.assetSerialNumber || "",
        assetStatus: asset.assetStatus || "active",
        assetAssignedTo: asset.assetAssignedTo || "",
        assetLocation: asset.assetLocation || "",
        assetPurchaseDate: asset.assetPurchaseDate || "",
        assetWarrantyExpiry: asset.assetWarrantyExpiry || "",
        assetNotes: asset.assetNotes || "",
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
      assetName: [(v) => !isRequired(v) && "Asset name is required"],
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
        await updateAsset(editingAsset.assetId, formData);
        toast.success("Asset updated");
      } else {
        await createAsset(formData);
        toast.success("Asset created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save asset");
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
      await deleteAsset(deletingAsset.assetId);
      toast.success("Asset deleted");
      deleteModal.onClose();
      setDeletingAsset(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete asset");
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
