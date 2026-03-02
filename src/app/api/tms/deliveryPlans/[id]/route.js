import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;

  const { data, error } = await supabase
    .from("tmsDeliveryPlan")
    .select(`*, tmsDeliveryPlanItem(*)`)
    .eq("tmsDeliveryPlanId", id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const body = await request.json();
  const { items, ...planData } = body;

  planData.tmsDeliveryPlanUpdatedAt = new Date().toISOString();

  const { error: planError } = await supabase
    .from("tmsDeliveryPlan")
    .update(planData)
    .eq("tmsDeliveryPlanId", id);

  if (planError)
    return Response.json({ error: planError.message }, { status: 400 });

  if (items !== undefined) {
    await supabase
      .from("tmsDeliveryPlanItem")
      .delete()
      .eq("tmsDeliveryPlanItemPlanId", id);

    if (items.length > 0) {
      const itemRows = items.map((item) => ({
        ...item,
        tmsDeliveryPlanItemPlanId: id,
      }));

      const { error: itemsError } = await supabase
        .from("tmsDeliveryPlanItem")
        .insert(itemRows);

      if (itemsError)
        return Response.json({ error: itemsError.message }, { status: 400 });
    }
  }

  const { data: result } = await supabase
    .from("tmsDeliveryPlan")
    .select(`*, tmsDeliveryPlanItem(*)`)
    .eq("tmsDeliveryPlanId", id)
    .single();

  return Response.json(result);
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;

  const { error } = await supabase
    .from("tmsDeliveryPlan")
    .delete()
    .eq("tmsDeliveryPlanId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
