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
      .from("tmsVehicle")
      .select("tmsVehicleId, tmsVehicleName, tmsVehiclePlateNumber, tmsVehicleRegistrationExpiry, tmsVehicleInsuranceExpiry, tmsVehicleActExpiry, tmsVehicleCurrentMileage")
      .eq("isActive", true)
      .neq("tmsVehicleStatus", "retired"),
    supabase
      .from("tmsDriver")
      .select("tmsDriverId, tmsDriverFirstName, tmsDriverLastName, tmsDriverLicenseExpiry")
      .eq("isActive", true)
      .neq("tmsDriverStatus", "inactive"),
    supabase
      .from("tmsMaintenance")
      .select("tmsMaintenanceId, tmsMaintenanceVehicleId, tmsMaintenanceNextDueDate, tmsMaintenanceNextDueMileage, tmsMaintenanceDescription, tmsVehicle(tmsVehicleName, tmsVehiclePlateNumber, tmsVehicleCurrentMileage)")
      .eq("isActive", true)
      .eq("tmsMaintenanceStatus", "completed")
      .not("tmsMaintenanceNextDueDate", "is", null),
  ]);

  const alerts = [];

  // Vehicle expiry alerts
  for (const v of vehiclesRes.data || []) {
    const checks = [
      { field: v.tmsVehicleRegistrationExpiry, type: "vehicle_registration", label: "Registration" },
      { field: v.tmsVehicleInsuranceExpiry, type: "vehicle_insurance", label: "Insurance" },
      { field: v.tmsVehicleActExpiry, type: "vehicle_act", label: "Act" },
    ];
    for (const check of checks) {
      if (check.field && check.field <= thirtyDaysFromNow) {
        alerts.push({
          type: check.type,
          severity: check.field < today ? "critical" : "warning",
          title: `${check.label} expiring: ${v.tmsVehicleName}`,
          detail: `Plate ${v.tmsVehiclePlateNumber} - expires ${check.field}`,
          date: check.field,
          entityId: v.tmsVehicleId,
          entityType: "vehicle",
        });
      }
    }
  }

  // Driver license expiry alerts
  for (const d of driversRes.data || []) {
    if (d.tmsDriverLicenseExpiry && d.tmsDriverLicenseExpiry <= thirtyDaysFromNow) {
      alerts.push({
        type: "driver_license",
        severity: d.tmsDriverLicenseExpiry < today ? "critical" : "warning",
        title: `License expiring: ${d.tmsDriverFirstName} ${d.tmsDriverLastName}`,
        detail: `Expires ${d.tmsDriverLicenseExpiry}`,
        date: d.tmsDriverLicenseExpiry,
        entityId: d.tmsDriverId,
        entityType: "driver",
      });
    }
  }

  // Maintenance due alerts
  for (const m of maintenancesRes.data || []) {
    if (m.tmsMaintenanceNextDueDate && m.tmsMaintenanceNextDueDate <= thirtyDaysFromNow) {
      alerts.push({
        type: "maintenance_due",
        severity: m.tmsMaintenanceNextDueDate < today ? "critical" : "warning",
        title: `Maintenance due: ${m.tmsVehicle?.tmsVehicleName || "Unknown"}`,
        detail: `${m.tmsMaintenanceDescription} - due ${m.tmsMaintenanceNextDueDate}`,
        date: m.tmsMaintenanceNextDueDate,
        entityId: m.tmsMaintenanceId,
        entityType: "maintenance",
      });
    }
    if (m.tmsMaintenanceNextDueMileage && m.tmsVehicle?.tmsVehicleCurrentMileage) {
      const remaining = Number(m.tmsMaintenanceNextDueMileage) - Number(m.tmsVehicle.tmsVehicleCurrentMileage);
      if (remaining <= 1000) {
        alerts.push({
          type: "maintenance_mileage",
          severity: remaining <= 0 ? "critical" : "warning",
          title: `Mileage maintenance: ${m.tmsVehicle?.tmsVehicleName || "Unknown"}`,
          detail: `${m.tmsMaintenanceDescription} - ${remaining <= 0 ? "OVERDUE" : remaining.toFixed(0) + " km remaining"}`,
          entityId: m.tmsMaintenanceId,
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
