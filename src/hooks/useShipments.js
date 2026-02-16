"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getShipments,
  createShipment,
  updateShipment,
  deleteShipment,
  updateShipmentStatus,
  getVehicles,
  getDrivers,
  getRoutes,
} from "@/actions/tms";

const emptyForm = {
  shipmentCustomerName: "",
  shipmentCustomerPhone: "",
  shipmentCustomerAddress: "",
  shipmentDestination: "",
  shipmentRouteId: "",
  shipmentVehicleId: "",
  shipmentDriverId: "",
  shipmentAssistantId: "",
  shipmentSalesOrderRef: "",
  shipmentItemsSummary: "",
  shipmentWeightKg: "",
  shipmentNotes: "",
  shipmentEstimatedArrival: "",
};

export function useShipments() {
  const [shipments, setShipments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingShipment, setDeletingShipment] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shipData, vehData, drvData, routeData] = await Promise.all([
        getShipments(),
        getVehicles(),
        getDrivers(),
        getRoutes(),
      ]);
      setShipments(shipData);
      setVehicles(vehData);
      setDrivers(drvData);
      setRoutes(routeData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (shipment = null) => {
    if (shipment) {
      setEditingShipment(shipment);
      setFormData({
        shipmentCustomerName: shipment.shipmentCustomerName || "",
        shipmentCustomerPhone: shipment.shipmentCustomerPhone || "",
        shipmentCustomerAddress: shipment.shipmentCustomerAddress || "",
        shipmentDestination: shipment.shipmentDestination || "",
        shipmentRouteId: shipment.shipmentRouteId?.toString() || "",
        shipmentVehicleId: shipment.shipmentVehicleId?.toString() || "",
        shipmentDriverId: shipment.shipmentDriverId?.toString() || "",
        shipmentAssistantId: shipment.shipmentAssistantId?.toString() || "",
        shipmentSalesOrderRef: shipment.shipmentSalesOrderRef || "",
        shipmentItemsSummary: shipment.shipmentItemsSummary || "",
        shipmentWeightKg: shipment.shipmentWeightKg?.toString() || "",
        shipmentNotes: shipment.shipmentNotes || "",
        shipmentEstimatedArrival: shipment.shipmentEstimatedArrival || "",
      });
    } else {
      setEditingShipment(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (
      !formData.shipmentCustomerName.trim() ||
      !formData.shipmentDestination.trim()
    ) {
      toast.error("Customer name and destination are required");
      return;
    }

    try {
      setSaving(true);
      if (editingShipment) {
        await updateShipment(editingShipment.shipmentId, formData);
        toast.success("Shipment updated");
      } else {
        await createShipment(formData);
        toast.success("Shipment created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save shipment");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (shipmentId, newStatus) => {
    try {
      await updateShipmentStatus(shipmentId, newStatus);
      toast.success("Shipment status updated");
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const confirmDelete = (shipment) => {
    setDeletingShipment(shipment);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingShipment) return;
    try {
      await deleteShipment(deletingShipment.shipmentId);
      toast.success("Shipment deleted");
      deleteModal.onClose();
      setDeletingShipment(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete shipment");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    shipments,
    vehicles,
    drivers,
    routes,
    loading,
    saving,
    editingShipment,
    formData,
    deletingShipment,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
    handleStatusChange,
  };
}
