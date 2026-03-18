import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const [{ data: bcItems, error: itemErr }, priceResult] = await Promise.all([
      auth.supabase
        .from("bcItem")
        .select("*")
        .like("bcItemNo", "FG-00003%"),
      auth.supabase.from("omPriceItem").select("*"),
    ]);

    if (itemErr) throw new Error(itemErr.message);

    const priceMap = {};
    for (const p of priceResult.data || []) {
      priceMap[p.omPriceItemNumber] = p.omPriceItemUnitPrice;
    }

    const merged = (bcItems || []).map((item) => ({
      ...item,
      customPrice: priceMap[item.bcItemNo] ?? null,
    }));

    return Response.json(merged);
  } catch {
    return Response.json({ error: "Failed to load stock items" }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { items } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "items array is required" }, { status: 400 });
  }

  if (items.length > 500) {
    return Response.json({ error: "Too many items (max 500)" }, { status: 400 });
  }

  try {
    for (const item of items) {
      if (!item.number || typeof item.number !== "string") continue;

      const number = item.number.slice(0, 100);
      const name = typeof item.name === "string" ? item.name.slice(0, 500) : null;
      const price = Number(item.price);

      if (isNaN(price) || price < 0 || price > 999999999) continue;

      await auth.supabase.from("omPriceItem").upsert(
        {
          omPriceItemNumber: number,
          omPriceItemName: name,
          omPriceItemUnitPrice: price,
          omPriceItemUpdatedAt: new Date().toISOString(),
          omPriceItemUpdatedBy: auth.session.user.id,
        },
        { onConflict: "omPriceItemNumber" },
      );
    }

    return Response.json({ status: "saved" });
  } catch {
    return Response.json({ error: "Failed to save stock items" }, { status: 500 });
  }
}
