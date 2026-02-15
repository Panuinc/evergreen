import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("employees")
    .select("employeeId, employeeFirstName, employeeLastName, employeeEmail")
    .is("employeeUserId", null)
    .order("employeeFirstName");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
