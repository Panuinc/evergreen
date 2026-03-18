import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const { data, error } = await supabase
    .from("mktWorkOrderProgressLog")
    .select("*")
    .eq("mktWorkOrderProgressLogWorkOrderId", id)
    .order("mktWorkOrderProgressLogCreatedAt", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const body = await request.json();

  const { data: log, error: logError } = await supabase
    .from("mktWorkOrderProgressLog")
    .insert([{ ...body, mktWorkOrderProgressLogWorkOrderId: id }])
    .select()
    .single();

  if (logError) return Response.json({ error: logError.message }, { status: 400 });

  const updateData = { mktWorkOrderProgress: body.mktWorkOrderProgressLogProgress };
  if (body.mktWorkOrderProgressLogProgress >= 100) {
    updateData.mktWorkOrderStatus = "completed";
    updateData.mktWorkOrderCompletedAt = new Date().toISOString();
  } else if (body.mktWorkOrderProgressLogProgress > 0) {
    updateData.mktWorkOrderStatus = "in_progress";
  }

  await supabase
    .from("mktWorkOrder")
    .update(updateData)
    .eq("id", id);

  return Response.json(log, { status: 201 });
}
