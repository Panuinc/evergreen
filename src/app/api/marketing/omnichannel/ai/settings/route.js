import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from("omAiSetting")
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
  const updateData = { omAiSettingUpdatedAt: new Date().toISOString() };

  if (body.omAiSettingSystemPrompt !== undefined) updateData.omAiSettingSystemPrompt = body.omAiSettingSystemPrompt;
  if (body.omAiSettingModel !== undefined) updateData.omAiSettingModel = body.omAiSettingModel;
  if (body.omAiSettingTemperature !== undefined) updateData.omAiSettingTemperature = body.omAiSettingTemperature;
  if (body.omAiSettingMaxHistoryMessages !== undefined) updateData.omAiSettingMaxHistoryMessages = body.omAiSettingMaxHistoryMessages;
  if (body.omAiSettingBankAccountInfo !== undefined) updateData.omAiSettingBankAccountInfo = body.omAiSettingBankAccountInfo;

  const { data: existing } = await auth.supabase
    .from("omAiSetting")
    .select("omAiSettingId")
    .limit(1)
    .single();

  if (!existing) {
    return Response.json({ error: "No settings found" }, { status: 404 });
  }

  const { data, error } = await auth.supabase
    .from("omAiSetting")
    .update(updateData)
    .eq("omAiSettingId", existing.omAiSettingId)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
