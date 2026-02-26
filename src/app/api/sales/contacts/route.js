import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  let query = supabase
    .from("crmContact")
    .select("*, crmAccount(crmAccountName)");

  if (search) {
    query = query.or(
      `crmContactFirstName.ilike.%${search}%,crmContactLastName.ilike.%${search}%,crmContactEmail.ilike.%${search}%,crmContactPhone.ilike.%${search}%`
    );
  }

  const { data, error } = await query.order("crmContactCreatedAt", {
    ascending: false,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const { data, error } = await supabase
    .from("crmContact")
    .insert([body])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
