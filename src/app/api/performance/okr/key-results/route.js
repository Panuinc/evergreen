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

  // Get current max sortOrder
  const { data: existing } = await supabase
    .from("okr_key_results")
    .select("sortOrder")
    .eq("objectiveId", objectiveId)
    .order("sortOrder", { ascending: false })
    .limit(1);

  const nextSort = existing && existing.length > 0 ? existing[0].sortOrder + 1 : 0;

  const { data, error } = await supabase
    .from("okr_key_results")
    .insert([{
      objectiveId,
      title,
      metricType: metricType || "number",
      startValue: startValue || 0,
      targetValue,
      currentValue: startValue || 0,
      unit: unit || null,
      weight: weight || 1,
      sortOrder: nextSort,
    }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });

  // Update objective progress
  await updateObjectiveProgress(supabase, objectiveId);

  return Response.json(data, { status: 201 });
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
