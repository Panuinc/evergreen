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
  getDeliveryPlanById,
  updateDeliveryPlan,
} from "@/modules/tms/actions";

const emptyForm = {
  tmsShipmentCustomerName: "",
  tmsShipmentCustomerPhone: "",
  tmsShipmentCustomerAddress: "",
  tmsShipmentDestination: "",
  tmsShipmentRouteId: "",
  tmsShipmentVehicleId: "",
  tmsShipmentDriverId: "",
  tmsShipmentAssistantId: "",
  tmsShipmentSalesOrderRef: "",
  tmsShipmentItemsSummary: "",
  tmsShipmentWeightKg: "",
  tmsShipmentNotes: "",
  tmsShipmentEstimatedArrival: "",
};

export function useShipments(fromPlanId = null) {
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

  // Pre-fill form from delivery plan when planId is in URL
  useEffect(() => {
    if (!fromPlanId) return;
    getDeliveryPlanById(fromPlanId)
      .then((plan) => {
        if (!plan) return;
        const items = plan.tmsDeliveryPlanItem || [];
        const firstItem = items[0];
        const itemsSummary = items
          .map(
            (i) =>
              `${i.tmsDeliveryPlanItemDescription} x${i.tmsDeliveryPlanItemPlannedQty} ${i.tmsDeliveryPlanItemUom}`
          )
          .join(", ");

        setFormData({
          ...emptyForm,
          tmsShipmentCustomerName: firstItem?.tmsDeliveryPlanItemCustomerName || "",
          tmsShipmentCustomerAddress: plan.tmsDeliveryPlanAddress || "",
          tmsShipmentDestination: plan.tmsDeliveryPlanAddress || "",
          tmsShipmentSalesOrderRef: firstItem?.tmsDeliveryPlanItemSalesOrderNo || "",
          tmsShipmentItemsSummary: itemsSummary,
        });
        setEditingShipment(null);
        onOpen();
      })
      .catch(() => {});
  }, [fromPlanId]);

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
    } catch {
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (shipment = null) => {
    if (shipment) {
      setEditingShipment(shipment);
      setFormData({
        tmsShipmentCustomerName: shipment.tmsShipmentCustomerName || "",
        tmsShipmentCustomerPhone: shipment.tmsShipmentCustomerPhone || "",
        tmsShipmentCustomerAddress: shipment.tmsShipmentCustomerAddress || "",
        tmsShipmentDestination: shipment.tmsShipmentDestination || "",
        tmsShipmentRouteId: shipment.tmsShipmentRouteId?.toString() || "",
        tmsShipmentVehicleId: shipment.tmsShipmentVehicleId?.toString() || "",
        tmsShipmentDriverId: shipment.tmsShipmentDriverId?.toString() || "",
        tmsShipmentAssistantId: shipment.tmsShipmentAssistantId?.toString() || "",
        tmsShipmentSalesOrderRef: shipment.tmsShipmentSalesOrderRef || "",
        tmsShipmentItemsSummary: shipment.tmsShipmentItemsSummary || "",
        tmsShipmentWeightKg: shipment.tmsShipmentWeightKg?.toString() || "",
        tmsShipmentNotes: shipment.tmsShipmentNotes || "",
        tmsShipmentEstimatedArrival: shipment.tmsShipmentEstimatedArrival || "",
      });
    } else {
      setEditingShipment(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (
      !formData.tmsShipmentCustomerName.trim() ||
      !formData.tmsShipmentDestination.trim()
    ) {
      toast.error("กรุณาระบุชื่อลูกค้าและปลายทาง");
      return;
    }

    try {
      setSaving(true);
      if (editingShipment) {
        await updateShipment(editingShipment.tmsShipmentId, formData);
        toast.success("อัปเดตการจัดส่งสำเร็จ");
      } else {
        const newShipment = await createShipment(formData);
        toast.success("สร้างการจัดส่งสำเร็จ");

        // Link shipment back to the delivery plan that triggered creation
        if (fromPlanId && newShipment?.tmsShipmentId) {
          await updateDeliveryPlan(fromPlanId, {
            tmsDeliveryPlanShipmentId: newShipment.tmsShipmentId,
            tmsDeliveryPlanShipmentNumber: newShipment.tmsShipmentNumber,
            tmsDeliveryPlanStatus: "in_progress",
          });
        }
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกการจัดส่งล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (shipmentId, newStatus) => {
    try {
      await updateShipmentStatus(shipmentId, newStatus);
      toast.success("อัปเดตสถานะการจัดส่งสำเร็จ");
      loadData();
    } catch (error) {
      toast.error(error.message || "อัปเดตสถานะล้มเหลว");
    }
  };

  const confirmDelete = (shipment) => {
    setDeletingShipment(shipment);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingShipment) return;
    try {
      await deleteShipment(deletingShipment.tmsShipmentId);
      toast.success("ลบการจัดส่งสำเร็จ");
      deleteModal.onClose();
      setDeletingShipment(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบการจัดส่งล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateShipment(item.tmsShipmentId, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      loadData();
    } catch {
      toast.error("เปลี่ยนสถานะล้มเหลว");
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
    toggleActive,
  };
}
