import { withAuth } from "@/app/api/_lib/auth";

const VALID_TRANSITIONS = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["dispatched", "cancelled"],
  dispatched: ["in_transit"],
  in_transit: ["arrived"],
  arrived: ["delivered"],
  delivered: ["pod_confirmed"],
};

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const { status } = await request.json();

  // Fetch current shipment
  const { data: shipment, error: fetchError } = await supabase
    .from("shipments")
    .select("*")
    .eq("shipmentId", id)
    .single();

  if (fetchError) {
    return Response.json({ error: fetchError.message }, { status: 404 });
  }

  // Validate transition
  const currentStatus = shipment.shipmentStatus;
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];

  if (!allowedTransitions || !allowedTransitions.includes(status)) {
    return Response.json(
      {
        error: `Invalid status transition from "${currentStatus}" to "${status}"`,
      },
      { status: 400 }
    );
  }

  // Build update object
  const updateData = { shipmentStatus: status };

  // Set timestamps based on new status
  if (status === "dispatched") {
    updateData.shipmentDispatchedAt = new Date().toISOString();
  }
  if (status === "delivered") {
    updateData.shipmentDeliveredAt = new Date().toISOString();
  }

  // Update shipment status
  const { data, error } = await supabase
    .from("shipments")
    .update(updateData)
    .eq("shipmentId", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  // Side effects
  try {
    if (status === "dispatched") {
      // Set vehicle to in_use, driver and assistant to on_duty
      if (shipment.shipmentVehicleId) {
        await supabase
          .from("vehicles")
          .update({ vehicleStatus: "in_use" })
          .eq("vehicleId", shipment.shipmentVehicleId);
      }
      if (shipment.shipmentDriverId) {
        await supabase
          .from("drivers")
          .update({ driverStatus: "on_duty" })
          .eq("driverId", shipment.shipmentDriverId);
      }
      if (shipment.shipmentAssistantId) {
        await supabase
          .from("drivers")
          .update({ driverStatus: "on_duty" })
          .eq("driverId", shipment.shipmentAssistantId);
      }
    }

    if (status === "pod_confirmed") {
      // Reset vehicle to available, driver and assistant to available
      if (shipment.shipmentVehicleId) {
        await supabase
          .from("vehicles")
          .update({ vehicleStatus: "available" })
          .eq("vehicleId", shipment.shipmentVehicleId);
      }
      if (shipment.shipmentDriverId) {
        await supabase
          .from("drivers")
          .update({ driverStatus: "available" })
          .eq("driverId", shipment.shipmentDriverId);
      }
      if (shipment.shipmentAssistantId) {
        await supabase
          .from("drivers")
          .update({ driverStatus: "available" })
          .eq("driverId", shipment.shipmentAssistantId);
      }
    }

    if (status === "cancelled") {
      // Reset vehicle and drivers to available if assigned
      if (shipment.shipmentVehicleId) {
        await supabase
          .from("vehicles")
          .update({ vehicleStatus: "available" })
          .eq("vehicleId", shipment.shipmentVehicleId);
      }
      if (shipment.shipmentDriverId) {
        await supabase
          .from("drivers")
          .update({ driverStatus: "available" })
          .eq("driverId", shipment.shipmentDriverId);
      }
      if (shipment.shipmentAssistantId) {
        await supabase
          .from("drivers")
          .update({ driverStatus: "available" })
          .eq("driverId", shipment.shipmentAssistantId);
      }
    }
  } catch (sideEffectError) {
    // Side effects failed but status was updated successfully
    console.error("Side effect error:", sideEffectError);
  }

  return Response.json(data);
}
