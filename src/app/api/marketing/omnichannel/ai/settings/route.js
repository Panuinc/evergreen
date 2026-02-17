import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from("omAiSettings")
    .select("*")
    .limit(1)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function PUT(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const body = await request.json();
  const updateData = { aiUpdatedAt: new Date().toISOString() };

  if (body.aiSystemPrompt !== undefined) updateData.aiSystemPrompt = body.aiSystemPrompt;
  if (body.aiModel !== undefined) updateData.aiModel = body.aiModel;
  if (body.aiTemperature !== undefined) updateData.aiTemperature = body.aiTemperature;
  if (body.aiMaxHistoryMessages !== undefined) updateData.aiMaxHistoryMessages = body.aiMaxHistoryMessages;
  if (body.aiBankAccountInfo !== undefined) updateData.aiBankAccountInfo = body.aiBankAccountInfo;

  const { data: existing } = await auth.supabase
    .from("omAiSettings")
    .select("aiSettingsId")
    .limit(1)
    .single();

  if (!existing) {
    return Response.json({ error: "No settings found" }, { status: 404 });
  }

  const { data, error } = await auth.supabase
    .from("omAiSettings")
    .update(updateData)
    .eq("aiSettingsId", existing.aiSettingsId)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
