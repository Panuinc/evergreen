import { withAuth } from "@/app/api/_lib/auth";

const ALLOWED_MODELS = [
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "anthropic/claude-sonnet-4",
  "anthropic/claude-haiku-4",
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
];

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from("omAiSetting")
    .select("*")
    .limit(1)
    .single();

  if (error) return Response.json({ error: "Failed to load settings" }, { status: 500 });
  return Response.json(data);
}

export async function PUT(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updateData = { omAiSettingUpdatedAt: new Date().toISOString() };

  if (body.omAiSettingSystemPrompt !== undefined) {
    if (typeof body.omAiSettingSystemPrompt !== "string") {
      return Response.json({ error: "Invalid systemPrompt" }, { status: 400 });
    }
    updateData.omAiSettingSystemPrompt = body.omAiSettingSystemPrompt.slice(0, 10000);
  }

  if (body.omAiSettingModel !== undefined) {
    if (!ALLOWED_MODELS.includes(body.omAiSettingModel)) {
      return Response.json({ error: "Invalid model" }, { status: 400 });
    }
    updateData.omAiSettingModel = body.omAiSettingModel;
  }

  if (body.omAiSettingTemperature !== undefined) {
    const temp = Number(body.omAiSettingTemperature);
    if (isNaN(temp) || temp < 0 || temp > 2) {
      return Response.json({ error: "Temperature must be 0-2" }, { status: 400 });
    }
    updateData.omAiSettingTemperature = temp;
  }

  if (body.omAiSettingMaxHistoryMessages !== undefined) {
    const max = Number(body.omAiSettingMaxHistoryMessages);
    if (!Number.isInteger(max) || max < 1 || max > 50) {
      return Response.json({ error: "MaxHistoryMessages must be 1-50" }, { status: 400 });
    }
    updateData.omAiSettingMaxHistoryMessages = max;
  }

  if (body.omAiSettingBankAccountInfo !== undefined) {
    if (typeof body.omAiSettingBankAccountInfo !== "string") {
      return Response.json({ error: "Invalid bankAccountInfo" }, { status: 400 });
    }
    updateData.omAiSettingBankAccountInfo = body.omAiSettingBankAccountInfo.slice(0, 2000);
  }

  if (body.omAiSettingShippingInfo !== undefined) {
    updateData.omAiSettingShippingInfo = typeof body.omAiSettingShippingInfo === "string"
      ? body.omAiSettingShippingInfo.slice(0, 3000) : null;
  }

  if (body.omAiSettingAfterSalesInfo !== undefined) {
    updateData.omAiSettingAfterSalesInfo = typeof body.omAiSettingAfterSalesInfo === "string"
      ? body.omAiSettingAfterSalesInfo.slice(0, 3000) : null;
  }

  if (body.omAiSettingBrandStory !== undefined) {
    updateData.omAiSettingBrandStory = typeof body.omAiSettingBrandStory === "string"
      ? body.omAiSettingBrandStory.slice(0, 3000) : null;
  }

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

  if (error) return Response.json({ error: "Update failed" }, { status: 500 });
  return Response.json(data);
}
