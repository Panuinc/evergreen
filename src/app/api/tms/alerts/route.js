import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [vehiclesRes, driversRes, maintenancesRes] = await Promise.all([
    supabase
      .from("vehicles")
      .select("vehicleId, vehicleName, vehiclePlateNumber, vehicleRegistrationExpiry, vehicleInsuranceExpiry, vehicleActExpiry, vehicleCurrentMileage")
      .neq("vehicleStatus", "retired"),
    supabase
      .from("drivers")
      .select("driverId, driverFirstName, driverLastName, driverLicenseExpiry")
      .neq("driverStatus", "inactive"),
    supabase
      .from("maintenances")
      .select("maintenanceId, maintenanceVehicleId, maintenanceNextDueDate, maintenanceNextDueMileage, maintenanceDescription, vehicles(vehicleName, vehiclePlateNumber, vehicleCurrentMileage)")
      .eq("maintenanceStatus", "completed")
      .not("maintenanceNextDueDate", "is", null),
  ]);

  const alerts = [];

  // Vehicle expiry alerts
  for (const v of vehiclesRes.data || []) {
    const checks = [
      { field: v.vehicleRegistrationExpiry, type: "vehicle_registration", label: "Registration" },
      { field: v.vehicleInsuranceExpiry, type: "vehicle_insurance", label: "Insurance" },
      { field: v.vehicleActExpiry, type: "vehicle_act", label: "Act" },
    ];
    for (const check of checks) {
      if (check.field && check.field <= thirtyDaysFromNow) {
        alerts.push({
          type: check.type,
          severity: check.field < today ? "critical" : "warning",
          title: `${check.label} expiring: ${v.vehicleName}`,
          detail: `Plate ${v.vehiclePlateNumber} - expires ${check.field}`,
          date: check.field,
          entityId: v.vehicleId,
          entityType: "vehicle",
        });
      }
    }
  }

  // Driver license expiry alerts
  for (const d of driversRes.data || []) {
    if (d.driverLicenseExpiry && d.driverLicenseExpiry <= thirtyDaysFromNow) {
      alerts.push({
        type: "driver_license",
        severity: d.driverLicenseExpiry < today ? "critical" : "warning",
        title: `License expiring: ${d.driverFirstName} ${d.driverLastName}`,
        detail: `Expires ${d.driverLicenseExpiry}`,
        date: d.driverLicenseExpiry,
        entityId: d.driverId,
        entityType: "driver",
      });
    }
  }

  // Maintenance due alerts
  for (const m of maintenancesRes.data || []) {
    if (m.maintenanceNextDueDate && m.maintenanceNextDueDate <= thirtyDaysFromNow) {
      alerts.push({
        type: "maintenance_due",
        severity: m.maintenanceNextDueDate < today ? "critical" : "warning",
        title: `Maintenance due: ${m.vehicles?.vehicleName || "Unknown"}`,
        detail: `${m.maintenanceDescription} - due ${m.maintenanceNextDueDate}`,
        date: m.maintenanceNextDueDate,
        entityId: m.maintenanceId,
        entityType: "maintenance",
      });
    }
    if (m.maintenanceNextDueMileage && m.vehicles?.vehicleCurrentMileage) {
      const remaining = Number(m.maintenanceNextDueMileage) - Number(m.vehicles.vehicleCurrentMileage);
      if (remaining <= 1000) {
        alerts.push({
          type: "maintenance_mileage",
          severity: remaining <= 0 ? "critical" : "warning",
          title: `Mileage maintenance: ${m.vehicles?.vehicleName || "Unknown"}`,
          detail: `${m.maintenanceDescription} - ${remaining <= 0 ? "OVERDUE" : remaining.toFixed(0) + " km remaining"}`,
          entityId: m.maintenanceId,
          entityType: "maintenance",
        });
      }
    }
  }

  alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
    return (a.date || "").localeCompare(b.date || "");
  });

  return Response.json({ alerts, totalCount: alerts.length });
}
