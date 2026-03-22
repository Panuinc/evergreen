"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { get, post, authFetch } from "@/lib/apiClient";
import { validateForm, isRequired, isValidLatitude, isValidLongitude } from "@/lib/validation";
import TrackingView from "@/modules/tms/components/trackingView";
import type { TmsVehicle, TmsGpsLog, TmsGpsLogForm } from "@/modules/tms/types";

export default function TrackingClient() {
  const [saving, setSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedVehicle, setSelectedVehicle] = useState<TmsVehicle | null>(null);
  const [formData, setFormData] = useState<TmsGpsLogForm>({
    tmsGpsLogVehicleId: "",
    tmsGpsLogLatitude: "",
    tmsGpsLogLongitude: "",
    tmsGpsLogSpeed: "",
    tmsGpsLogSource: "manual",
  });

  const mergeForthTrack = useCallback((internalPositions: TmsGpsLog[], internalVehicles: TmsVehicle[], ftData: Record<string, unknown>[]) => {
    if (!Array.isArray(ftData) || ftData.length === 0) return internalPositions;

    const gpsIdMap: Record<string, TmsVehicle> = {};
    for (const v of internalVehicles) {
      if (v.tmsVehicleForthtrackRef) gpsIdMap[v.tmsVehicleForthtrackRef] = v;
    }
    const plateMap: Record<string, TmsVehicle> = {};
    for (const v of internalVehicles) {
      if (v.tmsVehiclePlateNumber) plateMap[v.tmsVehiclePlateNumber] = v;
    }

    const ftPositions: TmsGpsLog[] = ftData
      .filter((ft) => ft.Latitude && ft.Longitude)
      .map((ft): TmsGpsLog | null => {
        const matched = gpsIdMap[ft.gpsID as string] ?? plateMap[ft.plateNumber as string];
        if (!matched) return null;
        let recordedAt = new Date().toISOString();
        if (ft.dateTime) {
          const [datePart, timePart] = (ft.dateTime as string).split(" ");
          const [dd, mm, yyyy] = datePart.split("-");
          recordedAt = new Date(`${yyyy}-${mm}-${dd}T${timePart}+07:00`).toISOString();
        }
        return {
          tmsGpsLogVehicleId:      matched.tmsVehicleId,
          tmsGpsLogLatitude:       ft.Latitude as number,
          tmsGpsLogLongitude:      ft.Longitude as number,
          tmsGpsLogSpeed:          (ft.Speed ?? null) as number | null,
          tmsGpsLogRecordedAt:     recordedAt,
          tmsGpsLogSource:         "forthtrack",
          ftGpsId:                 (ft.gpsID ?? null) as string | null,
          ftEngine:                (ft.Engine ?? null) as string | null,
          ftDriver:                (ft.driver || null) as string | null,
          ftAddress:               ((ft.addressT || ft.addressE) ?? null) as string | null,
          ftFuel:                  (ft.Fuel ?? null) as number | null,
          ftTemperature:           (ft.Temperature ?? null) as number | null,
          ftCOG:                   (ft.COG ?? null) as number | null,
          ftPowerStatus:           (ft.powerStatus ?? null) as string | null,
          ftExternalBatt:          (ft.externalBatt ?? null) as string | null,
          ftPositionSource:        (ft.positionSource ?? null) as string | null,
          ftPoi:                   (ft.poi || null) as string | null,
          ftGPS:                   (ft.GPS ?? null) as string | null,
          ftGPRS:                  (ft.GPRS ?? null) as string | null,
          ftVehicleType:           (ft.vehicleType ?? null) as string | null,
          ftVehicleName:           (ft.vehicleName ?? null) as string | null,
          ftPlateNumber:           (ft.plateNumber ?? null) as string | null,
        };
      })
      .filter((p): p is TmsGpsLog => p !== null);

    const merged: Record<string, TmsGpsLog> = {};
    for (const p of internalPositions) {
      merged[p.tmsGpsLogVehicleId] = p;
    }
    for (const p of ftPositions) {
      merged[p.tmsGpsLogVehicleId] = p;
    }
    return Object.values(merged);
  }, []);

  const trackingFetcher = useCallback(async () => {
    try {
      const [posData, vehData, ftData] = await Promise.all([
        get("/api/tms/gpsLogs/latest") as Promise<TmsGpsLog[]>,
        get("/api/tms/vehicles") as Promise<TmsVehicle[]>,
        authFetch("/api/tms/forthtrack").then((r) => r.json()).catch(() => []),
      ]);
      return {
        vehicles: vehData,
        positions: mergeForthTrack(posData, vehData, Array.isArray(ftData) ? ftData as Record<string, unknown>[] : []),
      };
    } catch {
      toast.error("โหลดข้อมูล GPS ล้มเหลว");
      return { vehicles: [] as TmsVehicle[], positions: [] as TmsGpsLog[] };
    }
  }, [mergeForthTrack]);

  const { data: trackingData, isLoading: loading, mutate: loadData } = useSWR<{ vehicles: TmsVehicle[]; positions: TmsGpsLog[] }>(
    "tracking-positions",
    trackingFetcher,
    { refreshInterval: 30000, revalidateOnFocus: false },
  );

  const vehicles: TmsVehicle[] = trackingData?.vehicles || [];
  const positions: TmsGpsLog[] = trackingData?.positions || [];

  const handleOpenManualUpdate = (vehicle: TmsVehicle | null = null) => {
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
      Object.values(errors).forEach((msg) => toast.error(msg as string));
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

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [routeHistory, setRouteHistory] = useState<TmsGpsLog[]>([]);
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
      const logs = await get(qs ? `/api/tms/gpsLogs?${qs}` : "/api/tms/gpsLogs") as TmsGpsLog[];
      setRouteHistory(
        logs.sort(
          (a, b) => new Date(a.tmsGpsLogRecordedAt).getTime() - new Date(b.tmsGpsLogRecordedAt).getTime()
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
        const logs = await get(gpsQs ? `/api/tms/gpsLogs?${gpsQs}` : "/api/tms/gpsLogs") as TmsGpsLog[];
        setRouteHistory(
          logs.sort(
            (a, b) => new Date(a.tmsGpsLogRecordedAt).getTime() - new Date(b.tmsGpsLogRecordedAt).getTime()
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
