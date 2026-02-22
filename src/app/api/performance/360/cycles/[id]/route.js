import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("feedback_360_cycles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const updates = { updatedAt: new Date().toISOString() };

  const fields = ["name", "description", "year", "quarter", "responseDeadline", "anonymousToReviewee"];
  for (const field of fields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  const { data, error } = await supabase
    .from("feedback_360_cycles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const { error } = await supabase
    .from("feedback_360_cycles")
    .delete()
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
