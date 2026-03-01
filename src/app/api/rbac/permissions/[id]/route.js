import { withAuth } from "@/app/api/_lib/auth";

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const { error } = await supabase
    .from("rbacPermission")
    .update({ isActive: false })
    .eq("rbacPermissionId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
