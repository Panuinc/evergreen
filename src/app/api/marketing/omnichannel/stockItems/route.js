import { withAuth } from "@/app/api/_lib/auth";
import { bcODataGet } from "@/lib/bcClient";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    // Fetch BC items and price list in parallel
    const [bcItems, priceResult] = await Promise.all([
      bcODataGet("Item_Card_Excel", {
        $filter: "Blocked eq false and startswith(No,'FG-00003')",
        $select:
          "No,Description,Unit_Price,Unit_Cost,Inventory,Base_Unit_of_Measure",
        $orderby: "No",
      }),
      auth.supabase.from("omPriceList").select("*"),
    ]);

    // Build price lookup map
    const priceMap = {};
    for (const p of priceResult.data || []) {
      priceMap[p.priceItemNumber] = p.priceUnitPrice;
    }

    // Merge BC items with custom prices (map OData fields to expected names)
    const merged = bcItems.map((item) => ({
      number: item.No,
      displayName: item.Description,
      unitPrice: item.Unit_Price,
      unitCost: item.Unit_Cost,
      inventory: item.Inventory,
      baseUnitOfMeasure: item.Base_Unit_of_Measure,
      customPrice: priceMap[item.No] ?? null,
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
