import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("okr_objectives")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });

  const { data: krs } = await supabase
    .from("okr_key_results").select("*")
    .eq("objectiveId", id).order("sortOrder", { ascending: true });

  const { data: employee } = await supabase
    .from("employees")
    .select("employeeId, employeeFirstName, employeeLastName, employeeDepartment")
    .eq("employeeId", data.employeeId).maybeSingle();

  return Response.json({ ...data, keyResults: krs || [], employee: employee || null });
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const { title, description, status, visibility, progress } = body;

  const updates = { updatedAt: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (visibility !== undefined) updates.visibility = visibility;
  if (progress !== undefined) updates.progress = progress;

  const { data, error } = await supabase
    .from("okr_objectives")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });

  const { data: krs } = await supabase
    .from("okr_key_results").select("*")
    .eq("objectiveId", id).order("sortOrder", { ascending: true });

  return Response.json({ ...data, keyResults: krs || [] });
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const { error } = await supabase
    .from("okr_objectives")
    .delete()
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
