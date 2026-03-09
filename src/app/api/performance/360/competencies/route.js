import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");

  if (!cycleId) {
    return Response.json({ error: "กรุณาระบุ cycleId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("perf360Competency")
    .select("*")
    .eq("perf360CompetencyCycleId", cycleId)
    .order("perf360CompetencySortOrder");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const { cycleId, competencies } = body;

  if (!cycleId || !competencies || !Array.isArray(competencies)) {
    return Response.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }


  await supabase
    .from("perf360Competency")
    .delete()
    .eq("perf360CompetencyCycleId", cycleId);


  const rows = competencies.map((c, i) => ({
    perf360CompetencyCycleId: cycleId,
    perf360CompetencyName: c.name,
    perf360CompetencyDescription: c.description || null,
    perf360CompetencyQuestions: c.questions || [],
    perf360CompetencyWeight: c.weight || 1,
    perf360CompetencySortOrder: i,
  }));

  const { data, error } = await supabase
    .from("perf360Competency")
    .insert(rows)
    .select();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
