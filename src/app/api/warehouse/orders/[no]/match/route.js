import { withAuth } from "@/app/api/_lib/auth";

export async function POST(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { no } = await params;
  const body = await request.json();

  const record = {
    whOrderMatchUserId: session.user.id,
    whOrderMatchOrderNumber: body.order_number || no,
    whOrderMatchOrderType: body.order_type,
    whOrderMatchExpectedItems: body.expected_items,
    whOrderMatchScannedItems: body.scanned_items,
    whOrderMatchSessionId: body.session_id || null,
  };

  const { data, error } = await supabase
    .from("whOrderMatch")
    .insert([record])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
