import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { userId } = await params;

  const { data, error } = await supabase
    .from("userRoles")
    .select("*, roles(*)")
    .eq("userRoleUserId", userId);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { userId } = await params;
  const { roleId } = await request.json();

  const { data, error } = await supabase
    .from("userRoles")
    .insert([{ userRoleUserId: userId, userRoleRoleId: roleId }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { userId } = await params;
  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get("roleId");

  const { error } = await supabase
    .from("userRoles")
    .delete()
    .eq("userRoleUserId", userId)
    .eq("userRoleRoleId", roleId);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
