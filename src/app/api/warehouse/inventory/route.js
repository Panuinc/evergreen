import { withAuth } from "@/app/api/_lib/auth";

function formatItem(item) {
  return {
    number: item.bcItemNo,
    displayName: item.bcItemDescription,
    type: item.bcItemType,
    inventory: item.bcItemInventory,
    baseUnitOfMeasure: item.bcItemBaseUnitOfMeasure,
    unitPrice: item.bcItemUnitPrice,
    unitCost: item.bcItemUnitCost,
    itemCategoryCode: item.bcItemItemCategoryCode,
    generalProductPostingGroupCode: item.bcItemGenProdPostingGroup,
    rfidCode: item.bcItemRfidCode || null,
  };
}

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
        .from("bcItem")
        .select("*")
        .ilike("bcItemGenProdPostingGroup", group)
        .order("bcItemNo")
        .range(from, from + PAGE_SIZE - 1);

      if (error)
        return Response.json({ error: error.message }, { status: 500 });
      if (!data || data.length === 0) break;

      allData = allData.concat(data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    const filtered = allData.filter((item) => !item.bcItemBlocked && item.bcItemInventory > 0);
    return Response.json(filtered.map(formatItem));
  }

  let allData = [];
  let from = 0;

  while (true) {
    const { data, error } = await auth.supabase
      .from("bcItem")
      .select("*")
      .order("bcItemNo")
      .range(from, from + PAGE_SIZE - 1);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;

    allData = allData.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const filtered = allData.filter((item) => !item.bcItemBlocked && item.bcItemInventory > 0);
  return Response.json(filtered.map(formatItem));
}
