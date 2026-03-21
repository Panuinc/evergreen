"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { authFetch } from "@/lib/apiClient";
import DashboardView from "@/modules/tms/components/dashboardView";

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

export default function DashboardClient({ initialStats }) {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  const [compareMode, setCompareModeState] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const loadStats = useCallback(async (mode) => {
    try {
      setLoading(true);
      const { get } = await import("@/lib/apiClient");
      const params = mode ? `?compareMode=${mode}` : "";
      const data = await get(`/api/tms/dashboard${params}`);
      setStats(data);
    } catch {
      toast.error("โหลดข้อมูลแดชบอร์ดล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  const setCompareMode = useCallback((mode) => {
    setCompareModeState(mode);
    loadStats(mode);
  }, [loadStats]);

  const runAiAnalysis = useCallback(async () => {
    if (!stats) return;
    setAiLoading(true);
    setAiAnalysis("");

    const vp = stats.vehiclePerformance || [];
    const snapshot = {
      fleet: [
        `ยานพาหนะทั้งหมด: ${stats.totalVehicles} คัน`,
        `พร้อมใช้งาน: ${stats.availableVehicles} คัน`,
        `กำลังใช้งาน: ${stats.inUseVehicles} คัน`,
        `เที่ยวขนส่งทั้งหมด: ${stats.totalShipments} เที่ยว`,
        `กำลังดำเนินการ: ${stats.activeShipments} เที่ยว`,
        `เสร็จสิ้นเดือนนี้: ${stats.completedThisMonth ?? stats.current?.completedInPeriod ?? "-"}`,
        `ค่าน้ำมันเดือนนี้: ${fmt(stats.totalFuelCostThisMonth ?? stats.current?.fuelCostInPeriod ?? 0)} บาท`,
      ].join("\n"),
      vehiclePerformance: vp.length
        ? [
            "| รถ | ทะเบียน | เที่ยว | ระยะทาง(km) | น้ำมันประมาณ(L) | น้ำมันจริง(L) | ต้นทุนประมาณ | ต้นทุนจริง | อัตราสิ้นเปลือง(km/L) | อัตราจริง(km/L) |",
            "|---|---|---|---|---|---|---|---|---|---|",
            ...vp.map((v) =>
              `| ${v.vehicleName || "-"} | ${v.plateNumber} | ${v.tripCount} | ${fmt(v.totalDistanceKm)} | ${fmt(v.estimatedLiters)} | ${fmt(v.actualFuelLiters)} | ${fmt(v.estimatedFuelCost)} | ${fmt(v.actualFuelCost)} | ${v.fuelConsumptionRate || "-"} | ${v.actualRate ?? "-"} |`
            ),
          ].join("\n")
        : "ไม่มีข้อมูล",
      shipments: [
        `เที่ยวทั้งหมด: ${stats.totalShipments}`,
        `กำลังดำเนินการ: ${stats.activeShipments}`,
      ].join("\n"),
      monthlyShipmentTrend: (stats.monthlyShipmentTrend || []).length
        ? stats.monthlyShipmentTrend.map((m) => `${m.month}: ${m.count} เที่ยว`).join("\n")
        : "ไม่มีข้อมูล",
      fuelCostTrend: (stats.fuelCostTrend || []).length
        ? stats.fuelCostTrend.map((m) => `${m.month}: ${fmt(m.totalCost)} บาท`).join("\n")
        : "ไม่มีข้อมูล",
      statusDistribution: (stats.shipmentStatusDistribution || []).length
        ? stats.shipmentStatusDistribution.map((s) => `${s.status}: ${s.count} เที่ยว`).join("\n")
        : "ไม่มีข้อมูล",
      vehicleUtilization: (stats.vehicleUtilization || []).length
        ? stats.vehicleUtilization.map((v) => `${v.vehicleName}: ${v.shipmentCount} เที่ยว (30 วัน)`).join("\n")
        : "ไม่มีข้อมูล",
    };

    try {
      const res = await authFetch("/api/tms/aiAnalysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          try {
            const json = JSON.parse(line.slice(6));
            const content = json.choices?.[0]?.delta?.content;
            if (content) setAiAnalysis((prev) => prev + content);
          } catch {}
        }
      }
    } catch (err) {
      setAiAnalysis(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  }, [stats]);

  return (
    <DashboardView
      stats={stats}
      loading={loading}
      compareMode={compareMode}
      setCompareMode={setCompareMode}
      aiAnalysis={aiAnalysis}
      aiLoading={aiLoading}
      runAiAnalysis={runAiAnalysis}
    />
  );
}
