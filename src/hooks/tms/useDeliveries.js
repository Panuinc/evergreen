"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getDeliveries,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  getShipments,
} from "@/actions/tms";

const emptyForm = {
  tmsDeliveryShipmentId: "",
  tmsDeliveryReceiverName: "",
  tmsDeliveryReceiverPhone: "",
  tmsDeliveryStatus: "pending",
  tmsDeliveryDamageNotes: "",
  tmsDeliveryNotes: "",
  tmsDeliverySignatureUrl: "",
  tmsDeliveryPhotoUrls: [],
};

export function useDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingDelivery, setDeletingDelivery] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [delData, shipData] = await Promise.all([
        getDeliveries(),
        getShipments(),
      ]);
      setDeliveries(delData);
      setShipments(shipData);
    } catch (error) {
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (delivery = null) => {
    if (delivery) {
      setEditingDelivery(delivery);
      setFormData({
        tmsDeliveryShipmentId: delivery.tmsDeliveryShipmentId?.toString() || "",
        tmsDeliveryReceiverName: delivery.tmsDeliveryReceiverName || "",
        tmsDeliveryReceiverPhone: delivery.tmsDeliveryReceiverPhone || "",
        tmsDeliveryStatus: delivery.tmsDeliveryStatus || "pending",
        tmsDeliveryDamageNotes: delivery.tmsDeliveryDamageNotes || "",
        tmsDeliveryNotes: delivery.tmsDeliveryNotes || "",
        tmsDeliverySignatureUrl: delivery.tmsDeliverySignatureUrl || "",
        tmsDeliveryPhotoUrls: delivery.tmsDeliveryPhotoUrls || [],
      });
    } else {
      setEditingDelivery(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.tmsDeliveryShipmentId) {
      toast.error("กรุณาระบุการจัดส่ง");
      return;
    }

    try {
      setSaving(true);
      if (editingDelivery) {
        await updateDelivery(editingDelivery.tmsDeliveryId, formData);
        toast.success("อัปเดตการส่งมอบสำเร็จ");
      } else {
        await createDelivery(formData);
        toast.success("สร้างการส่งมอบสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกการส่งมอบล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (delivery) => {
    setDeletingDelivery(delivery);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingDelivery) return;
    try {
      await deleteDelivery(deletingDelivery.tmsDeliveryId);
      toast.success("ลบการส่งมอบสำเร็จ");
      deleteModal.onClose();
      setDeletingDelivery(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบการส่งมอบล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    deliveries,
    shipments,
    loading,
    saving,
    editingDelivery,
    formData,
    deletingDelivery,
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
