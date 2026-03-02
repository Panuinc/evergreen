import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;
  const { userId } = await params;

  let query = supabase
    .from("rbacUserRole")
    .select("*, rbacRole(*)")
    .eq("rbacUserRoleUserId", userId);
  if (!isSuperAdmin) query = query.eq("isActive", true);
  const { data, error } = await query;

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { userId } = await params;
  const body = await request.json();
  const roleId = body.rbacUserRoleRoleId || body.roleId;

  const { data, error } = await supabase
    .from("rbacUserRole")
    .insert([{ rbacUserRoleUserId: userId, rbacUserRoleRoleId: roleId }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}

export async function PATCH(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  if (!isSuperAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await request.json();
  const { isActive } = body;

  if (typeof isActive !== "boolean") {
    return Response.json({ error: "isActive must be boolean" }, { status: 400 });
  }

  const { error } = await supabase
    .from("rbacUserProfile")
    .update({ isActive })
    .eq("rbacUserProfileId", userId);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { userId } = await params;
  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get("rbacUserRoleRoleId") || searchParams.get("roleId");

  const { error } = await supabase
    .from("rbacUserRole")
    .update({ isActive: false })
    .eq("rbacUserRoleUserId", userId)
    .eq("rbacUserRoleRoleId", roleId);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
