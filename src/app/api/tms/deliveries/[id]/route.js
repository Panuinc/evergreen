import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  const { id } = await params;
  let query = supabase
    .from("tmsDelivery")
    .select("*, tmsDeliveryItem(*)")
    .eq("tmsDeliveryId", id);
  if (!isSuperAdmin) query = query.eq("isActive", true);
  const { data, error } = await query.single();

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const body = await request.json();
  const { items, ...deliveryData } = body;

  const { error } = await supabase
    .from("tmsDelivery")
    .update(deliveryData)
    .eq("tmsDeliveryId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });

  if (items !== undefined) {
    await supabase
      .from("tmsDeliveryItem")
      .delete()
      .eq("tmsDeliveryItemDeliveryId", id);

    if (items.length > 0) {
      const itemRows = items.map((item) => ({
        ...item,
        tmsDeliveryItemDeliveryId: parseInt(id),
      }));
      const { error: itemsError } = await supabase
        .from("tmsDeliveryItem")
        .insert(itemRows);
      if (itemsError)
        return Response.json({ error: itemsError.message }, { status: 400 });
    }
  }

  const { data: result } = await supabase
    .from("tmsDelivery")
    .select("*, tmsDeliveryItem(*)")
    .eq("tmsDeliveryId", id)
    .single();

  return Response.json(result);
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const { error } = await supabase
    .from("tmsDelivery")
    .update({ isActive: false })
    .eq("tmsDeliveryId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
