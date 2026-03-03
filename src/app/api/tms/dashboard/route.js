import { withAuth } from "@/app/api/_lib/auth";
import { getComparisonRanges, filterByDateRange } from "@/lib/comparison";

function buildStats(vehicles, shipments, fuelLogs, maintenances) {
  // Vehicle stats
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(
    (v) => v.tmsVehicleStatus === "available"
  ).length;
  const inUseVehicles = vehicles.filter(
    (v) => v.tmsVehicleStatus === "in_use"
  ).length;

  // Shipment stats
  const totalShipments = shipments.length;
  const activeStatuses = ["confirmed", "dispatched", "in_transit", "arrived", "delivered"];
  const activeShipments = shipments.filter((s) =>
    activeStatuses.includes(s.tmsShipmentStatus)
  ).length;

  const completedInPeriod = shipments.filter(
    (s) => s.tmsShipmentStatus === "pod_confirmed"
  ).length;

  // Fuel cost in period
  const fuelCostInPeriod = fuelLogs.reduce(
    (sum, f) => sum + (parseFloat(f.tmsFuelLogTotalCost) || 0),
    0
  );

  // Maintenance cost in period
  const maintenanceCostInPeriod = maintenances.reduce(
    (sum, m) => sum + (parseFloat(m.tmsMaintenanceCost) || 0),
    0
  );

  // Pending maintenance
  const pendingMaintenance = maintenances.filter(
    (m) =>
      m.tmsMaintenanceStatus === "scheduled" ||
      m.tmsMaintenanceStatus === "in_progress"
  ).length;

  // --- Chart Data ---

  // Shipment status distribution
  const statusCounts = {};
  shipments.forEach((s) => {
    statusCounts[s.tmsShipmentStatus] = (statusCounts[s.tmsShipmentStatus] || 0) + 1;
  });
  const shipmentStatusDistribution = Object.entries(statusCounts).map(
    ([status, count]) => ({ status, count })
  );

  // Monthly shipment trend
  const monthlyMap = {};
  shipments.forEach((s) => {
    if (!s.tmsShipmentDate) return;
    const monthKey = s.tmsShipmentDate.slice(0, 7);
    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;
  });
  const monthlyShipmentTrend = Object.entries(monthlyMap)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Fuel cost trend
  const fuelMonthlyMap = {};
  fuelLogs.forEach((f) => {
    if (!f.tmsFuelLogDate) return;
    const monthKey = f.tmsFuelLogDate.slice(0, 7);
    fuelMonthlyMap[monthKey] = (fuelMonthlyMap[monthKey] || 0) + (parseFloat(f.tmsFuelLogTotalCost) || 0);
  });
  const fuelCostTrend = Object.entries(fuelMonthlyMap)
    .map(([month, totalCost]) => ({ month, totalCost }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Vehicle utilization (shipments per vehicle across all filtered data)
  const vehicleUtilization = vehicles.map((v) => ({
    vehicleName: v.tmsVehicleName,
    shipmentCount: shipments.filter(
      (s) => s.tmsShipmentVehicleId === v.tmsVehicleId
    ).length,
  }));

  // Maintenance cost trend
  const mainMonthlyMap = {};
  maintenances.forEach((m) => {
    if (!m.tmsMaintenanceDate) return;
    const monthKey = m.tmsMaintenanceDate.slice(0, 7);
    mainMonthlyMap[monthKey] = (mainMonthlyMap[monthKey] || 0) + (parseFloat(m.tmsMaintenanceCost) || 0);
  });
  const maintenanceCostTrend = Object.entries(mainMonthlyMap)
    .map(([month, totalCost]) => ({ month, totalCost }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalVehicles,
    availableVehicles,
    inUseVehicles,
    totalShipments,
    activeShipments,
    completedInPeriod,
    fuelCostInPeriod,
    maintenanceCostInPeriod,
    pendingMaintenance,
    shipmentStatusDistribution,
    monthlyShipmentTrend,
    fuelCostTrend,
    vehicleUtilization,
    maintenanceCostTrend,
  };
}

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const url = new URL(request.url);
  const compareMode = url.searchParams.get("compareMode"); // "ytm" | "yty" | null

  const [vehiclesRes, shipmentsRes, fuelRes, mainRes] = await Promise.all([
    supabase.from("tmsVehicle").select("tmsVehicleId, tmsVehicleName, tmsVehicleStatus").eq("isActive", true),
    supabase.from("tmsShipment").select("tmsShipmentStatus, tmsShipmentDate, tmsShipmentVehicleId").eq("isActive", true),
    supabase.from("tmsFuelLog").select("tmsFuelLogTotalCost, tmsFuelLogDate").eq("isActive", true),
    supabase.from("tmsMaintenance").select("tmsMaintenanceCost, tmsMaintenanceStatus, tmsMaintenanceDate").eq("isActive", true),
  ]);

  if (vehiclesRes.error || shipmentsRes.error || fuelRes.error || mainRes.error) {
    return Response.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }

  const vehicles = vehiclesRes.data || [];
  const allShipments = shipmentsRes.data || [];
  const allFuelLogs = fuelRes.data || [];
  const allMaintenances = mainRes.data || [];

  // ── No comparison mode: return backward-compatible response ──
  if (!compareMode) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    // Vehicle stats
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(
      (v) => v.tmsVehicleStatus === "available"
    ).length;
    const inUseVehicles = vehicles.filter(
      (v) => v.tmsVehicleStatus === "in_use"
    ).length;

    // Shipment stats
    const totalShipments = allShipments.length;
    const activeStatuses = ["confirmed", "dispatched", "in_transit", "arrived", "delivered"];
    const activeShipments = allShipments.filter((s) =>
      activeStatuses.includes(s.tmsShipmentStatus)
    ).length;
    const completedThisMonth = allShipments.filter(
      (s) =>
        s.tmsShipmentStatus === "pod_confirmed" &&
        s.tmsShipmentDate >= startOfMonth
    ).length;

    // Fuel cost this month
    const totalFuelCostThisMonth = allFuelLogs
      .filter((f) => f.tmsFuelLogDate >= startOfMonth)
      .reduce((sum, f) => sum + (parseFloat(f.tmsFuelLogTotalCost) || 0), 0);

    // Pending maintenance
    const pendingMaintenance = allMaintenances.filter(
      (m) =>
        m.tmsMaintenanceStatus === "scheduled" ||
        m.tmsMaintenanceStatus === "in_progress"
    ).length;

    // --- Chart Data ---

    // Shipment status distribution
    const statusCounts = {};
    allShipments.forEach((s) => {
      statusCounts[s.tmsShipmentStatus] = (statusCounts[s.tmsShipmentStatus] || 0) + 1;
    });
    const shipmentStatusDistribution = Object.entries(statusCounts).map(
      ([status, count]) => ({ status, count })
    );

    // Monthly shipment trend (last 6 months)
    const monthlyShipmentTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const count = allShipments.filter((s) => s.tmsShipmentDate && s.tmsShipmentDate.startsWith(monthKey)).length;
      monthlyShipmentTrend.push({ month: monthKey, count });
    }

    // Fuel cost trend (last 6 months)
    const fuelCostTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const totalCost = allFuelLogs
        .filter((f) => f.tmsFuelLogDate && f.tmsFuelLogDate.startsWith(monthKey))
        .reduce((sum, f) => sum + (parseFloat(f.tmsFuelLogTotalCost) || 0), 0);
      fuelCostTrend.push({ month: monthKey, totalCost });
    }

    // Vehicle utilization (shipments per vehicle in last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const vehicleUtilization = vehicles.map((v) => ({
      vehicleName: v.tmsVehicleName,
      shipmentCount: allShipments.filter(
        (s) => s.tmsShipmentVehicleId === v.tmsVehicleId && s.tmsShipmentDate >= thirtyDaysAgo
      ).length,
    }));

    // Maintenance cost trend (last 6 months)
    const maintenanceCostTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const totalCost = allMaintenances
        .filter((m) => m.tmsMaintenanceDate && m.tmsMaintenanceDate.startsWith(monthKey))
        .reduce((sum, m) => sum + (parseFloat(m.tmsMaintenanceCost) || 0), 0);
      maintenanceCostTrend.push({ month: monthKey, totalCost });
    }

    return Response.json({
      totalVehicles,
      availableVehicles,
      inUseVehicles,
      totalShipments,
      activeShipments,
      completedThisMonth,
      totalFuelCostThisMonth,
      pendingMaintenance,
      shipmentStatusDistribution,
      monthlyShipmentTrend,
      fuelCostTrend,
      vehicleUtilization,
      maintenanceCostTrend,
    });
  }

  // ── Comparison mode: filter by date ranges ──
  const ranges = getComparisonRanges(compareMode);

  const curShipments = filterByDateRange(allShipments, "tmsShipmentDate", ranges.current.start, ranges.current.end);
  const curFuelLogs = filterByDateRange(allFuelLogs, "tmsFuelLogDate", ranges.current.start, ranges.current.end);
  const curMaintenances = filterByDateRange(allMaintenances, "tmsMaintenanceDate", ranges.current.start, ranges.current.end);

  const prevShipments = filterByDateRange(allShipments, "tmsShipmentDate", ranges.previous.start, ranges.previous.end);
  const prevFuelLogs = filterByDateRange(allFuelLogs, "tmsFuelLogDate", ranges.previous.start, ranges.previous.end);
  const prevMaintenances = filterByDateRange(allMaintenances, "tmsMaintenanceDate", ranges.previous.start, ranges.previous.end);

  // Point-in-time stats use same vehicles for both periods (no comparison)
  const current = buildStats(vehicles, curShipments, curFuelLogs, curMaintenances);
  const previous = buildStats(vehicles, prevShipments, prevFuelLogs, prevMaintenances);

  return Response.json({
    compareMode,
    labels: { current: ranges.current.label, previous: ranges.previous.label },
    current,
    previous,
  });
}
