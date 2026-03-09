import { withAuth } from "@/app/api/_lib/auth";

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const updates = {};
  if (body.targetValue !== undefined) updates.perfKpiAssignmentTargetValue = parseFloat(body.targetValue);
  if (body.weight !== undefined) updates.perfKpiAssignmentWeight = parseFloat(body.weight);

  const { data, error } = await supabase
    .from("perfKpiAssignment")
    .update(updates)
    .eq("perfKpiAssignmentId", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });


  const { data: definition } = await supabase
    .from("perfKpiDefinition").select("*")
    .eq("perfKpiDefinitionId", data.perfKpiAssignmentDefinitionId).maybeSingle();

  return Response.json({ ...data, definition: definition || null });
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const { error } = await supabase
    .from("perfKpiAssignment")
    .update({ isActive: false })
    .eq("perfKpiAssignmentId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
