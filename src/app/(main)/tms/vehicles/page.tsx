import { api } from "@/lib/api.server";
import VehiclesClient from "@/modules/tms/vehiclesClient";
import type { TmsVehicle } from "@/modules/tms/types";

export default async function VehiclesPage() {
  const vehicles = await api("/api/tms/vehicles") as TmsVehicle[] | null;

  return <VehiclesClient initialVehicles={vehicles || []} />;
}
