import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const [vehiclesRes, shipmentsRes, fuelRes, mainRes] = await Promise.all([
    supabase.from("vehicles").select("vehicleId, vehicleName, vehicleStatus"),
    supabase.from("shipments").select("shipmentStatus, shipmentDate, shipmentVehicleId"),
    supabase.from("fuelLogs").select("fuelLogTotalCost, fuelLogDate"),
    supabase.from("maintenances").select("maintenanceCost, maintenanceStatus, maintenanceDate"),
  ]);

  if (vehiclesRes.error || shipmentsRes.error || fuelRes.error || mainRes.error) {
    return Response.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }

  const vehicles = vehiclesRes.data || [];
  const shipments = shipmentsRes.data || [];
  const fuelLogs = fuelRes.data || [];
  const maintenances = mainRes.data || [];

  // Vehicle stats
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(
    (v) => v.vehicleStatus === "available"
  ).length;
  const inUseVehicles = vehicles.filter(
    (v) => v.vehicleStatus === "in_use"
  ).length;

  // Shipment stats
  const totalShipments = shipments.length;
  const activeStatuses = ["confirmed", "dispatched", "in_transit", "arrived", "delivered"];
  const activeShipments = shipments.filter((s) =>
    activeStatuses.includes(s.shipmentStatus)
  ).length;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const completedThisMonth = shipments.filter(
    (s) =>
      s.shipmentStatus === "pod_confirmed" &&
      s.shipmentDate >= startOfMonth
  ).length;

  // Fuel cost this month
  const totalFuelCostThisMonth = fuelLogs
    .filter((f) => f.fuelLogDate >= startOfMonth)
    .reduce((sum, f) => sum + (parseFloat(f.fuelLogTotalCost) || 0), 0);

  // Pending maintenance
  const pendingMaintenance = maintenances.filter(
    (m) =>
      m.maintenanceStatus === "scheduled" ||
      m.maintenanceStatus === "in_progress"
  ).length;

  // --- Chart Data ---

  // Shipment status distribution
  const statusCounts = {};
  shipments.forEach((s) => {
    statusCounts[s.shipmentStatus] = (statusCounts[s.shipmentStatus] || 0) + 1;
  });
  const shipmentStatusDistribution = Object.entries(statusCounts).map(
    ([status, count]) => ({ status, count })
  );

  // Monthly shipment trend (last 6 months)
  const monthlyShipmentTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = shipments.filter((s) => s.shipmentDate && s.shipmentDate.startsWith(monthKey)).length;
    monthlyShipmentTrend.push({ month: monthKey, count });
  }

  // Fuel cost trend (last 6 months)
  const fuelCostTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const totalCost = fuelLogs
      .filter((f) => f.fuelLogDate && f.fuelLogDate.startsWith(monthKey))
      .reduce((sum, f) => sum + (parseFloat(f.fuelLogTotalCost) || 0), 0);
    fuelCostTrend.push({ month: monthKey, totalCost });
  }

  // Vehicle utilization (shipments per vehicle in last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const vehicleMap = {};
  vehicles.forEach((v) => {
    vehicleMap[v.vehicleId] = v.vehicleName;
  });
  const vehicleUtilization = vehicles.map((v) => ({
    vehicleName: v.vehicleName,
    shipmentCount: shipments.filter(
      (s) => s.shipmentVehicleId === v.vehicleId && s.shipmentDate >= thirtyDaysAgo
    ).length,
  }));

  // Maintenance cost trend (last 6 months)
  const maintenanceCostTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const totalCost = maintenances
      .filter((m) => m.maintenanceDate && m.maintenanceDate.startsWith(monthKey))
      .reduce((sum, m) => sum + (parseFloat(m.maintenanceCost) || 0), 0);
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
