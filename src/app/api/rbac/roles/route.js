import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  let query = supabase
    .from("rbacRole")
    .select(
      "*, rbacUserRole:rbacUserRole(count), rbacRolePermission:rbacRolePermission(count)",
    );
  if (!isSuperAdmin) query = query.eq("isActive", true);
  const { data, error } = await fetchAll(query.order("rbacRoleCreatedAt", { ascending: false }));

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const { data, error } = await supabase
    .from("rbacRole")
    .insert([body])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
