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
    .from("feedback_360_competencies")
    .select("*")
    .eq("cycleId", cycleId)
    .order("sortOrder");

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

  // Delete existing competencies for this cycle
  await supabase
    .from("feedback_360_competencies")
    .delete()
    .eq("cycleId", cycleId);

  // Insert new ones
  const rows = competencies.map((c, i) => ({
    cycleId,
    name: c.name,
    description: c.description || null,
    questions: c.questions || [],
    weight: c.weight || 1,
    sortOrder: i,
  }));

  const { data, error } = await supabase
    .from("feedback_360_competencies")
    .insert(rows)
    .select();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
