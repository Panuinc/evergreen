import { api } from "@/lib/api.server";
import FuelLogsClient from "@/modules/tms/fuelLogsClient";
import type { TmsFuelLog, TmsVehicle } from "@/modules/tms/types";

export default async function FuelLogsPage() {
  const [fuelLogs, vehicles] = await Promise.all([
    api("/api/tms/fuelLogs") as Promise<TmsFuelLog[] | null>,
    api("/api/tms/vehicles") as Promise<TmsVehicle[] | null>,
  ]);

  return (
    <FuelLogsClient
      initialFuelLogs={fuelLogs || []}
      initialVehicles={vehicles || []}
    />
  );
}
