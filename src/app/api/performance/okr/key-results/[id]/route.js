import { withAuth } from "@/app/api/_lib/auth";
import { computeObjectiveProgress, autoKrStatus } from "@/lib/okrConstants";

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const { title, metricType, startValue, targetValue, currentValue, unit, weight } = body;

  const updates = { updatedAt: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (metricType !== undefined) updates.metricType = metricType;
  if (startValue !== undefined) updates.startValue = startValue;
  if (targetValue !== undefined) updates.targetValue = targetValue;
  if (currentValue !== undefined) updates.currentValue = currentValue;
  if (unit !== undefined) updates.unit = unit;
  if (weight !== undefined) updates.weight = weight;

  // Auto-compute status if currentValue changed
  if (currentValue !== undefined) {
    const { data: kr } = await supabase
      .from("okr_key_results")
      .select("*")
      .eq("id", id)
      .single();

    if (kr) {
      updates.status = autoKrStatus({ ...kr, ...updates });
    }
  }

  const { data, error } = await supabase
    .from("okr_key_results")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });

  // Update objective progress
  await updateObjectiveProgress(supabase, data.objectiveId);

  return Response.json(data);
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  // Get objectiveId before deleting
  const { data: kr } = await supabase
    .from("okr_key_results")
    .select("objectiveId")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("okr_key_results")
    .delete()
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });

  // Update objective progress
  if (kr) await updateObjectiveProgress(supabase, kr.objectiveId);

  return Response.json({ success: true });
}

async function updateObjectiveProgress(supabase, objectiveId) {
  const { data: krs } = await supabase
    .from("okr_key_results")
    .select("*")
    .eq("objectiveId", objectiveId);

  const progress = computeObjectiveProgress(krs || []);
  await supabase
    .from("okr_objectives")
    .update({ progress, updatedAt: new Date().toISOString() })
    .eq("id", objectiveId);
}
