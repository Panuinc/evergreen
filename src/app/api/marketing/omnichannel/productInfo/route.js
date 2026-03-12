import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { data, error } = await auth.supabase
      .from("omProductInfo")
      .select("*")
      .order("omProductInfoItemNumber");

    if (error) throw error;
    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to load product info" }, { status: 500 });
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

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: "items array is required" }, { status: 400 });
  }

  if (body.items.length > 500) {
    return Response.json({ error: "Too many items (max 500)" }, { status: 400 });
  }

  try {
    for (const item of body.items) {
      if (!item.itemNumber || typeof item.itemNumber !== "string") continue;

      await auth.supabase.from("omProductInfo").upsert(
        {
          omProductInfoItemNumber: item.itemNumber.slice(0, 100),
          omProductInfoDescription: item.description ? String(item.description).slice(0, 2000) : null,
          omProductInfoHighlights: item.highlights ? String(item.highlights).slice(0, 1000) : null,
          omProductInfoCategory: item.category ? String(item.category).slice(0, 200) : null,
          omProductInfoImageUrl: item.imageUrl ? String(item.imageUrl).slice(0, 2000) : null,
          omProductInfoUpdatedAt: new Date().toISOString(),
        },
        { onConflict: "omProductInfoItemNumber" }
      );
    }

    return Response.json({ status: "saved" });
  } catch {
    return Response.json({ error: "Failed to save product info" }, { status: 500 });
  }
}
