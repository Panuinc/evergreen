import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;
  const { roleId } = await params;

  let query = supabase
    .from("rbacRolePermission")
    .select("*, rbacPermission(*, rbacResource(*), rbacAction(*))")
    .eq("rbacRolePermissionRoleId", roleId);
  if (!isSuperAdmin) query = query.eq("isActive", true);
  const { data, error } = await query;

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { roleId } = await params;
  const { permissionId } = await request.json();

  const { data, error } = await supabase
    .from("rbacRolePermission")
    .insert([
      {
        rbacRolePermissionRoleId: roleId,
        rbacRolePermissionPermissionId: permissionId,
      },
    ])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { roleId } = await params;
  const { searchParams } = new URL(request.url);
  const permissionId = searchParams.get("permissionId");

  const { error } = await supabase
    .from("rbacRolePermission")
    .update({ isActive: false })
    .eq("rbacRolePermissionRoleId", roleId)
    .eq("rbacRolePermissionPermissionId", permissionId);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
