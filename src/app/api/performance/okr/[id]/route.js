import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("perfOkrObjective")
    .select("*")
    .eq("perfOkrObjectiveId", id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });

  const { data: krs } = await supabase
    .from("perfOkrKeyResult").select("*")
    .eq("perfOkrKeyResultObjectiveId", id).order("perfOkrKeyResultSortOrder", { ascending: true });

  const { data: employee } = await supabase
    .from("hrEmployee")
    .select("hrEmployeeId, hrEmployeeFirstName, hrEmployeeLastName, hrEmployeeDepartment")
    .eq("hrEmployeeId", data.perfOkrObjectiveEmployeeId).maybeSingle();

  return Response.json({ ...data, keyResults: krs || [], employee: employee || null });
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const { title, description, status, visibility, progress } = body;

  const updates = { perfOkrObjectiveUpdatedAt: new Date().toISOString() };
  if (title !== undefined) updates.perfOkrObjectiveTitle = title;
  if (description !== undefined) updates.perfOkrObjectiveDescription = description;
  if (status !== undefined) updates.perfOkrObjectiveStatus = status;
  if (visibility !== undefined) updates.perfOkrObjectiveVisibility = visibility;
  if (progress !== undefined) updates.perfOkrObjectiveProgress = progress;

  const { data, error } = await supabase
    .from("perfOkrObjective")
    .update(updates)
    .eq("perfOkrObjectiveId", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });

  const { data: krs } = await supabase
    .from("perfOkrKeyResult").select("*")
    .eq("perfOkrKeyResultObjectiveId", id).order("perfOkrKeyResultSortOrder", { ascending: true });

  return Response.json({ ...data, keyResults: krs || [] });
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const { error } = await supabase
    .from("perfOkrObjective")
    .delete()
    .eq("perfOkrObjectiveId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
