import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;

  const { data, error } = await supabase
    .from("omMessages")
    .select("*")
    .eq("messageConversationId", id)
    .order("messageCreatedAt", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
