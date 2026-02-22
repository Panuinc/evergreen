import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("feedback_360_cycles")
    .select("*")
    .order("createdAt", { ascending: false });

  if (status) query = query.eq("status", status);

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
    .from("feedback_360_cycles")
    .insert([{
      name,
      description: description || null,
      year: parseInt(year),
      quarter: quarter ? parseInt(quarter) : null,
      responseDeadline,
      anonymousToReviewee: anonymousToReviewee !== false,
      createdBy: session.user.id,
    }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
