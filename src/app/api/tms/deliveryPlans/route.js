import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  let query = supabase
    .from("tmsDeliveryPlan")
    .select(`*, tmsDeliveryPlanItem(*)`);

  const shipmentId = searchParams.get("shipmentId");
  if (shipmentId) {
    query = query.eq("tmsDeliveryPlanShipmentId", shipmentId);
  }

  if (month) {
    const [year, mon] = month.split("-");
    const start = `${year}-${mon}-01`;
    const end = new Date(parseInt(year), parseInt(mon), 0)
      .toISOString()
      .split("T")[0];
    query = query
      .gte("tmsDeliveryPlanDate", start)
      .lte("tmsDeliveryPlanDate", end);
  }

  const { data, error } = await query.order("tmsDeliveryPlanDate", {
    ascending: true,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const body = await request.json();
  const { items, ...planData } = body;

  planData.tmsDeliveryPlanCreatedBy = session.user.id;

  const { data: plan, error: planError } = await supabase
    .from("tmsDeliveryPlan")
    .insert([planData])
    .select()
    .single();

  if (planError)
    return Response.json({ error: planError.message }, { status: 400 });

  if (items && items.length > 0) {
    const itemRows = items.map((item) => ({
      ...item,
      tmsDeliveryPlanItemPlanId: plan.tmsDeliveryPlanId,
    }));

    const { error: itemsError } = await supabase
      .from("tmsDeliveryPlanItem")
      .insert(itemRows);

    if (itemsError)
      return Response.json({ error: itemsError.message }, { status: 400 });
  }

  const { data: result } = await supabase
    .from("tmsDeliveryPlan")
    .select(`*, tmsDeliveryPlanItem(*)`)
    .eq("tmsDeliveryPlanId", plan.tmsDeliveryPlanId)
    .single();

  return Response.json(result, { status: 201 });
}
