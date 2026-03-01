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
    .from("tmsShipment")
    .select("*")
    .eq("tmsShipmentId", id)
    .eq("isActive", true)
    .single();

  if (fetchError) {
    return Response.json({ error: fetchError.message }, { status: 404 });
  }

  // Validate transition
  const currentStatus = shipment.tmsShipmentStatus;
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
  const updateData = { tmsShipmentStatus: status };

  // Set timestamps based on new status
  if (status === "dispatched") {
    updateData.tmsShipmentDispatchedAt = new Date().toISOString();
  }
  if (status === "delivered") {
    updateData.tmsShipmentDeliveredAt = new Date().toISOString();
  }

  // Update shipment status
  const { data, error } = await supabase
    .from("tmsShipment")
    .update(updateData)
    .eq("tmsShipmentId", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  // Side effects
  try {
    if (status === "dispatched") {
      // Set vehicle to in_use, driver and assistant to on_duty
      if (shipment.tmsShipmentVehicleId) {
        await supabase
          .from("tmsVehicle")
          .update({ tmsVehicleStatus: "in_use" })
          .eq("tmsVehicleId", shipment.tmsShipmentVehicleId);
      }
      if (shipment.tmsShipmentDriverId) {
        await supabase
          .from("tmsDriver")
          .update({ tmsDriverStatus: "on_duty" })
          .eq("tmsDriverId", shipment.tmsShipmentDriverId);
      }
      if (shipment.tmsShipmentAssistantId) {
        await supabase
          .from("tmsDriver")
          .update({ tmsDriverStatus: "on_duty" })
          .eq("tmsDriverId", shipment.tmsShipmentAssistantId);
      }
    }

    if (status === "pod_confirmed") {
      // Reset vehicle to available, driver and assistant to available
      if (shipment.tmsShipmentVehicleId) {
        await supabase
          .from("tmsVehicle")
          .update({ tmsVehicleStatus: "available" })
          .eq("tmsVehicleId", shipment.tmsShipmentVehicleId);
      }
      if (shipment.tmsShipmentDriverId) {
        await supabase
          .from("tmsDriver")
          .update({ tmsDriverStatus: "available" })
          .eq("tmsDriverId", shipment.tmsShipmentDriverId);
      }
      if (shipment.tmsShipmentAssistantId) {
        await supabase
          .from("tmsDriver")
          .update({ tmsDriverStatus: "available" })
          .eq("tmsDriverId", shipment.tmsShipmentAssistantId);
      }
    }

    if (status === "cancelled") {
      // Reset vehicle and drivers to available if assigned
      if (shipment.tmsShipmentVehicleId) {
        await supabase
          .from("tmsVehicle")
          .update({ tmsVehicleStatus: "available" })
          .eq("tmsVehicleId", shipment.tmsShipmentVehicleId);
      }
      if (shipment.tmsShipmentDriverId) {
        await supabase
          .from("tmsDriver")
          .update({ tmsDriverStatus: "available" })
          .eq("tmsDriverId", shipment.tmsShipmentDriverId);
      }
      if (shipment.tmsShipmentAssistantId) {
        await supabase
          .from("tmsDriver")
          .update({ tmsDriverStatus: "available" })
          .eq("tmsDriverId", shipment.tmsShipmentAssistantId);
      }
    }
  } catch (sideEffectError) {
    // Side effects failed but status was updated successfully
    console.error("Side effect error:", sideEffectError);
  }

  return Response.json(data);
}
