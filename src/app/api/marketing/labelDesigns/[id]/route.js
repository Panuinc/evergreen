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

  const update = { labelDesignUpdatedAt: new Date().toISOString() };

  if (body.labelDesignName !== undefined) {
    update.labelDesignName = String(body.labelDesignName).slice(0, 200);
  }
  if (body.labelDesignWidth !== undefined) {
    update.labelDesignWidth = Number(body.labelDesignWidth) || 100;
  }
  if (body.labelDesignHeight !== undefined) {
    update.labelDesignHeight = Number(body.labelDesignHeight) || 30;
  }
  if (body.labelDesignPreset !== undefined) {
    update.labelDesignPreset = body.labelDesignPreset;
  }
  if (body.labelDesignElements !== undefined) {
    update.labelDesignElements = body.labelDesignElements;
  }

  try {
    const { data, error } = await auth.supabase
      .from("labelDesign")
      .update(update)
      .eq("labelDesignId", id)
      .select()
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch {
    return Response.json(
      { error: "Failed to update label design" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const { error } = await auth.supabase
      .from("labelDesign")
      .delete()
      .eq("labelDesignId", id);

    if (error) throw error;
    return Response.json({ status: "deleted" });
  } catch {
    return Response.json(
      { error: "Failed to delete label design" },
      { status: 500 },
    );
  }
}
