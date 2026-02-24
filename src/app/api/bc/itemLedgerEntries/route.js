import { withAuth } from "@/app/api/_lib/auth";

const PAGE_SIZE = 1000;

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const itemNo = url.searchParams.get("itemNo");
  const entryType = url.searchParams.get("entryType");
  const locationCode = url.searchParams.get("locationCode");

  let allData = [];
  let from = 0;

  while (true) {
    let query = auth.supabase
      .from("bcItemLedgerEntries")
      .select("*")
      .order("entryNo", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (itemNo) query = query.eq("itemNo", itemNo);
    if (entryType) query = query.eq("entryType", entryType);
    if (locationCode) query = query.eq("locationCode", locationCode);

    const { data, error } = await query;

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;

    allData = allData.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return Response.json(allData);
}
