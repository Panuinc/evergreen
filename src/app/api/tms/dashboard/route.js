import { withAuth } from "@/app/api/_lib/auth";
import { getComparisonRanges, filterByDateRange } from "@/lib/comparison";

function buildStats(vehicles, shipments, fuelLogs) {

  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(
    (v) => v.tmsVehicleStatus === "available"
  ).length;
  const inUseVehicles = vehicles.filter(
    (v) => v.tmsVehicleStatus === "in_use"
  ).length;


  const totalShipments = shipments.length;
  const activeStatuses = ["confirmed", "dispatched", "in_transit", "arrived", "delivered"];
  const activeShipments = shipments.filter((s) =>
    activeStatuses.includes(s.tmsShipmentStatus)
  ).length;

  const completedInPeriod = shipments.filter(
    (s) => s.tmsShipmentStatus === "pod_confirmed"
  ).length;


  const fuelCostInPeriod = fuelLogs.reduce(
    (sum, f) => sum + (parseFloat(f.tmsFuelLogTotalCost) || 0),
    0
  );




  const statusCounts = {};
  shipments.forEach((s) => {
    statusCounts[s.tmsShipmentStatus] = (statusCounts[s.tmsShipmentStatus] || 0) + 1;
  });
  const shipmentStatusDistribution = Object.entries(statusCounts).map(
    ([status, count]) => ({ status, count })
  );


  const monthlyMap = {};
  shipments.forEach((s) => {
    if (!s.tmsShipmentDate) return;
    const monthKey = s.tmsShipmentDate.slice(0, 7);
    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;
  });
  const monthlyShipmentTrend = Object.entries(monthlyMap)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));


  const fuelMonthlyMap = {};
  fuelLogs.forEach((f) => {
    if (!f.tmsFuelLogDate) return;
    const monthKey = f.tmsFuelLogDate.slice(0, 7);
    fuelMonthlyMap[monthKey] = (fuelMonthlyMap[monthKey] || 0) + (parseFloat(f.tmsFuelLogTotalCost) || 0);
  });
  const fuelCostTrend = Object.entries(fuelMonthlyMap)
    .map(([month, totalCost]) => ({ month, totalCost }))
    .sort((a, b) => a.month.localeCompare(b.month));


  const vehicleUtilization = vehicles.map((v) => ({
    vehicleName: v.tmsVehicleName || v.tmsVehiclePlateNumber,
    shipmentCount: shipments.filter(
      (s) => s.tmsShipmentVehicleId === v.tmsVehicleId
    ).length,
  }));

  return {
    totalVehicles,
    availableVehicles,
    inUseVehicles,
    totalShipments,
    activeShipments,
    completedInPeriod,
    fuelCostInPeriod,
    shipmentStatusDistribution,
    monthlyShipmentTrend,
    fuelCostTrend,
    vehicleUtilization,
  };
}

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const url = new URL(request.url);
  const compareMode = url.searchParams.get("compareMode");

  const [vehiclesRes, shipmentsRes, fuelRes] = await Promise.all([
    supabase.from("tmsVehicle").select("tmsVehicleId, tmsVehicleName, tmsVehiclePlateNumber, tmsVehicleStatus, tmsVehicleFuelConsumptionRate").eq("isActive", true),
    supabase.from("tmsShipment").select("tmsShipmentStatus, tmsShipmentDate, tmsShipmentVehicleId, tmsShipmentDistance, tmsShipmentFuelCost").eq("isActive", true),
    supabase.from("tmsFuelLog").select("tmsFuelLogTotalCost, tmsFuelLogDate, tmsFuelLogVehicleId, tmsFuelLogLiters").eq("isActive", true),
  ]);

  if (vehiclesRes.error || shipmentsRes.error || fuelRes.error) {
    console.error("TMS Dashboard errors:", { vehicles: vehiclesRes.error, shipments: shipmentsRes.error, fuel: fuelRes.error });
    return Response.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }

  const vehicles = vehiclesRes.data || [];
  const allShipments = shipmentsRes.data || [];
  const allFuelLogs = fuelRes.data || [];


  const vehiclePerformance = vehicles.map((v) => {
    const vShipments = allShipments.filter((s) => s.tmsShipmentVehicleId === v.tmsVehicleId);
    const vFuelLogs = allFuelLogs.filter((f) => f.tmsFuelLogVehicleId === v.tmsVehicleId);

    const totalDistanceKm = vShipments.reduce((sum, s) => sum + (parseFloat(s.tmsShipmentDistance) || 0), 0);
    const tripCount = vShipments.filter((s) => s.tmsShipmentDistance > 0).length;
    const estimatedFuelCost = vShipments.reduce((sum, s) => sum + (parseFloat(s.tmsShipmentFuelCost) || 0), 0);

    const actualFuelLiters = vFuelLogs.reduce((sum, f) => sum + (parseFloat(f.tmsFuelLogLiters) || 0), 0);
    const actualFuelCost = vFuelLogs.reduce((sum, f) => sum + (parseFloat(f.tmsFuelLogTotalCost) || 0), 0);

    const rate = parseFloat(v.tmsVehicleFuelConsumptionRate) || 0;
    const estimatedLiters = rate > 0 ? totalDistanceKm / rate : 0;


    const actualRate = actualFuelLiters > 0 && totalDistanceKm > 0
      ? totalDistanceKm / actualFuelLiters
      : null;

    return {
      vehicleId: v.tmsVehicleId,
      vehicleName: v.tmsVehicleName,
      plateNumber: v.tmsVehiclePlateNumber,
      status: v.tmsVehicleStatus,
      tripCount,
      totalDistanceKm: Math.round(totalDistanceKm),
      estimatedLiters: Math.round(estimatedLiters * 100) / 100,
      actualFuelLiters: Math.round(actualFuelLiters * 100) / 100,
      estimatedFuelCost: Math.round(estimatedFuelCost),
      actualFuelCost: Math.round(actualFuelCost),
      fuelConsumptionRate: rate,
      actualRate: actualRate != null ? Math.round(actualRate * 100) / 100 : null,
    };
  });


  if (!compareMode) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];


    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(
      (v) => v.tmsVehicleStatus === "available"
    ).length;
    const inUseVehicles = vehicles.filter(
      (v) => v.tmsVehicleStatus === "in_use"
    ).length;


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


    const totalFuelCostThisMonth = allFuelLogs
      .filter((f) => f.tmsFuelLogDate >= startOfMonth)
      .reduce((sum, f) => sum + (parseFloat(f.tmsFuelLogTotalCost) || 0), 0);




    const statusCounts = {};
    allShipments.forEach((s) => {
      statusCounts[s.tmsShipmentStatus] = (statusCounts[s.tmsShipmentStatus] || 0) + 1;
    });
    const shipmentStatusDistribution = Object.entries(statusCounts).map(
      ([status, count]) => ({ status, count })
    );


    const monthlyShipmentTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const count = allShipments.filter((s) => s.tmsShipmentDate && s.tmsShipmentDate.startsWith(monthKey)).length;
      monthlyShipmentTrend.push({ month: monthKey, count });
    }


    const fuelCostTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const totalCost = allFuelLogs
        .filter((f) => f.tmsFuelLogDate && f.tmsFuelLogDate.startsWith(monthKey))
        .reduce((sum, f) => sum + (parseFloat(f.tmsFuelLogTotalCost) || 0), 0);
      fuelCostTrend.push({ month: monthKey, totalCost });
    }


    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const vehicleUtilization = vehicles.map((v) => ({
      vehicleName: v.tmsVehicleName || v.tmsVehiclePlateNumber,
      shipmentCount: allShipments.filter(
        (s) => s.tmsShipmentVehicleId === v.tmsVehicleId && s.tmsShipmentDate >= thirtyDaysAgo
      ).length,
    }));

    return Response.json({
      totalVehicles,
      availableVehicles,
      inUseVehicles,
      totalShipments,
      activeShipments,
      completedThisMonth,
      totalFuelCostThisMonth,
      shipmentStatusDistribution,
      monthlyShipmentTrend,
      fuelCostTrend,
      vehicleUtilization,
      vehiclePerformance,
    });
  }


  const ranges = getComparisonRanges(compareMode);

  const curShipments = filterByDateRange(allShipments, "tmsShipmentDate", ranges.current.start, ranges.current.end);
  const curFuelLogs = filterByDateRange(allFuelLogs, "tmsFuelLogDate", ranges.current.start, ranges.current.end);

  const prevShipments = filterByDateRange(allShipments, "tmsShipmentDate", ranges.previous.start, ranges.previous.end);
  const prevFuelLogs = filterByDateRange(allFuelLogs, "tmsFuelLogDate", ranges.previous.start, ranges.previous.end);


  const current = buildStats(vehicles, curShipments, curFuelLogs);
  const previous = buildStats(vehicles, prevShipments, prevFuelLogs);

  return Response.json({
    compareMode,
    labels: { current: ranges.current.label, previous: ranges.previous.label },
    current,
    previous,
    vehiclePerformance,
  });
}
