import { withAuth } from "@/app/api/_lib/auth";

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update = {};
  if (body.status && ["pending", "sent", "cancelled"].includes(body.status)) {
    update.omFollowUpStatus = body.status;
    if (body.status === "sent") update.omFollowUpSentAt = new Date().toISOString();
  }
  if (body.scheduledAt) update.omFollowUpScheduledAt = body.scheduledAt;
  if (body.message !== undefined) update.omFollowUpMessage = body.message ? String(body.message).slice(0, 2000) : null;

  try {
    const { data, error } = await auth.supabase
      .from("omFollowUp")
      .update(update)
      .eq("omFollowUpId", id)
      .select()
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to update follow-up" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const { error } = await auth.supabase
      .from("omFollowUp")
      .delete()
      .eq("omFollowUpId", id);

    if (error) throw error;
    return Response.json({ status: "deleted" });
  } catch {
    return Response.json({ error: "Failed to delete follow-up" }, { status: 500 });
  }
}
