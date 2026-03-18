import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const activeOnly = searchParams.get("activeOnly");

  let query = supabase
    .from("perfKpiDefinition")
    .select("*");
  if (!isSuperAdmin) query = query.eq("isActive", true);
  query = query.order("perfKpiDefinitionCategory").order("perfKpiDefinitionName");

  if (category) query = query.eq("perfKpiDefinitionCategory", category);
  if (activeOnly === "true") query = query.eq("perfKpiDefinitionIsActive", true);

  const { data, error } = await fetchAll(query);
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
    .from("perfKpiDefinition")
    .insert([{
      perfKpiDefinitionName: name,
      perfKpiDefinitionDescription: description || null,
      perfKpiDefinitionCategory: category || "general",
      perfKpiDefinitionUnit: unit,
      perfKpiDefinitionFrequency: frequency || "monthly",
      perfKpiDefinitionTargetValue: targetValue != null ? parseFloat(targetValue) : null,
      perfKpiDefinitionWarningThreshold: warningThreshold != null ? parseFloat(warningThreshold) : null,
      perfKpiDefinitionCriticalThreshold: criticalThreshold != null ? parseFloat(criticalThreshold) : null,
      perfKpiDefinitionHigherIsBetter: higherIsBetter !== false,
      perfKpiDefinitionCreatedBy: session.user.id,
    }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
