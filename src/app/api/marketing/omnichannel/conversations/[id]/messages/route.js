import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  const { id } = await params;

  let query = supabase
    .from("omMessage")
    .select("*")
    .eq("omMessageConversationId", id);
  if (!isSuperAdmin) query = query.eq("isActive", true);
  const { data, error } = await query.order("omMessageCreatedAt", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
