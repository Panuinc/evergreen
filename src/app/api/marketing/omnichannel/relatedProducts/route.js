import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { data, error } = await fetchAll(auth.supabase
      .from("omRelatedProduct")
      .select("*")
      .order("omRelatedProductCreatedAt", { ascending: false }));

    if (error) throw error;
    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to load related products" }, { status: 500 });
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

  const source = typeof body.sourceItem === "string" ? body.sourceItem.slice(0, 100) : null;
  const target = typeof body.targetItem === "string" ? body.targetItem.slice(0, 100) : null;
  if (!source || !target) return Response.json({ error: "sourceItem and targetItem are required" }, { status: 400 });

  const type = ["cross_sell", "upsell"].includes(body.type) ? body.type : "cross_sell";

  try {
    const { data, error } = await auth.supabase
      .from("omRelatedProduct")
      .upsert(
        {
          omRelatedProductSourceItem: source,
          omRelatedProductTargetItem: target,
          omRelatedProductType: type,
          omRelatedProductReason: body.reason ? String(body.reason).slice(0, 500) : null,
        },
        { onConflict: "omRelatedProductSourceItem,omRelatedProductTargetItem" }
      )
      .select()
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to save related product" }, { status: 500 });
  }
}
