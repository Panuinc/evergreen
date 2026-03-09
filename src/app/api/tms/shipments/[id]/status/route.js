import { withAuth } from "@/app/api/_lib/auth";

const VALID_TRANSITIONS = {
  pending: ["confirmed", "dispatched", "cancelled", "pod_confirmed"],
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
  const body = await request.json();
  const status = body.tmsShipmentStatus || body.status;


  const { data: shipment, error: fetchError } = await supabase
    .from("tmsShipment")
    .select("*")
    .eq("tmsShipmentId", id)
    .eq("isActive", true)
    .single();

  if (fetchError) {
    return Response.json({ error: fetchError.message }, { status: 404 });
  }


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


  const updateData = { tmsShipmentStatus: status };


  if (status === "dispatched") {
    updateData.tmsShipmentDispatchedAt = new Date().toISOString();
  }
  if (status === "delivered") {
    updateData.tmsShipmentDeliveredAt = new Date().toISOString();
  }


  const { data, error } = await supabase
    .from("tmsShipment")
    .update(updateData)
    .eq("tmsShipmentId", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }


  try {

    const planStatusMap = {
      dispatched: "in_progress",
      in_transit: "in_progress",
      arrived: "in_progress",
      delivered: "in_progress",
      pod_confirmed: "completed",
      cancelled: "planned",
    };
    if (planStatusMap[status]) {
      const { data: linkedPlans } = await supabase
        .from("tmsDeliveryPlan")
        .select("tmsDeliveryPlanId")
        .eq("tmsDeliveryPlanShipmentId", id);

      if (linkedPlans?.length > 0) {
        for (const plan of linkedPlans) {
          await supabase
            .from("tmsDeliveryPlan")
            .update({
              tmsDeliveryPlanStatus: planStatusMap[status],
              tmsDeliveryPlanUpdatedAt: new Date().toISOString(),
            })
            .eq("tmsDeliveryPlanId", plan.tmsDeliveryPlanId);
        }
      }
    }

    if (status === "dispatched") {

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

    console.error("Side effect error:", sideEffectError);
  }

  return Response.json(data);
}
