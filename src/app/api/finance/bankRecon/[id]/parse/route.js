import { withAuth } from "@/app/api/_lib/auth";
import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";
import { aiParseBankStatement } from "@/lib/bankStatement/aiParser";

export async function POST(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const supabase = getServiceSupabase();


    const { data: stmt, error: stmtErr } = await supabase
      .from("bankStatement")
      .select("*")
      .eq("id", id)
      .single();

    if (stmtErr) throw new Error(stmtErr.message);
    if (!stmt) return Response.json({ error: "Not found" }, { status: 404 });


    const pdfRes = await fetch(stmt.fileUrl);
    if (!pdfRes.ok) throw new Error(`Failed to download PDF: ${pdfRes.status}`);
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());


    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;


    const { metadata, entries } = await aiParseBankStatement(text, stmt.bankCode);


    await supabase.from("bankEntry").delete().eq("statementId", id);


    if (entries.length > 0) {
      const batchSize = 100;
      for (let start = 0; start < entries.length; start += batchSize) {
        const batch = entries.slice(start, start + batchSize).map((e) => ({
          statementId: id,
          lineNumber: e.lineNumber,
          txDate: e.txDate,
          txTime: e.txTime,
          channel: e.channel,
          description: e.description,
          txType: e.txType,
          amount: e.amount,
          balance: e.balance,
          direction: e.direction,
          matchStatus: "unmatched",
        }));

        const { error: insertErr } = await supabase.from("bankEntry").insert(batch);
        if (insertErr) throw new Error(insertErr.message);
      }
    }


    const { error: updErr } = await supabase
      .from("bankStatement")
      .update({
        accountNumber: metadata.accountNumber,
        periodStart: metadata.periodStart,
        periodEnd: metadata.periodEnd,
        openingBalance: metadata.openingBalance,
        closingBalance: metadata.closingBalance,
        entryCount: entries.length,
        matchedCount: 0,
        status: "parsed",
        parseError: null,
      })
      .eq("id", id);

    if (updErr) throw new Error(updErr.message);

    return Response.json({
      ok: true,
      entryCount: entries.length,
      metadata,
    });
  } catch (e) {
    console.error("BankRecon parse error:", e);


    try {
      const supabase = getServiceSupabase();
      const { id } = await params;
      await supabase
        .from("bankStatement")
        .update({ status: "error", parseError: e.message })
        .eq("id", id);
    } catch {}

    return Response.json({ error: e.message }, { status: 500 });
  }
}
