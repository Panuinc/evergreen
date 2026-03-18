import { api } from "@/lib/api.server";
import FuelLogsClient from "@/modules/tms/FuelLogsClient";

export default async function FuelLogsPage() {
  const [fuelLogs, vehicles] = await Promise.all([
    api("/api/tms/fuelLogs"),
    api("/api/tms/vehicles"),
  ]);

  return (
    <FuelLogsClient
      initialFuelLogs={fuelLogs || []}
      initialVehicles={vehicles || []}
    />
  );
}
