import { api } from "@/lib/api.server";
import ShipmentsClient from "@/modules/tms/shipmentsClient";

export default async function ShipmentsPage() {
  const [shipments, vehicles] = await Promise.all([
    api("/api/tms/shipments"),
    api("/api/tms/vehicles"),
  ]);

  void shipments;
  void vehicles;
  return <ShipmentsClient />;
}
