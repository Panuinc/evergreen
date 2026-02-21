import { withAuth } from "@/app/api/_lib/auth";

export async function POST(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { no } = await params;
  const body = await request.json();

  const record = {
    user_id: session.user.id,
    order_number: body.order_number || no,
    order_type: body.order_type,
    expected_items: body.expected_items,
    scanned_items: body.scanned_items,
    session_id: body.session_id || null,
  };

  const { data, error } = await supabase
    .from("orderMatches")
    .insert([record])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
