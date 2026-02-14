import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { userId } = await params;

  const { data, error } = await supabase.rpc("get_user_permissions", {
    p_user_id: userId,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
