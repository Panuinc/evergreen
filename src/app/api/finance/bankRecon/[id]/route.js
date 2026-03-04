import { withAuth } from "@/app/api/_lib/auth";
import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const supabase = getServiceSupabase();

    // Get statement
    const { data: stmt, error: stmtErr } = await supabase
      .from("bankStatement")
      .select("*")
      .eq("id", id)
      .single();

    if (stmtErr) throw new Error(stmtErr.message);
    if (!stmt) return Response.json({ error: "Not found" }, { status: 404 });

    // Get entries with matches
    const { data: entries, error: entErr } = await supabase
      .from("bankEntry")
      .select("*, bankMatch(*)")
      .eq("statementId", id)
      .order("lineNumber", { ascending: true });

    if (entErr) throw new Error(entErr.message);

    return Response.json({ ...stmt, entries: entries || [] });
  } catch (e) {
    console.error("BankRecon [id] GET error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from("bankStatement")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);

    return Response.json({ ok: true });
  } catch (e) {
    console.error("BankRecon [id] DELETE error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
