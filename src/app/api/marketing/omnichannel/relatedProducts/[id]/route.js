import { withAuth } from "@/app/api/_lib/auth";

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const { error } = await auth.supabase
      .from("omRelatedProduct")
      .delete()
      .eq("omRelatedProductId", id);

    if (error) throw error;
    return Response.json({ status: "deleted" });
  } catch {
    return Response.json({ error: "Failed to delete related product" }, { status: 500 });
  }
}
