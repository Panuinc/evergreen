import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from("bcItems")
    .select("*")
    .order("number");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
