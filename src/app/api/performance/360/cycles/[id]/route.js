import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;
  const { id } = await params;

  let query = supabase
    .from("perf360Cycle")
    .select("*")
    .eq("perf360CycleId", id);
  if (!isSuperAdmin) query = query.eq("isActive", true);
  const { data, error } = await query.single();

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const updates = { perf360CycleUpdatedAt: new Date().toISOString() };

  const fieldMap = {
    name: "perf360CycleName",
    description: "perf360CycleDescription",
    year: "perf360CycleYear",
    quarter: "perf360CycleQuarter",
    responseDeadline: "perf360CycleResponseDeadline",
    anonymousToReviewee: "perf360CycleAnonymousToReviewee",
  };
  for (const [bodyField, dbField] of Object.entries(fieldMap)) {
    if (body[bodyField] !== undefined) updates[dbField] = body[bodyField];
  }

  const { data, error } = await supabase
    .from("perf360Cycle")
    .update(updates)
    .eq("perf360CycleId", id)
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
    .from("perf360Cycle")
    .update({ isActive: false })
    .eq("perf360CycleId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
