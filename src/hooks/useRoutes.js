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
  routeName: "",
  routeOrigin: "CHH Factory",
  routeDestination: "",
  routeDistanceKm: "",
  routeEstimatedMinutes: "",
  routeNotes: "",
  routeStatus: "active",
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
        routeName: route.routeName || "",
        routeOrigin: route.routeOrigin || "CHH Factory",
        routeDestination: route.routeDestination || "",
        routeDistanceKm: route.routeDistanceKm?.toString() || "",
        routeEstimatedMinutes: route.routeEstimatedMinutes?.toString() || "",
        routeNotes: route.routeNotes || "",
        routeStatus: route.routeStatus || "active",
      });
    } else {
      setEditingRoute(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (
      !formData.routeName.trim() ||
      !formData.routeDestination.trim()
    ) {
      toast.error("กรุณาระบุชื่อเส้นทางและปลายทาง");
      return;
    }

    try {
      setSaving(true);
      if (editingRoute) {
        await updateRoute(editingRoute.routeId, formData);
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
      await deleteRoute(deletingRoute.routeId);
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
