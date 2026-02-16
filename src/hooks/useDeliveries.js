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
  deliveryShipmentId: "",
  deliveryReceiverName: "",
  deliveryReceiverPhone: "",
  deliveryStatus: "pending",
  deliveryDamageNotes: "",
  deliveryNotes: "",
  deliverySignatureUrl: "",
  deliveryPhotoUrls: [],
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
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (delivery = null) => {
    if (delivery) {
      setEditingDelivery(delivery);
      setFormData({
        deliveryShipmentId: delivery.deliveryShipmentId?.toString() || "",
        deliveryReceiverName: delivery.deliveryReceiverName || "",
        deliveryReceiverPhone: delivery.deliveryReceiverPhone || "",
        deliveryStatus: delivery.deliveryStatus || "pending",
        deliveryDamageNotes: delivery.deliveryDamageNotes || "",
        deliveryNotes: delivery.deliveryNotes || "",
        deliverySignatureUrl: delivery.deliverySignatureUrl || "",
        deliveryPhotoUrls: delivery.deliveryPhotoUrls || [],
      });
    } else {
      setEditingDelivery(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.deliveryShipmentId) {
      toast.error("Shipment is required");
      return;
    }

    try {
      setSaving(true);
      if (editingDelivery) {
        await updateDelivery(editingDelivery.deliveryId, formData);
        toast.success("Delivery updated");
      } else {
        await createDelivery(formData);
        toast.success("Delivery created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save delivery");
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
      await deleteDelivery(deletingDelivery.deliveryId);
      toast.success("Delivery deleted");
      deleteModal.onClose();
      setDeletingDelivery(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete delivery");
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
