import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  const status = searchParams.get("status");

  let query = auth.supabase
    .from("omQuotations")
    .select("*, omContacts(contactDisplayName, contactChannelType)")
    .order("quotationCreatedAt", { ascending: false });

  if (conversationId) {
    query = query.eq("quotationConversationId", conversationId);
  }
  if (status) {
    query = query.eq("quotationStatus", status);
  }

  const { data, error } = await query;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data || []);
}
