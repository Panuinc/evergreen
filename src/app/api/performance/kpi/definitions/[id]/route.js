import { withAuth } from "@/app/api/_lib/auth";

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const updates = { perfKpiDefinitionUpdatedAt: new Date().toISOString() };

  const fieldMap = {
    name: "perfKpiDefinitionName",
    description: "perfKpiDefinitionDescription",
    category: "perfKpiDefinitionCategory",
    unit: "perfKpiDefinitionUnit",
    frequency: "perfKpiDefinitionFrequency",
    targetValue: "perfKpiDefinitionTargetValue",
    warningThreshold: "perfKpiDefinitionWarningThreshold",
    criticalThreshold: "perfKpiDefinitionCriticalThreshold",
    higherIsBetter: "perfKpiDefinitionHigherIsBetter",
    isActive: "perfKpiDefinitionIsActive",
  };
  for (const [bodyField, dbField] of Object.entries(fieldMap)) {
    if (body[bodyField] !== undefined) updates[dbField] = body[bodyField];
  }

  const { data, error } = await supabase
    .from("perfKpiDefinition")
    .update(updates)
    .eq("perfKpiDefinitionId", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const { error } = await supabase
    .from("perfKpiDefinition")
    .update({ isActive: false })
    .eq("perfKpiDefinitionId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
