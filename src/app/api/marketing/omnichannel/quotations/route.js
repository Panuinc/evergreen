import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  const status = searchParams.get("status");

  let query = auth.supabase
    .from("omQuotation")
    .select("*, omContact(omContactDisplayName, omContactChannelType)")
    .order("omQuotationCreatedAt", { ascending: false });

  if (conversationId) {
    query = query.eq("omQuotationConversationId", conversationId);
  }
  if (status) {
    query = query.eq("omQuotationStatus", status);
  }

  const { data, error } = await query;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data || []);
}
