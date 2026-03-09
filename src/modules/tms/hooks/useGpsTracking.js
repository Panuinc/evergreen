"use client";

import { useState, useEffect, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { getLatestPositions, createGpsLog, getVehicles, getGpsLogs } from "@/modules/tms/actions";
import { validateForm, isRequired, isValidLatitude, isValidLongitude } from "@/lib/validation";

export function useGpsTracking() {
  const [positions, setPositions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({
    tmsGpsLogVehicleId: "",
    tmsGpsLogLatitude: "",
    tmsGpsLogLongitude: "",
    tmsGpsLogSpeed: "",
    tmsGpsLogSource: "manual",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [posData, vehData] = await Promise.all([
        getLatestPositions(),
        getVehicles(),
      ]);
      setPositions(posData);
      setVehicles(vehData);
    } catch {
      toast.error("โหลดข้อมูล GPS ล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


  useEffect(() => {
    const interval = setInterval(() => {
      getLatestPositions()
        .then(setPositions)
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenManualUpdate = (vehicle = null) => {
    setSelectedVehicle(vehicle);
    setFormData({
      tmsGpsLogVehicleId: vehicle?.tmsVehicleId || "",
      tmsGpsLogLatitude: "",
      tmsGpsLogLongitude: "",
      tmsGpsLogSpeed: "",
      tmsGpsLogSource: "manual",
    });
    onOpen();
  };

  const [validationErrors, setValidationErrors] = useState({});

  const handleSavePosition = async () => {
    const { isValid, errors } = validateForm(formData, {
      tmsGpsLogVehicleId: [(v) => !isRequired(v) && "กรุณาระบุยานพาหนะ"],
      tmsGpsLogLatitude: [
        (v) => !isRequired(v) && "กรุณาระบุละติจูด",
        (v) => !isValidLatitude(v) && "ละติจูดต้องอยู่ระหว่าง -90 ถึง 90",
      ],
      tmsGpsLogLongitude: [
        (v) => !isRequired(v) && "กรุณาระบุลองจิจูด",
        (v) => !isValidLongitude(v) && "ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180",
      ],
    });
    if (!isValid) {
      setValidationErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    setValidationErrors({});
    try {
      setSaving(true);
      await createGpsLog({
        tmsGpsLogVehicleId: formData.tmsGpsLogVehicleId,
        tmsGpsLogLatitude: parseFloat(formData.tmsGpsLogLatitude),
        tmsGpsLogLongitude: parseFloat(formData.tmsGpsLogLongitude),
        tmsGpsLogSpeed: formData.tmsGpsLogSpeed
          ? parseFloat(formData.tmsGpsLogSpeed)
          : null,
        tmsGpsLogSource: formData.tmsGpsLogSource,
      });
      toast.success("อัปเดตตำแหน่งสำเร็จ");
      onClose();
      loadData();
    } catch (e) {
      toast.error(e.message || "อัปเดตตำแหน่งล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [routeHistory, setRouteHistory] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const routeModal = useDisclosure();

  const loadRouteHistory = async (vehicleId) => {
    try {
      setLoadingRoute(true);
      setSelectedVehicleId(vehicleId);
      const logs = await getGpsLogs(vehicleId);
      setRouteHistory(
        logs.sort(
          (a, b) => new Date(a.tmsGpsLogRecordedAt) - new Date(b.tmsGpsLogRecordedAt)
        )
      );
      routeModal.onOpen();
    } catch {
      toast.error("โหลดประวัติเส้นทางล้มเหลว");
    } finally {
      setLoadingRoute(false);
    }
  };

  return {
    positions,
    vehicles,
    loading,
    saving,
    selectedVehicle,
    formData,
    validationErrors,
    isOpen,
    onClose,
    updateField,
    handleOpenManualUpdate,
    handleSavePosition,
    loadData,
    selectedVehicleId,
    setSelectedVehicleId,
    routeHistory,
    loadingRoute,
    routeModal,
    loadRouteHistory,
  };
}
