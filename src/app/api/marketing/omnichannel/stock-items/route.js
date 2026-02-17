import { withAuth } from "@/app/api/_lib/auth";
import { bcGet } from "@/lib/bcClient";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    // Fetch BC items and price list in parallel
    const [bcItems, priceResult] = await Promise.all([
      bcGet("/items", {
        $filter:
          "blocked eq false and generalProductPostingGroupCode eq 'FG' and startswith(number,'FG-00003')",
        $orderby: "number",
      }),
      auth.supabase.from("omPriceList").select("*"),
    ]);

    // Build price lookup map
    const priceMap = {};
    for (const p of priceResult.data || []) {
      priceMap[p.priceItemNumber] = p.priceUnitPrice;
    }

    // Merge BC items with custom prices
    const merged = bcItems.map((item) => ({
      ...item,
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
        { onConflict: "priceItemNumber" }
      );
    }

    return Response.json({ status: "saved" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
