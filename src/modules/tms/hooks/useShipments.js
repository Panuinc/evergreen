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

const DEFAULT_FUEL_PRICE = 30;

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

function buildStopFromPlan(plan, seq) {
  const firstItem = (plan.tmsDeliveryPlanItem || [])[0];
  return {
    planId: plan.tmsDeliveryPlanId,
    seq,
    customerName: firstItem?.tmsDeliveryPlanItemCustomerName || "",
    customerPhone: firstItem?.tmsDeliveryPlanItemCustomerPhone || "",
    address: plan.tmsDeliveryPlanAddress || "",
    soRef: firstItem?.tmsDeliveryPlanItemSalesOrderNo || "",
    priority: plan.tmsDeliveryPlanPriority || "normal",
    items: buildPlanItems(plan),
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


  const [deliveryPlans, setDeliveryPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);


  const [shipmentItems, setShipmentItems] = useState([]);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const distanceTimer = useRef(null);



  const [shipmentStops, setShipmentStops] = useState([]);


  const [routeResult, setRouteResult] = useState(null);
  const [routeAiAnalysis, setRouteAiAnalysis] = useState("");
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);


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

    } finally {
      setDistanceLoading(false);
    }
  }, []);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "tmsShipmentDestination") {
      clearTimeout(distanceTimer.current);
      distanceTimer.current = setTimeout(() => fetchDistance(value), 800);
    }
  };

  const loadDeliveryPlans = async () => {
    try {
      setPlansLoading(true);

      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(now.getMonth() + 1);
      const [cur, next] = await Promise.all([
        getDeliveryPlans(getMonthKey(now)),
        getDeliveryPlans(getMonthKey(nextMonth)),
      ]);
      const all = [...(cur || []), ...(next || [])];

      setDeliveryPlans(all.filter((p) => p.tmsDeliveryPlanStatus === "planned"));
    } catch {

    } finally {
      setPlansLoading(false);
    }
  };

  const togglePlanSelection = (planId) => {
    setSelectedPlanIds((prev) => {
      const id = String(planId);
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];

      if (next.length === 0) {
        setFormData(emptyForm);
        setShipmentItems([]);
        setShipmentStops([]);
        setRouteResult(null);
        setRouteAiAnalysis("");
        return next;
      }

      const selected = next.map((pid) => deliveryPlans.find((p) => String(p.tmsDeliveryPlanId) === pid)).filter(Boolean);


      const stops = selected.map((p, i) => buildStopFromPlan(p, i + 1));
      setShipmentStops(stops);


      const allItems = selected.flatMap((p) => buildPlanItems(p));
      setShipmentItems(allItems);

      if (selected.length === 1) {

        const filled = fillFormFromPlan(selected[0]);
        filled.tmsShipmentFuelPricePerLiter = String(DEFAULT_FUEL_PRICE);
        setFormData(filled);
        if (filled.tmsShipmentDestination) {
          fetchDistance(filled.tmsShipmentDestination);
        }
      } else {

        const firstPlan = selected[0];
        setFormData((prev) => ({
          ...prev,
          tmsShipmentDate: firstPlan.tmsDeliveryPlanDate || "",
          tmsShipmentCustomerName: stops.map((s) => s.customerName).filter(Boolean).join(", "),
          tmsShipmentCustomerAddress: "",
          tmsShipmentDestination: stops.map((s) => s.address).filter(Boolean).join(", "),
          tmsShipmentSalesOrderRef: stops.map((s) => s.soRef).filter(Boolean).join(", "),
          tmsShipmentFuelPricePerLiter: String(DEFAULT_FUEL_PRICE),
          tmsShipmentDistance: "",
        }));
      }


      setRouteResult(null);
      setRouteAiAnalysis("");

      return next;
    });
  };

  const optimizeRoute = async () => {
    const selected = selectedPlanIds
      .map((pid) => deliveryPlans.find((p) => String(p.tmsDeliveryPlanId) === pid))
      .filter(Boolean);

    const stopsWithAddress = selected.filter((p) => p.tmsDeliveryPlanAddress);
    if (stopsWithAddress.length < 2) {
      toast.error("ต้องมีจุดส่งอย่างน้อย 2 จุดเพื่อจัดเส้นทาง");
      return;
    }

    setRouteLoading(true);
    setRouteResult(null);
    setRouteAiAnalysis("");

    const stops = stopsWithAddress.map((p) => ({
      name: p.tmsDeliveryPlanItem?.[0]?.tmsDeliveryPlanItemCustomerName || p.tmsDeliveryPlanAddress,
      address: p.tmsDeliveryPlanAddress,
      priority: p.tmsDeliveryPlanPriority || "normal",
      planId: p.tmsDeliveryPlanId,
    }));


    const selectedVehicle = vehicles.find((v) => String(v.tmsVehicleId) === String(formData.tmsShipmentVehicleId));
    const vehicleInfo = selectedVehicle ? `${selectedVehicle.tmsVehiclePlateNumber}` : "";

    try {
      const res = await fetch("/api/tms/routeOptimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stops, vehicleInfo, usePriority: true }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `API error: ${res.status}`);
      }

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let eventType = null;
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
              continue;
            }
            if (!line.startsWith("data: ") || line === "data: [DONE]") {
              eventType = null;
              continue;
            }
            try {
              const json = JSON.parse(line.slice(6));
              if (eventType === "routeData") {
                setRouteResult(json);
                if (json.totalDistanceKm) {
                  setFormData((prev) => ({
                    ...prev,
                    tmsShipmentDistance: String(json.totalDistanceKm),
                  }));
                }

                if (json.optimizedStops) {
                  setShipmentStops((prev) => {
                    const reordered = json.optimizedStops.map((os, i) => {
                      const match = prev.find((s) => s.customerName === os.name || s.address === os.name);
                      return match ? { ...match, seq: i + 1 } : prev[i] ? { ...prev[i], seq: i + 1 } : null;
                    }).filter(Boolean);
                    return reordered.length > 0 ? reordered : prev;
                  });
                }
                eventType = null;
                continue;
              }
              const content = json.choices?.[0]?.delta?.content;
              if (content) setRouteAiAnalysis((prev) => prev + content);
            } catch {}
            eventType = null;
          }
        }
      } else {
        const data = await res.json();
        setRouteResult(data);
        if (data.totalDistanceKm) {
          setFormData((prev) => ({
            ...prev,
            tmsShipmentDistance: String(data.totalDistanceKm),
          }));
        }
      }
    } catch (err) {
      toast.error(err.message || "จัดเส้นทางล้มเหลว");
    } finally {
      setRouteLoading(false);
    }
  };

  const clearRouteResult = () => {
    setRouteResult(null);
    setRouteAiAnalysis("");
  };

  const updateItemActualQty = (itemId, value) => {
    setShipmentItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, actualQty: parseFloat(value) || 0 } : item
      )
    );
  };


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
        setSelectedPlanIds([String(fromPlanId)]);
        setEditingShipment(null);
        onOpen();
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setSelectedPlanIds([]);
      setShipmentItems([]);
      const stopsData = shipment.tmsShipmentStops;
      setShipmentStops(stopsData?.stops || stopsData || []);

      if (stopsData?.googleMapsUrl) {
        setRouteResult({ googleMapsUrl: stopsData.googleMapsUrl, totalDistanceKm: stopsData.totalDistanceKm, totalDurationMin: stopsData.totalDurationMin });
      } else {
        setRouteResult(null);
      }
      setRouteAiAnalysis("");
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
      setSelectedPlanIds([]);
      setShipmentItems([]);
      setShipmentStops([]);
      setRouteResult(null);
      setRouteAiAnalysis("");
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

      const saveData = { ...formData };

      const assistants = (saveData.tmsShipmentAssistants || []).filter((a) => a.id);
      saveData.tmsShipmentAssistants = assistants.length > 0 ? assistants : null;

      const extras = (saveData.tmsShipmentExtras || []).map((ex) => {
        if (ex.type !== "ot") return ex;
        const wage = getWageForPerson(ex.person, saveData);
        const hours = parseFloat(ex.hours) || 0;
        const rate = parseFloat(ex.rate) || 1.5;
        return { ...ex, amount: wage > 0 && hours > 0 ? parseFloat(((wage / 8) * rate * hours).toFixed(2)) : 0 };
      });
      saveData.tmsShipmentExtras = extras.length > 0 ? extras : null;

      for (const key of Object.keys(saveData)) {
        if (saveData[key] === "") saveData[key] = null;
      }
      if (shipmentItems.length > 0) {
        saveData.tmsShipmentItemsSummary = itemsToSummary(shipmentItems);
      }

      if (shipmentStops.length > 0) {
        saveData.tmsShipmentStops = {
          stops: shipmentStops.map((s) => ({
            seq: s.seq,
            planId: s.planId,
            customerName: s.customerName,
            customerPhone: s.customerPhone,
            address: s.address,
            soRef: s.soRef,
            priority: s.priority,
          })),
          googleMapsUrl: routeResult?.googleMapsUrl || null,
          totalDistanceKm: routeResult?.totalDistanceKm || null,
          totalDurationMin: routeResult?.totalDurationMin || null,
        };
      }

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


        const planIdsToLink = selectedPlanIds.length > 0 ? selectedPlanIds : (fromPlanId ? [String(fromPlanId)] : []);
        if (planIdsToLink.length > 0 && newShipment?.tmsShipmentId) {
          await Promise.all(
            planIdsToLink.map((pid) =>
              updateDeliveryPlan(pid, {
                tmsDeliveryPlanShipmentId: newShipment.tmsShipmentId,
                tmsDeliveryPlanShipmentNumber: newShipment.tmsShipmentNumber,
                tmsDeliveryPlanStatus: "in_progress",
              })
            )
          );
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
    selectedPlanIds,
    togglePlanSelection,
    shipmentStops,
    shipmentItems,
    updateItemActualQty,
    distanceLoading,
    addExtra,
    updateExtra,
    removeExtra,

    routeResult,
    routeAiAnalysis,
    routeLoading,
    optimizeRoute,
    clearRouteResult,
  };
}
