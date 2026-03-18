"use client";

import { useState, useEffect, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { get, post, authFetch } from "@/lib/apiClient";
import { validateForm, isRequired, isValidLatitude, isValidLongitude } from "@/lib/validation";
import TrackingView from "@/modules/tms/components/TrackingView";

export default function TrackingClient() {
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

  const mergeForthTrack = useCallback((internalPositions, internalVehicles, ftData) => {
    if (!Array.isArray(ftData) || ftData.length === 0) return internalPositions;

    const gpsIdMap = {};
    for (const v of internalVehicles) {
      if (v.tmsVehicleForthtrackId) gpsIdMap[v.tmsVehicleForthtrackId] = v;
    }
    const plateMap = {};
    for (const v of internalVehicles) {
      if (v.tmsVehiclePlateNumber) plateMap[v.tmsVehiclePlateNumber] = v;
    }

    const ftPositions = ftData
      .filter((ft) => ft.Latitude && ft.Longitude)
      .map((ft) => {
        const matched = gpsIdMap[ft.gpsID] ?? plateMap[ft.plateNumber];
        if (!matched) return null;
        let recordedAt = new Date().toISOString();
        if (ft.dateTime) {
          const [datePart, timePart] = ft.dateTime.split(" ");
          const [dd, mm, yyyy] = datePart.split("-");
          recordedAt = new Date(`${yyyy}-${mm}-${dd}T${timePart}+07:00`).toISOString();
        }
        return {
          tmsGpsLogVehicleId:      matched.tmsVehicleId,
          tmsGpsLogLatitude:       ft.Latitude,
          tmsGpsLogLongitude:      ft.Longitude,
          tmsGpsLogSpeed:          ft.Speed ?? null,
          tmsGpsLogRecordedAt:     recordedAt,
          tmsGpsLogSource:         "forthtrack",
          ftGpsId:                 ft.gpsID,
          ftEngine:                ft.Engine,
          ftDriver:                ft.driver || null,
          ftAddress:               ft.addressT || ft.addressE || null,
          ftFuel:                  ft.Fuel ?? null,
          ftTemperature:           ft.Temperature ?? null,
          ftCOG:                   ft.COG ?? null,
          ftPowerStatus:           ft.powerStatus ?? null,
          ftExternalBatt:          ft.externalBatt ?? null,
          ftPositionSource:        ft.positionSource ?? null,
          ftPoi:                   ft.poi || null,
          ftGPS:                   ft.GPS,
          ftGPRS:                  ft.GPRS,
          ftVehicleType:           ft.vehicleType ?? null,
          ftVehicleName:           ft.vehicleName ?? null,
          ftPlateNumber:           ft.plateNumber,
        };
      })
      .filter(Boolean);

    const merged = {};
    for (const p of internalPositions) {
      merged[p.tmsGpsLogVehicleId] = p;
    }
    for (const p of ftPositions) {
      merged[p.tmsGpsLogVehicleId] = p;
    }
    return Object.values(merged);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [posData, vehData, ftData] = await Promise.all([
        get("/api/tms/gpsLogs/latest"),
        get("/api/tms/vehicles"),
        authFetch("/api/tms/forthtrack").then((r) => r.json()).catch(() => []),
      ]);
      setVehicles(vehData);
      setPositions(mergeForthTrack(posData, vehData, Array.isArray(ftData) ? ftData : []));
    } catch {
      toast.error("โหลดข้อมูล GPS ล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, [mergeForthTrack]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [posData, ftData] = await Promise.all([
          get("/api/tms/gpsLogs/latest"),
          authFetch("/api/tms/forthtrack").then((r) => r.json()).catch(() => []),
        ]);
        setVehicles((prev) => {
          setPositions(mergeForthTrack(posData, prev, Array.isArray(ftData) ? ftData : []));
          return prev;
        });
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [mergeForthTrack]);

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
      await post("/api/tms/gpsLogs", {
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
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" })
  );
  const routeModal = useDisclosure();

  const loadRouteHistory = async (vehicleId, date) => {
    const targetDate = date ?? selectedDate;
    try {
      setLoadingRoute(true);
      setSelectedVehicleId(vehicleId);
      const params = new URLSearchParams();
      if (vehicleId) params.set("vehicleId", vehicleId);
      if (targetDate) params.set("date", targetDate);
      const qs = params.toString();
      const logs = await get(qs ? `/api/tms/gpsLogs?${qs}` : "/api/tms/gpsLogs");
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

  const handleDateChange = async (newDate) => {
    setSelectedDate(newDate);
    if (selectedVehicleId && routeModal.isOpen) {
      try {
        setLoadingRoute(true);
        const gpsParams = new URLSearchParams();
        if (selectedVehicleId) gpsParams.set("vehicleId", selectedVehicleId);
        if (newDate) gpsParams.set("date", newDate);
        const gpsQs = gpsParams.toString();
        const logs = await get(gpsQs ? `/api/tms/gpsLogs?${gpsQs}` : "/api/tms/gpsLogs");
        setRouteHistory(
          logs.sort(
            (a, b) => new Date(a.tmsGpsLogRecordedAt) - new Date(b.tmsGpsLogRecordedAt)
          )
        );
      } catch {
        toast.error("โหลดประวัติเส้นทางล้มเหลว");
      } finally {
        setLoadingRoute(false);
      }
    }
  };

  return (
    <TrackingView
      positions={positions}
      vehicles={vehicles}
      loading={loading}
      saving={saving}
      selectedVehicle={selectedVehicle}
      formData={formData}
      validationErrors={validationErrors}
      isOpen={isOpen}
      onClose={onClose}
      updateField={updateField}
      handleOpenManualUpdate={handleOpenManualUpdate}
      handleSavePosition={handleSavePosition}
      loadData={loadData}
      selectedVehicleId={selectedVehicleId}
      setSelectedVehicleId={setSelectedVehicleId}
      routeHistory={routeHistory}
      loadingRoute={loadingRoute}
      routeModal={routeModal}
      loadRouteHistory={loadRouteHistory}
      selectedDate={selectedDate}
      handleDateChange={handleDateChange}
    />
  );
}
