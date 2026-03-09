import { withAuth } from "@/app/api/_lib/auth";
import { computeObjectiveProgress, autoKrStatus } from "@/lib/performance/okrConstants";

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const { title, metricType, startValue, targetValue, currentValue, unit, weight } = body;

  const updates = { perfOkrKeyResultUpdatedAt: new Date().toISOString() };
  if (title !== undefined) updates.perfOkrKeyResultTitle = title;
  if (metricType !== undefined) updates.perfOkrKeyResultMetricType = metricType;
  if (startValue !== undefined) updates.perfOkrKeyResultStartValue = startValue;
  if (targetValue !== undefined) updates.perfOkrKeyResultTargetValue = targetValue;
  if (currentValue !== undefined) updates.perfOkrKeyResultCurrentValue = currentValue;
  if (unit !== undefined) updates.perfOkrKeyResultUnit = unit;
  if (weight !== undefined) updates.perfOkrKeyResultWeight = weight;


  if (currentValue !== undefined) {
    const { data: kr } = await supabase
      .from("perfOkrKeyResult")
      .select("*")
      .eq("perfOkrKeyResultId", id)
      .single();

    if (kr) {
      updates.perfOkrKeyResultStatus = autoKrStatus({ ...kr, ...updates });
    }
  }

  const { data, error } = await supabase
    .from("perfOkrKeyResult")
    .update(updates)
    .eq("perfOkrKeyResultId", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });


  await updateObjectiveProgress(supabase, data.perfOkrKeyResultObjectiveId);

  return Response.json(data);
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;


  const { data: kr } = await supabase
    .from("perfOkrKeyResult")
    .select("perfOkrKeyResultObjectiveId")
    .eq("perfOkrKeyResultId", id)
    .single();

  const { error } = await supabase
    .from("perfOkrKeyResult")
    .update({ isActive: false })
    .eq("perfOkrKeyResultId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });


  if (kr) await updateObjectiveProgress(supabase, kr.perfOkrKeyResultObjectiveId);

  return Response.json({ success: true });
}

async function updateObjectiveProgress(supabase, objectiveId) {
  const { data: krs } = await supabase
    .from("perfOkrKeyResult")
    .select("*")
    .eq("perfOkrKeyResultObjectiveId", objectiveId)
    .eq("isActive", true);

  const progress = computeObjectiveProgress(krs || []);
  await supabase
    .from("perfOkrObjective")
    .update({ perfOkrObjectiveProgress: progress, perfOkrObjectiveUpdatedAt: new Date().toISOString() })
    .eq("perfOkrObjectiveId", objectiveId);
}
