import { withAuth } from "@/app/api/_lib/auth";
import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const customerNumber = searchParams.get("customerNumber");
    const status = searchParams.get("status");
    const since = searchParams.get("since");
    const until = searchParams.get("until");

    const supabase = getServiceSupabase();
    let q = supabase
      .from("arFollowUp")
      .select("*")
      .order("contactDate", { ascending: false })
      .order("createdAt", { ascending: false });

    if (customerNumber) q = q.eq("customerNumber", customerNumber);
    if (status && status !== "all") q = q.eq("status", status);
    if (since) q = q.gte("contactDate", since);
    if (until) q = q.lte("contactDate", until);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    return Response.json(data || []);
  } catch (e) {
    console.error("Collections GET error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    if (!body.customerNumber || !body.reason) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const record = {
      customerNumber: body.customerNumber,
      customerName: body.customerName || "",
      invoiceNumber: body.invoiceNumber || null,
      contactDate: body.contactDate || new Date().toISOString().slice(0, 10),
      contactMethod: body.contactMethod || "phone",
      reason: body.reason,
      reasonDetail: body.reasonDetail || null,
      note: body.note || null,
      promiseDate: body.promiseDate || null,
      promiseAmount: body.promiseAmount ? Number(body.promiseAmount) : null,
      status: body.status || "pending",
      nextFollowUpDate: body.nextFollowUpDate || null,
      assignedTo: body.assignedTo || null,
      createdBy: auth.session.user.id,
      createdByName:
        auth.session.user.user_metadata?.full_name ||
        auth.session.user.email ||
        "",
    };

    const { data, error } = await supabase
      .from("arFollowUp")
      .insert(record)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return Response.json(data, { status: 201 });
  } catch (e) {
    console.error("Collections POST error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
