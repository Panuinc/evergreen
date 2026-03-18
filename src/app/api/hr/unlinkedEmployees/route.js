import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { data, error } = await fetchAll(supabase
    .from("hrEmployee")
    .select("hrEmployeeId, hrEmployeeFirstName, hrEmployeeLastName, hrEmployeeEmail")
    .eq("isActive", true)
    .is("hrEmployeeUserId", null)
    .order("hrEmployeeFirstName"));

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
