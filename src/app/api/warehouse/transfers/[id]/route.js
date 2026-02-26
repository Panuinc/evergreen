import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { id } = await params;

  const { data, error } = await supabase
    .from("whTransfer")
    .select("*")
    .eq("whTransferId", id)
    .eq("whTransferUserId", session.user.id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { id } = await params;
  const body = await request.json();

  const updates = {};
  if (body.status !== undefined) {
    updates.whTransferStatus = body.status;
    if (body.status === "completed") {
      updates.whTransferCompletedAt = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("whTransfer")
    .update(updates)
    .eq("whTransferId", id)
    .eq("whTransferUserId", session.user.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}
