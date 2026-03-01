import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  let query = supabase
    .from("rbacPermission")
    .select("*, rbacResource(*), rbacAction(*)");
  if (!isSuperAdmin) query = query.eq("isActive", true);
  const { data, error } = await query.order("rbacPermissionCreatedAt", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const { data, error } = await supabase
    .from("rbacPermission")
    .insert([body])
    .select("*, rbacResource(*), rbacAction(*)")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
