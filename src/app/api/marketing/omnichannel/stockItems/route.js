import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    // Fetch from Supabase cache and price list in parallel
    const [{ data: bcItems, error: itemErr }, priceResult] = await Promise.all([
      auth.supabase
        .from("bcItems")
        .select("number,displayName,unitPrice,unitCost,inventory,baseUnitOfMeasure")
        .like("number", "FG-00003%"),
      auth.supabase.from("omPriceList").select("*"),
    ]);

    if (itemErr) throw new Error(itemErr.message);

    // Build price lookup map
    const priceMap = {};
    for (const p of priceResult.data || []) {
      priceMap[p.priceItemNumber] = p.priceUnitPrice;
    }

    const merged = (bcItems || []).map((item) => ({
      number: item.number,
      displayName: item.displayName,
      unitPrice: item.unitPrice,
      unitCost: item.unitCost,
      inventory: item.inventory,
      baseUnitOfMeasure: item.baseUnitOfMeasure,
      customPrice: priceMap[item.number] ?? null,
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
      await auth.supabase.from("omPriceList").upsert(
        {
          priceItemNumber: item.number,
          priceItemName: item.name,
          priceUnitPrice: item.price,
          priceUpdatedAt: new Date().toISOString(),
          priceUpdatedBy: auth.session.user.id,
        },
        { onConflict: "priceItemNumber" },
      );
    }

    return Response.json({ status: "saved" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
