import { withAuth } from "@/app/api/_lib/auth";
import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const supabase = getServiceSupabase();
    let q = supabase
      .from("bankStatement")
      .select("*")
      .order("createdAt", { ascending: false });

    if (status && status !== "all") q = q.eq("status", status);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    return Response.json(data || []);
  } catch (e) {
    console.error("BankRecon GET error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    if (!body.fileName || !body.fileUrl) {
      return Response.json({ error: "Missing fileName or fileUrl" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const record = {
      bankCode: body.bankCode || "KBANK",
      fileName: body.fileName,
      fileUrl: body.fileUrl,
      status: "pending",
      createdBy: auth.session.user.id,
      createdByName:
        auth.session.user.user_metadata?.full_name ||
        auth.session.user.email ||
        "",
    };

    const { data, error } = await supabase
      .from("bankStatement")
      .insert(record)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return Response.json(data, { status: 201 });
  } catch (e) {
    console.error("BankRecon POST error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
