import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  let query = supabase.from("itAsset").select("*");
  if (!isSuperAdmin) query = query.eq("isActive", true);

  if (search) {
    query = query.or(
      `itAssetName.ilike.%${search}%,itAssetTag.ilike.%${search}%,itAssetBrand.ilike.%${search}%`
    );
  }

  const { data, error } = await fetchAll(query.order("itAssetCreatedAt", {
    ascending: false,
  }));

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const { data, error } = await supabase
    .from("itAsset")
    .insert([body])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
