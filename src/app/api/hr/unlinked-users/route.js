import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { data: allUsers, error: usersError } = await supabase
    .from("userProfiles")
    .select("userProfileId, userProfileEmail")
    .order("userProfileEmail");

  if (usersError)
    return Response.json({ error: usersError.message }, { status: 500 });

  const { data: linkedEmployees, error: empError } = await supabase
    .from("employees")
    .select("employeeUserId")
    .not("employeeUserId", "is", null);

  if (empError)
    return Response.json({ error: empError.message }, { status: 500 });

  const linkedIds = new Set(linkedEmployees.map((e) => e.employeeUserId));
  const unlinked = allUsers.filter((u) => !linkedIds.has(u.userProfileId));

  return Response.json(unlinked);
}
