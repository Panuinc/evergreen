import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { roleId } = await params;

  const { data, error } = await supabase
    .from("rbacRolePermission")
    .select("*, rbacPermission(*, rbacResource(*), rbacAction(*))")
    .eq("rbacRolePermissionRoleId", roleId);

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
    .delete()
    .eq("rbacRolePermissionRoleId", roleId)
    .eq("rbacRolePermissionPermissionId", permissionId);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
