import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const activeOnly = searchParams.get("activeOnly");

  let query = supabase
    .from("kpi_definitions")
    .select("*")
    .order("category")
    .order("name");

  if (category) query = query.eq("category", category);
  if (activeOnly === "true") query = query.eq("isActive", true);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const body = await request.json();
  const { name, description, category, unit, frequency, targetValue, warningThreshold, criticalThreshold, higherIsBetter } = body;

  if (!name || !unit) {
    return Response.json({ error: "กรุณากรอกชื่อและหน่วย" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("kpi_definitions")
    .insert([{
      name,
      description: description || null,
      category: category || "general",
      unit,
      frequency: frequency || "monthly",
      targetValue: targetValue != null ? parseFloat(targetValue) : null,
      warningThreshold: warningThreshold != null ? parseFloat(warningThreshold) : null,
      criticalThreshold: criticalThreshold != null ? parseFloat(criticalThreshold) : null,
      higherIsBetter: higherIsBetter !== false,
      createdBy: session.user.id,
    }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
