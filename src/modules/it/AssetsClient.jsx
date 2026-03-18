"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import { validateForm, isRequired } from "@/lib/validation";
import AssetsView from "@/modules/it/components/AssetsView";

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

export default function AssetsClient({ initialAssets, initialEmployees }) {
  const [assets, setAssets] = useState(initialAssets);
  const [employees] = useState(initialEmployees);
  const [saving, setSaving] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingAsset, setDeletingAsset] = useState(null);

  const reloadAssets = async () => {
    try {
      const { get } = await import("@/lib/apiClient");
      const data = await get("/api/it/assets");
      setAssets(data);
    } catch {}
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
        await put(`/api/it/assets/${editingAsset.itAssetId}`, formData);
        toast.success("อัปเดตทรัพย์สินสำเร็จ");
      } else {
        await post("/api/it/assets", formData);
        toast.success("สร้างทรัพย์สินสำเร็จ");
      }
      onClose();
      reloadAssets();
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
      await del(`/api/it/assets/${deletingAsset.itAssetId}`);
      toast.success("ลบทรัพย์สินสำเร็จ");
      deleteModal.onClose();
      setDeletingAsset(null);
      reloadAssets();
    } catch (error) {
      toast.error(error.message || "ลบทรัพย์สินล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await put(`/api/it/assets/${item.itAssetId}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      reloadAssets();
    } catch {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AssetsView
      assets={assets}
      employees={employees}
      loading={false}
      saving={saving}
      editingAsset={editingAsset}
      formData={formData}
      validationErrors={validationErrors}
      deletingAsset={deletingAsset}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
      toggleActive={toggleActive}
    />
  );
}
