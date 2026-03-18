import { api } from "@/lib/api.server";
import ShipmentsClient from "@/modules/tms/ShipmentsClient";

export default async function ShipmentsPage() {
  const [shipments, vehicles] = await Promise.all([
    api("/api/tms/shipments"),
    api("/api/tms/vehicles"),
  ]);

  return (
    <ShipmentsClient
      initialShipments={shipments || []}
      initialVehicles={vehicles || []}
    />
  );
}
