import { api } from "@/lib/api.server";
import DeliveriesClient from "@/modules/tms/deliveriesClient";

export default async function DeliveriesPage() {
  const [deliveries, shipments] = await Promise.all([
    api("/api/tms/deliveries"),
    api("/api/tms/shipments"),
  ]);

  return (
    <DeliveriesClient
      initialDeliveries={deliveries || []}
      initialShipments={shipments || []}
    />
  );
}
