import { withAuth } from "@/app/api/_lib/auth";

const PAGE_SIZE = 1000;

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group");

  if (group) {
    let allData = [];
    let from = 0;

    while (true) {
      const { data, error } = await auth.supabase
        .from("bcItems")
        .select("*")
        .ilike("generalProductPostingGroupCode", group)
        .order("number")
        .range(from, from + PAGE_SIZE - 1);

      if (error)
        return Response.json({ error: error.message }, { status: 500 });
      if (!data || data.length === 0) break;

      allData = allData.concat(data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    const filtered = allData.filter((item) => !item.blocked);
    return Response.json(filtered);
  }

  let allData = [];
  let from = 0;

  while (true) {
    const { data, error } = await auth.supabase
      .from("bcItems")
      .select("*")
      .order("number")
      .range(from, from + PAGE_SIZE - 1);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;

    allData = allData.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const filtered = allData.filter((item) => !item.blocked);
  return Response.json(filtered);
}
