import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const { data, error } = await supabase
    .from("itDevProgressLogs")
    .select("*")
    .eq("logRequestId", id)
    .order("logCreatedAt", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const body = await request.json();

  // Insert progress log
  const { data: log, error: logError } = await supabase
    .from("itDevProgressLogs")
    .insert([{ ...body, logRequestId: id }])
    .select()
    .single();

  if (logError) return Response.json({ error: logError.message }, { status: 400 });

  // Update request progress and status
  const updateData = { requestProgress: body.logProgress };
  if (body.logProgress >= 100) {
    updateData.requestStatus = "completed";
    updateData.requestCompletedAt = new Date().toISOString();
  } else if (body.logProgress > 0) {
    updateData.requestStatus = "in_progress";
  }

  await supabase
    .from("itDevRequests")
    .update(updateData)
    .eq("requestId", id);

  return Response.json(log, { status: 201 });
}
