import { api } from "@/lib/api.server";
import VehiclesClient from "@/modules/tms/vehiclesClient";

export default async function VehiclesPage() {
  const vehicles = await api("/api/tms/vehicles");

  return <VehiclesClient initialVehicles={vehicles || []} />;
}
