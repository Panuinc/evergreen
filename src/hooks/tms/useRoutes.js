"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
} from "@/actions/tms";

const emptyForm = {
  tmsRouteName: "",
  tmsRouteOrigin: "CHH Factory",
  tmsRouteDestination: "",
  tmsRouteDistanceKm: "",
  tmsRouteEstimatedMinutes: "",
  tmsRouteNotes: "",
  tmsRouteStatus: "active",
};

export function useRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingRoute, setDeletingRoute] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getRoutes();
      setRoutes(data);
    } catch (error) {
      toast.error("โหลดเส้นทางล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (route = null) => {
    if (route) {
      setEditingRoute(route);
      setFormData({
        tmsRouteName: route.tmsRouteName || "",
        tmsRouteOrigin: route.tmsRouteOrigin || "CHH Factory",
        tmsRouteDestination: route.tmsRouteDestination || "",
        tmsRouteDistanceKm: route.tmsRouteDistanceKm?.toString() || "",
        tmsRouteEstimatedMinutes: route.tmsRouteEstimatedMinutes?.toString() || "",
        tmsRouteNotes: route.tmsRouteNotes || "",
        tmsRouteStatus: route.tmsRouteStatus || "active",
      });
    } else {
      setEditingRoute(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (
      !formData.tmsRouteName.trim() ||
      !formData.tmsRouteDestination.trim()
    ) {
      toast.error("กรุณาระบุชื่อเส้นทางและปลายทาง");
      return;
    }

    try {
      setSaving(true);
      if (editingRoute) {
        await updateRoute(editingRoute.tmsRouteId, formData);
        toast.success("อัปเดตเส้นทางสำเร็จ");
      } else {
        await createRoute(formData);
        toast.success("สร้างเส้นทางสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกเส้นทางล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (route) => {
    setDeletingRoute(route);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingRoute) return;
    try {
      await deleteRoute(deletingRoute.tmsRouteId);
      toast.success("ลบเส้นทางสำเร็จ");
      deleteModal.onClose();
      setDeletingRoute(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบเส้นทางล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    routes,
    loading,
    saving,
    editingRoute,
    formData,
    deletingRoute,
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
