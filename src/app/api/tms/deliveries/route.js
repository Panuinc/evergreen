import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  const { searchParams } = new URL(request.url);
  const shipmentId = searchParams.get("shipmentId");

  let query = supabase
    .from("tmsDelivery")
    .select("*, tmsShipment(tmsShipmentNumber, tmsShipmentCustomerName), tmsDeliveryItem(*)");
  if (!isSuperAdmin) query = query.eq("isActive", true);

  if (shipmentId) {
    query = query.eq("tmsDeliveryShipmentId", shipmentId);
  }

  const { data, error } = await fetchAll(query.order("tmsDeliveryCreatedAt", {
    ascending: false,
  }));

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const { items, ...deliveryData } = body;

  const { data, error } = await supabase
    .from("tmsDelivery")
    .insert([deliveryData])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });

  if (items && items.length > 0) {
    const itemRows = items.map((item) => ({
      ...item,
      tmsDeliveryItemDeliveryId: data.tmsDeliveryId,
    }));
    const { error: itemsError } = await supabase
      .from("tmsDeliveryItem")
      .insert(itemRows);
    if (itemsError)
      return Response.json({ error: itemsError.message }, { status: 400 });
  }

  const { data: result } = await supabase
    .from("tmsDelivery")
    .select("*, tmsDeliveryItem(*)")
    .eq("tmsDeliveryId", data.tmsDeliveryId)
    .single();

  return Response.json(result, { status: 201 });
}
