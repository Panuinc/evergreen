import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const { data, error } = await supabase
    .from("itDevProgressLog")
    .select("*")
    .eq("itDevProgressLogRequestId", id)
    .order("itDevProgressLogCreatedAt", { ascending: false });

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
    .from("itDevProgressLog")
    .insert([{ ...body, itDevProgressLogRequestId: id }])
    .select()
    .single();

  if (logError) return Response.json({ error: logError.message }, { status: 400 });


  const updateData = { itDevRequestProgress: body.itDevProgressLogProgress };
  if (body.itDevProgressLogProgress >= 100) {
    updateData.itDevRequestStatus = "completed";
    updateData.itDevRequestCompletedAt = new Date().toISOString();
  } else if (body.itDevProgressLogProgress > 0) {
    updateData.itDevRequestStatus = "in_progress";
  }

  await supabase
    .from("itDevRequest")
    .update(updateData)
    .eq("itDevRequestId", id);

  return Response.json(log, { status: 201 });
}
