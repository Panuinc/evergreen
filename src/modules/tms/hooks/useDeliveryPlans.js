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

export function useDeliveryPlans() {
  const today = new Date();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(today);
  const [viewMode, setViewMode] = useState("month");


  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);


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
        so.bcSalesOrderNoValue
      );
      setSoLines(lines || []);
    } catch {
      toast.error("โหลดรายการสินค้าล้มเหลว");
    } finally {
      setSoLinesLoading(false);
    }
  };


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


  const handleDelete = async (id) => {
    try {
      await deleteDeliveryPlan(id);
      toast.success("ลบแผนส่งของแล้ว");
      await loadPlans(currentDate);
    } catch {
      toast.error("ลบแผนส่งของล้มเหลว");
    }
  };


  const getPlansForDate = (dateStr) =>
    plans.filter((p) => p.tmsDeliveryPlanDate === dateStr);

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
  };
}
