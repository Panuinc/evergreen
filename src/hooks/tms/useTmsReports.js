"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getReportData } from "@/actions/tms";

export function useTmsReports() {
  const [activeTab, setActiveTab] = useState("shipments");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getReportData(activeTab, startDate, endDate);
      setData(result);
    } catch {
      toast.error("โหลดข้อมูลรายงานล้มเหลว");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = computeSummary(activeTab, data);

  return {
    activeTab,
    setActiveTab,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    data,
    loading,
    summary,
    loadData,
  };
}

function computeSummary(type, data) {
  switch (type) {
    case "shipments": {
      const byStatus = {};
      data.forEach((s) => {
        byStatus[s.tmsShipmentStatus] = (byStatus[s.tmsShipmentStatus] || 0) + 1;
      });
      return {
        total: data.length,
        byStatus,
      };
    }
    case "fuelLogs": {
      const totalLiters = data.reduce((s, f) => s + (parseFloat(f.tmsFuelLogLiters) || 0), 0);
      const totalCost = data.reduce((s, f) => s + (parseFloat(f.tmsFuelLogTotalCost) || 0), 0);
      return {
        total: data.length,
        totalLiters: totalLiters.toFixed(2),
        totalCost: totalCost.toFixed(2),
        avgCostPerLiter: totalLiters > 0 ? (totalCost / totalLiters).toFixed(2) : "0",
      };
    }
    case "maintenances": {
      const totalCost = data.reduce((s, m) => s + (parseFloat(m.tmsMaintenanceCost) || 0), 0);
      const byType = {};
      data.forEach((m) => {
        byType[m.tmsMaintenanceType] = (byType[m.tmsMaintenanceType] || 0) + 1;
      });
      return {
        total: data.length,
        totalCost: totalCost.toFixed(2),
        byType,
      };
    }
    case "vehicles": {
      const byStatus = {};
      data.forEach((v) => {
        byStatus[v.tmsVehicleStatus] = (byStatus[v.tmsVehicleStatus] || 0) + 1;
      });
      return {
        total: data.length,
        byStatus,
      };
    }
    default:
      return { total: data.length };
  }
}
