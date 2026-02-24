import { withAuth } from "@/app/api/_lib/auth";

const PAGE_SIZE = 1000;

async function fetchAllEntries(supabase) {
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("bcItemLedgerEntries")
      .select("*")
      .order("postingDate", { ascending: false })
      .order("entryNo", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const entries = await fetchAllEntries(auth.supabase);

    const result = entries.map((e) => ({
      id: e.id,
      entryNo: e.entryNo,
      postingDate: e.postingDate,
      entryType: e.entryType,
      documentNo: e.documentNo,
      orderNo: e.orderNo,
      itemNo: e.itemNo,
      description: e.description,
      locationCode: e.locationCode,
      quantity: parseFloat(e.quantity) || 0,
      unitOfMeasureCode: e.unitOfMeasureCode,
      costAmountActual: parseFloat(e.costAmountActual) || 0,
      costAmountExpected: parseFloat(e.costAmountExpected) || 0,
      dim1: e.globalDimension1Code || "-",
      dim2: e.globalDimension2Code || "-",
      sourceNo: e.sourceNo || "-",
      sourceDescription: e.sourceDescription || "-",
      createdBy: e.createdBy || "-",
      open: e.open,
    }));

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
