import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const channel = searchParams.get("channel");
  const search = searchParams.get("search");

  let query = supabase
    .from("omConversation")
    .select("*, omContact(*)");
  if (!isSuperAdmin) query = query.eq("isActive", true);

  if (status && status !== "all") {
    query = query.eq("omConversationStatus", status);
  }

  if (channel && channel !== "all") {
    query = query.eq("omConversationChannelType", channel);
  }

  const { data, error } = await query.order("omConversationLastMessageAt", {
    ascending: false,
    nullsFirst: false,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  let result = data || [];

  if (search) {
    const term = search.toLowerCase();
    result = result.filter((c) =>
      c.omContact?.omContactDisplayName?.toLowerCase().includes(term) ||
      c.omConversationLastMessagePreview?.toLowerCase().includes(term)
    );
  }

  return Response.json(result);
}
