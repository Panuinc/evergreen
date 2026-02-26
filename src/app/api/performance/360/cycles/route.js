import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("perf360Cycle")
    .select("*")
    .order("perf360CycleCreatedAt", { ascending: false });

  if (status) query = query.eq("perf360CycleStatus", status);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const body = await request.json();
  const { name, description, year, quarter, responseDeadline, anonymousToReviewee } = body;

  if (!name || !year || !responseDeadline) {
    return Response.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("perf360Cycle")
    .insert([{
      perf360CycleName: name,
      perf360CycleDescription: description || null,
      perf360CycleYear: parseInt(year),
      perf360CycleQuarter: quarter ? parseInt(quarter) : null,
      perf360CycleResponseDeadline: responseDeadline,
      perf360CycleAnonymousToReviewee: anonymousToReviewee !== false,
      perf360CycleCreatedBy: session.user.id,
    }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
