import { withAuth } from "@/app/api/_lib/auth";
import { computeObjectiveProgress } from "@/lib/performance/okrConstants";

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const { objectiveId, title, metricType, startValue, targetValue, unit, weight } = body;

  if (!objectiveId || !title || targetValue === undefined) {
    return Response.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }


  const { data: existing } = await supabase
    .from("perfOkrKeyResult")
    .select("perfOkrKeyResultSortOrder")
    .eq("perfOkrKeyResultObjectiveId", objectiveId)
    .order("perfOkrKeyResultSortOrder", { ascending: false })
    .limit(1);

  const nextSort = existing && existing.length > 0 ? existing[0].perfOkrKeyResultSortOrder + 1 : 0;

  const { data, error } = await supabase
    .from("perfOkrKeyResult")
    .insert([{
      perfOkrKeyResultObjectiveId: objectiveId,
      perfOkrKeyResultTitle: title,
      perfOkrKeyResultMetricType: metricType || "number",
      perfOkrKeyResultStartValue: startValue || 0,
      perfOkrKeyResultTargetValue: targetValue,
      perfOkrKeyResultCurrentValue: startValue || 0,
      perfOkrKeyResultUnit: unit || null,
      perfOkrKeyResultWeight: weight || 1,
      perfOkrKeyResultSortOrder: nextSort,
    }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });


  await updateObjectiveProgress(supabase, objectiveId);

  return Response.json(data, { status: 201 });
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
