import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { roleId } = await params;

  const { data, error } = await supabase
    .from("rolePermissions")
    .select("*, permissions(*, resources(*), actions(*))")
    .eq("rolePermissionRoleId", roleId);

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
    .from("rolePermissions")
    .insert([
      {
        rolePermissionRoleId: roleId,
        rolePermissionPermissionId: permissionId,
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
    .from("rolePermissions")
    .delete()
    .eq("rolePermissionRoleId", roleId)
    .eq("rolePermissionPermissionId", permissionId);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
