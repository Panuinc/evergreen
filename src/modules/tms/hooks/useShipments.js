"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getShipments,
  createShipment,
  updateShipment,
  deleteShipment,
  updateShipmentStatus,
  getVehicles,
  getDeliveryPlans,
  getDeliveryPlanById,
  updateDeliveryPlan,
  calculateDistance,
} from "@/modules/tms/actions";
import { getEmployees } from "@/modules/hr/actions";
import { COMPANY_HQ } from "@/modules/tms/constants";

const DEFAULT_FUEL_PRICE = 30; // ราคาดีเซลเริ่มต้น (บาท/ลิตร)

const emptyForm = {
  tmsShipmentCustomerName: "",
  tmsShipmentCustomerPhone: "",
  tmsShipmentCustomerAddress: "",
  tmsShipmentDestination: "",
  tmsShipmentVehicleId: "",
  tmsShipmentDriverId: "",
  tmsShipmentDriverWage: "",
  tmsShipmentAssistants: [{ id: "", wage: "" }],
  tmsShipmentSalesOrderRef: "",
  tmsShipmentItemsSummary: "",

  tmsShipmentDistance: "",
  tmsShipmentFuelPricePerLiter: String(DEFAULT_FUEL_PRICE),
  tmsShipmentFuelCost: "",
  tmsShipmentExtras: [],
  tmsShipmentNotes: "",
  tmsShipmentDate: "",
  tmsShipmentEstimatedArrival: "",
};

function getMonthKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function buildPlanItems(plan) {
  return (plan.tmsDeliveryPlanItem || []).map((i) => ({
    id: i.tmsDeliveryPlanItemId,
    soNo: i.tmsDeliveryPlanItemSalesOrderNo || "",
    description: i.tmsDeliveryPlanItemDescription || "",
    uom: i.tmsDeliveryPlanItemUom || "",
    plannedQty: parseFloat(i.tmsDeliveryPlanItemPlannedQty) || 0,
    actualQty: parseFloat(i.tmsDeliveryPlanItemPlannedQty) || 0,
  }));
}

function itemsToSummary(items) {
  return items
    .map((i) => `${i.description} x${i.actualQty} ${i.uom}`)
    .join(", ");
}

function fillFormFromPlan(plan) {
  const items = plan.tmsDeliveryPlanItem || [];
  const firstItem = items[0];

  return {
    ...emptyForm,
    tmsShipmentDate: plan.tmsDeliveryPlanDate || "",
    tmsShipmentCustomerName: firstItem?.tmsDeliveryPlanItemCustomerName || "",
    tmsShipmentCustomerAddress: plan.tmsDeliveryPlanAddress || "",
    tmsShipmentDestination: plan.tmsDeliveryPlanAddress || "",
    tmsShipmentSalesOrderRef: firstItem?.tmsDeliveryPlanItemSalesOrderNo || "",
    tmsShipmentItemsSummary: "",
  };
}

export function useShipments(fromPlanId = null) {
  const [shipments, setShipments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingShipment, setDeletingShipment] = useState(null);

  // Delivery plan selection
  const [deliveryPlans, setDeliveryPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  // Shipment items from plan (planned vs actual)
  const [shipmentItems, setShipmentItems] = useState([]);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const distanceTimer = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-calculate distance when destination changes (debounced)
  const fetchDistance = useCallback(async (destination) => {
    if (!destination || destination.trim().length < 5) return;
    try {
      setDistanceLoading(true);
      const result = await calculateDistance(null, destination, COMPANY_HQ.lat, COMPANY_HQ.lng);
      if (result?.distanceKm) {
        setFormData((prev) => ({
          ...prev,
          tmsShipmentDistance: String(result.distanceKm),
        }));
      }
    } catch {
      // silent - user can still input manually
    } finally {
      setDistanceLoading(false);
    }
  }, []);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Auto-fetch distance when destination changes
    if (field === "tmsShipmentDestination") {
      clearTimeout(distanceTimer.current);
      distanceTimer.current = setTimeout(() => fetchDistance(value), 800);
    }
  };

  const loadDeliveryPlans = async () => {
    try {
      setPlansLoading(true);
      // Load current month and next month plans with status "planned"
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(now.getMonth() + 1);
      const [cur, next] = await Promise.all([
        getDeliveryPlans(getMonthKey(now)),
        getDeliveryPlans(getMonthKey(nextMonth)),
      ]);
      const all = [...(cur || []), ...(next || [])];
      // Only show plans that are "planned" (not yet in progress/completed)
      setDeliveryPlans(all.filter((p) => p.tmsDeliveryPlanStatus === "planned"));
    } catch {
      // silent
    } finally {
      setPlansLoading(false);
    }
  };

  const selectDeliveryPlan = (planId) => {
    setSelectedPlanId(planId);
    if (!planId) {
      setFormData(emptyForm);
      setShipmentItems([]);
      return;
    }
    const plan = deliveryPlans.find((p) => String(p.tmsDeliveryPlanId) === String(planId));
    if (plan) {
      const filled = fillFormFromPlan(plan);
      filled.tmsShipmentFuelPricePerLiter = String(DEFAULT_FUEL_PRICE);
      setFormData(filled);
      setShipmentItems(buildPlanItems(plan));
      if (filled.tmsShipmentDestination) {
        fetchDistance(filled.tmsShipmentDestination);
      }
    }
  };

  const updateItemActualQty = (itemId, value) => {
    setShipmentItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, actualQty: parseFloat(value) || 0 } : item
      )
    );
  };

  // Pre-fill form from delivery plan when planId is in URL
  useEffect(() => {
    if (!fromPlanId) return;
    getDeliveryPlanById(fromPlanId)
      .then((plan) => {
        if (!plan) return;
        const filled = fillFormFromPlan(plan);
        filled.tmsShipmentFuelPricePerLiter = String(DEFAULT_FUEL_PRICE);
        setFormData(filled);
        setShipmentItems(buildPlanItems(plan));
        if (filled.tmsShipmentDestination) {
          fetchDistance(filled.tmsShipmentDestination);
        }
        setSelectedPlanId(fromPlanId);
        setEditingShipment(null);
        onOpen();
      })
      .catch(() => {});
  }, [fromPlanId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shipData, vehData, empData] = await Promise.all([
        getShipments(),
        getVehicles(),
        getEmployees(),
      ]);
      setShipments(shipData);
      setVehicles(vehData);
      setEmployees(empData || []);
    } catch {
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (shipment = null) => {
    if (shipment) {
      setEditingShipment(shipment);
      setSelectedPlanId(null);
      setShipmentItems([]);
      setFormData({
        tmsShipmentCustomerName: shipment.tmsShipmentCustomerName || "",
        tmsShipmentCustomerPhone: shipment.tmsShipmentCustomerPhone || "",
        tmsShipmentCustomerAddress: shipment.tmsShipmentCustomerAddress || "",
        tmsShipmentDestination: shipment.tmsShipmentDestination || "",
        tmsShipmentVehicleId: shipment.tmsShipmentVehicleId?.toString() || "",
        tmsShipmentDriverId: shipment.tmsShipmentDriverId?.toString() || "",
        tmsShipmentDriverWage: shipment.tmsShipmentDriverWage?.toString() || "",
        tmsShipmentAssistants: shipment.tmsShipmentAssistants?.length > 0
          ? shipment.tmsShipmentAssistants.map((a) => ({ id: a.id?.toString() || "", wage: a.wage?.toString() || "" }))
          : [{ id: shipment.tmsShipmentAssistantId?.toString() || "", wage: shipment.tmsShipmentAssistantWage?.toString() || "" }],
        tmsShipmentSalesOrderRef: shipment.tmsShipmentSalesOrderRef || "",
        tmsShipmentItemsSummary: shipment.tmsShipmentItemsSummary || "",

        tmsShipmentDistance: shipment.tmsShipmentDistance?.toString() || "",
        tmsShipmentFuelPricePerLiter: shipment.tmsShipmentFuelPricePerLiter?.toString() || "",
        tmsShipmentFuelCost: shipment.tmsShipmentFuelCost?.toString() || "",
        tmsShipmentExtras: shipment.tmsShipmentExtras || [],
        tmsShipmentNotes: shipment.tmsShipmentNotes || "",
        tmsShipmentDate: shipment.tmsShipmentDate || "",
        tmsShipmentEstimatedArrival: shipment.tmsShipmentEstimatedArrival || "",
      });
    } else {
      setEditingShipment(null);
      setSelectedPlanId(null);
      setShipmentItems([]);
      setFormData(emptyForm);
      loadDeliveryPlans();
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
      // Generate items summary from shipment items table
      const saveData = { ...formData };
      // Extract assistants as jsonb array
      const assistants = (saveData.tmsShipmentAssistants || []).filter((a) => a.id);
      saveData.tmsShipmentAssistants = assistants.length > 0 ? assistants : null;
      // Auto-calculate OT amounts in extras
      const extras = (saveData.tmsShipmentExtras || []).map((ex) => {
        if (ex.type !== "ot") return ex;
        const wage = getWageForPerson(ex.person, saveData);
        const hours = parseFloat(ex.hours) || 0;
        const rate = parseFloat(ex.rate) || 1.5;
        return { ...ex, amount: wage > 0 && hours > 0 ? parseFloat(((wage / 8) * rate * hours).toFixed(2)) : 0 };
      });
      saveData.tmsShipmentExtras = extras.length > 0 ? extras : null;
      // Convert empty strings to null for non-text fields
      for (const key of Object.keys(saveData)) {
        if (saveData[key] === "") saveData[key] = null;
      }
      if (shipmentItems.length > 0) {
        saveData.tmsShipmentItemsSummary = itemsToSummary(shipmentItems);
      }
      // Auto-calculate fuel cost
      const selectedVehicle = vehicles.find((v) => String(v.tmsVehicleId) === String(saveData.tmsShipmentVehicleId));
      const rate = parseFloat(selectedVehicle?.tmsVehicleFuelConsumptionRate) || 0;
      const distance = parseFloat(saveData.tmsShipmentDistance) || 0;
      const price = parseFloat(saveData.tmsShipmentFuelPricePerLiter) || 0;
      if (rate > 0 && distance > 0 && price > 0) {
        saveData.tmsShipmentFuelCost = parseFloat(((distance / rate) * price).toFixed(2));
      }

      if (editingShipment) {
        await updateShipment(editingShipment.tmsShipmentId, saveData);
        toast.success("อัปเดตการจัดส่งสำเร็จ");
      } else {
        const newShipment = await createShipment(saveData);
        toast.success("สร้างการจัดส่งสำเร็จ");

        // Link shipment back to the delivery plan
        const planIdToLink = selectedPlanId || fromPlanId;
        if (planIdToLink && newShipment?.tmsShipmentId) {
          await updateDeliveryPlan(planIdToLink, {
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

  const getWageForPerson = (person, data = formData) => {
    if (person === "driver") return parseFloat(data.tmsShipmentDriverWage) || 0;
    const match = person?.match(/^assistant-(\d+)$/);
    if (match) {
      const idx = parseInt(match[1]);
      const assistants = data.tmsShipmentAssistants || [];
      return parseFloat(assistants[idx]?.wage) || 0;
    }
    return 0;
  };

  const addExtra = () => {
    setFormData((prev) => ({
      ...prev,
      tmsShipmentExtras: [
        ...(prev.tmsShipmentExtras || []),
        { person: "driver", type: "ot", hours: "", rate: "1.5", label: "", amount: "" },
      ],
    }));
  };

  const updateExtra = (index, field, value) => {
    setFormData((prev) => {
      const extras = [...(prev.tmsShipmentExtras || [])];
      extras[index] = { ...extras[index], [field]: value };
      // Auto-calc OT amount
      const ex = extras[index];
      if (ex.type === "ot") {
        const wage = getWageForPerson(ex.person, prev);
        const hours = parseFloat(ex.hours) || 0;
        const rate = parseFloat(ex.rate) || 1.5;
        ex.amount = wage > 0 && hours > 0 ? parseFloat(((wage / 8) * rate * hours).toFixed(2)) : "";
      }
      return { ...prev, tmsShipmentExtras: extras };
    });
  };

  const removeExtra = (index) => {
    setFormData((prev) => ({
      ...prev,
      tmsShipmentExtras: (prev.tmsShipmentExtras || []).filter((_, i) => i !== index),
    }));
  };

  return {
    shipments,
    vehicles,
    employees,
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
    deliveryPlans,
    plansLoading,
    selectedPlanId,
    selectDeliveryPlan,
    shipmentItems,
    updateItemActualQty,
    distanceLoading,
    addExtra,
    updateExtra,
    removeExtra,
  };
}
