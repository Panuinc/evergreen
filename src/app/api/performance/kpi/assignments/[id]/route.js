import { withAuth } from "@/app/api/_lib/auth";

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const updates = {};
  if (body.targetValue !== undefined) updates.targetValue = parseFloat(body.targetValue);
  if (body.weight !== undefined) updates.weight = parseFloat(body.weight);

  const { data, error } = await supabase
    .from("kpi_assignments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });

  // Fetch definition separately
  const { data: definition } = await supabase
    .from("kpi_definitions").select("*")
    .eq("id", data.definitionId).maybeSingle();

  return Response.json({ ...data, definition: definition || null });
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const { error } = await supabase
    .from("kpi_assignments")
    .delete()
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
