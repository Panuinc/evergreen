"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getDeliveryPlans,
  createDeliveryPlan,
  updateDeliveryPlan,
  deleteDeliveryPlan,
  getDeliveryPlanSalesOrders,
  getDeliveryPlanSalesOrderLines,
} from "@/modules/tms/actions";
import { COMPANY_HQ } from "@/modules/tms/constants";

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 };

export function useDeliveryPlans() {
  const today = new Date();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(today);
  const [viewMode, setViewMode] = useState("month"); // "month" | "week"

  // Modal state
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // SO search state
  const [salesOrders, setSalesOrders] = useState([]);
  const [soLoading, setSoLoading] = useState(false);
  const [selectedSO, setSelectedSO] = useState(null);
  const [soLines, setSoLines] = useState([]);
  const [soLinesLoading, setSoLinesLoading] = useState(false);

  const getMonthKey = useCallback((date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, []);

  const loadPlans = useCallback(
    async (date) => {
      try {
        setLoading(true);
        const data = await getDeliveryPlans(getMonthKey(date));
        setPlans(data || []);
      } catch {
        toast.error("โหลดแผนส่งของล้มเหลว");
      } finally {
        setLoading(false);
      }
    },
    [getMonthKey]
  );

  useEffect(() => {
    loadPlans(currentDate);
  }, [currentDate, loadPlans]);

  // Navigation
  const goToPrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "month") {
        d.setMonth(d.getMonth() - 1);
      } else {
        d.setDate(d.getDate() - 7);
      }
      return d;
    });
  };

  const goToNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "month") {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setDate(d.getDate() + 7);
      }
      return d;
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  // Date click → open modal
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setEditingPlan(null);
    setSelectedSO(null);
    setSoLines([]);
    setIsModalOpen(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setSelectedSO(null);
    setSoLines([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setEditingPlan(null);
    setSelectedSO(null);
    setSoLines([]);
  };

  // SO search
  const searchSalesOrders = async (search) => {
    try {
      setSoLoading(true);
      const data = await getDeliveryPlanSalesOrders(search);
      setSalesOrders(data || []);
    } catch {
      toast.error("โหลด Sales Order ล้มเหลว");
    } finally {
      setSoLoading(false);
    }
  };

  const selectSalesOrder = async (so) => {
    setSelectedSO(so);
    setSoLines([]);
    if (!so) return;
    try {
      setSoLinesLoading(true);
      const lines = await getDeliveryPlanSalesOrderLines(
        so.bcSalesOrderNumber
      );
      setSoLines(lines || []);
    } catch {
      toast.error("โหลดรายการสินค้าล้มเหลว");
    } finally {
      setSoLinesLoading(false);
    }
  };

  // Save plan
  const handleSave = async (planData) => {
    try {
      setSaving(true);
      if (editingPlan) {
        await updateDeliveryPlan(editingPlan.tmsDeliveryPlanId, planData);
        toast.success("แก้ไขแผนส่งของแล้ว");
      } else {
        await createDeliveryPlan(planData);
        toast.success("เพิ่มแผนส่งของแล้ว");
      }
      await loadPlans(currentDate);
      closeModal();
    } catch {
      toast.error("บันทึกแผนส่งของล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  // Delete plan
  const handleDelete = async (id) => {
    try {
      await deleteDeliveryPlan(id);
      toast.success("ลบแผนส่งของแล้ว");
      await loadPlans(currentDate);
    } catch {
      toast.error("ลบแผนส่งของล้มเหลว");
    }
  };

  // Get plans for a specific date string (yyyy-mm-dd)
  const getPlansForDate = (dateStr) =>
    plans.filter((p) => p.tmsDeliveryPlanDate === dateStr);

  // Route optimization: sort by priority then nearest-neighbor from HQ
  const optimizeRoute = async (plansOnDate) => {
    if (!plansOnDate || plansOnDate.length < 2) return;
    try {
      const withCoords = plansOnDate.filter(
        (p) => p.tmsDeliveryPlanLat && p.tmsDeliveryPlanLng
      );
      const noCoords = plansOnDate.filter(
        (p) => !p.tmsDeliveryPlanLat || !p.tmsDeliveryPlanLng
      );

      const groups = {};
      withCoords.forEach((p) => {
        const key = p.tmsDeliveryPlanPriority || "normal";
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
      });

      const result = [];
      const priorityKeys = Object.keys(PRIORITY_ORDER).sort(
        (a, b) => PRIORITY_ORDER[a] - PRIORITY_ORDER[b]
      );

      for (const pKey of priorityKeys) {
        const group = groups[pKey] || [];
        let cur = { lat: COMPANY_HQ.lat, lng: COMPANY_HQ.lng };
        const remaining = [...group];
        while (remaining.length > 0) {
          let best = 0;
          let bestDist = Infinity;
          remaining.forEach((p, i) => {
            const d = haversine(
              cur.lat,
              cur.lng,
              p.tmsDeliveryPlanLat,
              p.tmsDeliveryPlanLng
            );
            if (d < bestDist) {
              bestDist = d;
              best = i;
            }
          });
          const chosen = remaining.splice(best, 1)[0];
          result.push(chosen);
          cur = {
            lat: chosen.tmsDeliveryPlanLat,
            lng: chosen.tmsDeliveryPlanLng,
          };
        }
      }
      result.push(...noCoords);

      await Promise.all(
        result.map((p, i) =>
          updateDeliveryPlan(p.tmsDeliveryPlanId, {
            tmsDeliveryPlanSequence: i + 1,
          })
        )
      );
      await loadPlans(currentDate);
      toast.success("จัดเส้นทางเสร็จแล้ว");
    } catch {
      toast.error("จัดเส้นทางล้มเหลว");
    }
  };

  return {
    plans,
    loading,
    saving,
    currentDate,
    viewMode,
    setViewMode,
    selectedDate,
    isModalOpen,
    editingPlan,
    salesOrders,
    soLoading,
    selectedSO,
    soLines,
    soLinesLoading,
    goToPrev,
    goToNext,
    goToToday,
    handleDateClick,
    handleEditPlan,
    closeModal,
    searchSalesOrders,
    selectSalesOrder,
    handleSave,
    handleDelete,
    getPlansForDate,
    optimizeRoute,
  };
}
