import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { data, error } = await fetchAll(auth.supabase
      .from("omPromotion")
      .select("*")
      .order("omPromotionCreatedAt", { ascending: false }));

    if (error) throw error;
    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to load promotions" }, { status: 500 });
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

  const VALID_TYPES = ["discount_percent", "discount_amount", "buy_x_get_y", "free_shipping", "bundle", "freebie"];

  const name = typeof body.omPromotionName === "string" ? body.omPromotionName.slice(0, 500) : null;
  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });

  const type = VALID_TYPES.includes(body.omPromotionType) ? body.omPromotionType : "discount_percent";

  const insert = {
    omPromotionName: name,
    omPromotionDescription: typeof body.omPromotionDescription === "string" ? body.omPromotionDescription.slice(0, 2000) : null,
    omPromotionType: type,
    omPromotionValue: Number(body.omPromotionValue) || 0,
    omPromotionMinQuantity: Number(body.omPromotionMinQuantity) || 1,
    omPromotionApplicableProducts: Array.isArray(body.omPromotionApplicableProducts) ? body.omPromotionApplicableProducts : [],
    omPromotionStartDate: body.omPromotionStartDate || null,
    omPromotionEndDate: body.omPromotionEndDate || null,
    omPromotionIsActive: body.omPromotionIsActive !== false,
  };

  try {
    const { data, error } = await auth.supabase
      .from("omPromotion")
      .insert(insert)
      .select()
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create promotion" }, { status: 500 });
  }
}
