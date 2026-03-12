import { withAuth } from "@/app/api/_lib/auth";

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const VALID_TYPES = ["discount_percent", "discount_amount", "buy_x_get_y", "free_shipping", "bundle", "freebie"];
  const update = { omPromotionUpdatedAt: new Date().toISOString() };

  if (body.omPromotionName !== undefined) {
    update.omPromotionName = String(body.omPromotionName).slice(0, 500);
  }
  if (body.omPromotionDescription !== undefined) {
    update.omPromotionDescription = body.omPromotionDescription ? String(body.omPromotionDescription).slice(0, 2000) : null;
  }
  if (body.omPromotionType !== undefined && VALID_TYPES.includes(body.omPromotionType)) {
    update.omPromotionType = body.omPromotionType;
  }
  if (body.omPromotionValue !== undefined) {
    update.omPromotionValue = Number(body.omPromotionValue) || 0;
  }
  if (body.omPromotionMinQuantity !== undefined) {
    update.omPromotionMinQuantity = Number(body.omPromotionMinQuantity) || 1;
  }
  if (body.omPromotionApplicableProducts !== undefined) {
    update.omPromotionApplicableProducts = Array.isArray(body.omPromotionApplicableProducts) ? body.omPromotionApplicableProducts : [];
  }
  if (body.omPromotionStartDate !== undefined) {
    update.omPromotionStartDate = body.omPromotionStartDate || null;
  }
  if (body.omPromotionEndDate !== undefined) {
    update.omPromotionEndDate = body.omPromotionEndDate || null;
  }
  if (body.omPromotionIsActive !== undefined) {
    update.omPromotionIsActive = !!body.omPromotionIsActive;
  }

  try {
    const { data, error } = await auth.supabase
      .from("omPromotion")
      .update(update)
      .eq("omPromotionId", id)
      .select()
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to update promotion" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const { error } = await auth.supabase
      .from("omPromotion")
      .delete()
      .eq("omPromotionId", id);

    if (error) throw error;
    return Response.json({ status: "deleted" });
  } catch {
    return Response.json({ error: "Failed to delete promotion" }, { status: 500 });
  }
}
