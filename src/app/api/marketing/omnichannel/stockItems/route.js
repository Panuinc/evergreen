import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    // Fetch from Supabase cache and price list in parallel
    const [{ data: bcItems, error: itemErr }, priceResult] = await Promise.all([
      auth.supabase
        .from("bcItem")
        .select("bcItemNumber,bcItemDisplayName,bcItemUnitPrice,bcItemUnitCost,bcItemInventory,bcItemBaseUnitOfMeasure")
        .like("bcItemNumber", "FG-00003%"),
      auth.supabase.from("omPriceItem").select("*"),
    ]);

    if (itemErr) throw new Error(itemErr.message);

    // Build price lookup map
    const priceMap = {};
    for (const p of priceResult.data || []) {
      priceMap[p.omPriceItemNumber] = p.omPriceItemUnitPrice;
    }

    const merged = (bcItems || []).map((item) => ({
      number: item.bcItemNumber,
      displayName: item.bcItemDisplayName,
      unitPrice: item.bcItemUnitPrice,
      unitCost: item.bcItemUnitCost,
      inventory: item.bcItemInventory,
      baseUnitOfMeasure: item.bcItemBaseUnitOfMeasure,
      customPrice: priceMap[item.bcItemNumber] ?? null,
    }));

    return Response.json(merged);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { items } = await request.json();

    for (const item of items) {
      await auth.supabase.from("omPriceItem").upsert(
        {
          omPriceItemNumber: item.number,
          omPriceItemName: item.name,
          omPriceItemUnitPrice: item.price,
          omPriceItemUpdatedAt: new Date().toISOString(),
          omPriceItemUpdatedBy: auth.session.user.id,
        },
        { onConflict: "omPriceItemNumber" },
      );
    }

    return Response.json({ status: "saved" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
