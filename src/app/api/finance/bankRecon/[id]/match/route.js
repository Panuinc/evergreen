import { withAuth } from "@/app/api/_lib/auth";
import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";
import { bcApiGet } from "@/lib/bcClient";
import { autoMatch } from "@/lib/bankStatement/matching";


export async function POST(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const supabase = getServiceSupabase();


    const { data: entries, error: entErr } = await supabase
      .from("bankEntry")
      .select("*")
      .eq("statementId", id)
      .eq("direction", "credit")
      .eq("matchStatus", "unmatched");

    if (entErr) throw new Error(entErr.message);
    if (!entries || entries.length === 0) {
      return Response.json({ ok: true, matchCount: 0, message: "No unmatched credit entries" });
    }


    const rawInvoices = await bcApiGet("salesInvoices", {
      $filter: "status eq 'Open'",
      $select:
        "id,number,invoiceDate,dueDate,customerNumber,customerName,totalAmountIncludingTax,remainingAmount,externalDocumentNumber",
    });
    const invoices = (rawInvoices || []).filter(
      (inv) => Number(inv.remainingAmount || 0) > 0,
    );


    const { data: customers } = await supabase
      .from("bcCustomer")
      .select("bcCustomerNo,bcCustomerNameValue,bcCustomerContact");


    let arByCustomer = new Map();
    try {
      const arData = await bcApiGet("agedAccountsReceivables", {}, { timeout: 15_000 });
      for (const ar of arData || []) {
        if (ar.customerNumber && Number(ar.balanceDue || 0) > 0) {
          arByCustomer.set(ar.customerNumber, ar);
        }
      }
    } catch (arErr) {
      console.warn("[Match] Could not fetch aged receivables:", arErr.message);
    }


    const matchResults = autoMatch(entries, invoices, customers || [], arByCustomer);


    let matchCount = 0;
    for (const result of matchResults) {
      const status =
        result.method === "EXACT_AMOUNT_MULTI" || result.method === "CUSTOMER_FIFO"
          ? "suggested"
          : "matched";


      const matchRows = result.matches.map((m) => ({
        entryId: result.entryId,
        invoiceNumber: m.invoiceNumber,
        customerNumber: m.customerNumber,
        customerName: m.customerName,
        invoiceAmount: m.invoiceAmount,
        remainingAmount: m.remainingAmount,
        matchedAmount: m.matchedAmount,
      }));

      const { error: matchErr } = await supabase.from("bankMatch").insert(matchRows);
      if (matchErr) {
        console.error("Match insert error:", matchErr);
        continue;
      }


      await supabase
        .from("bankEntry")
        .update({
          matchStatus: status,
          matchConfidence: result.confidence,
          matchMethod: result.method,
          matchedBy: auth.session.user.id,
          matchedAt: new Date().toISOString(),
        })
        .eq("id", result.entryId);

      if (status === "matched") matchCount++;
    }


    const { data: counts } = await supabase
      .from("bankEntry")
      .select("matchStatus")
      .eq("statementId", id);

    const matched = (counts || []).filter((e) => e.matchStatus === "matched").length;
    await supabase
      .from("bankStatement")
      .update({ matchedCount: matched, status: "matched" })
      .eq("id", id);

    return Response.json({
      ok: true,
      matchCount,
      suggestedCount: matchResults.filter((r) => r.method === "EXACT_AMOUNT_MULTI").length,
      totalResults: matchResults.length,
    });
  } catch (e) {
    console.error("BankRecon match error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}


export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, entryId } = body;
    const supabase = getServiceSupabase();

    if (!entryId || !action) {
      return Response.json({ error: "Missing entryId or action" }, { status: 400 });
    }

    switch (action) {
      case "match": {

        if (!body.invoiceNumber || !body.matchedAmount) {
          return Response.json({ error: "Missing invoiceNumber or matchedAmount" }, { status: 400 });
        }

        await supabase.from("bankMatch").insert({
          entryId,
          invoiceNumber: body.invoiceNumber,
          customerNumber: body.customerNumber || "",
          customerName: body.customerName || "",
          invoiceAmount: body.invoiceAmount || 0,
          remainingAmount: body.remainingAmount || 0,
          matchedAmount: body.matchedAmount,
        });

        await supabase
          .from("bankEntry")
          .update({
            matchStatus: "matched",
            matchConfidence: 1.0,
            matchMethod: "MANUAL",
            matchNote: body.note || null,
            matchedBy: auth.session.user.id,
            matchedAt: new Date().toISOString(),
          })
          .eq("id", entryId);
        break;
      }

      case "unmatch": {
        await supabase.from("bankMatch").delete().eq("entryId", entryId);
        await supabase
          .from("bankEntry")
          .update({
            matchStatus: "unmatched",
            matchConfidence: null,
            matchMethod: null,
            matchNote: null,
            matchedBy: null,
            matchedAt: null,
          })
          .eq("id", entryId);
        break;
      }

      case "exclude": {
        await supabase.from("bankMatch").delete().eq("entryId", entryId);
        await supabase
          .from("bankEntry")
          .update({
            matchStatus: "excluded",
            matchNote: body.note || "Excluded",
            matchedBy: auth.session.user.id,
            matchedAt: new Date().toISOString(),
          })
          .eq("id", entryId);
        break;
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }


    const { data: counts } = await supabase
      .from("bankEntry")
      .select("matchStatus")
      .eq("statementId", id);

    const matched = (counts || []).filter((e) => e.matchStatus === "matched").length;
    await supabase
      .from("bankStatement")
      .update({ matchedCount: matched })
      .eq("id", id);

    return Response.json({ ok: true });
  } catch (e) {
    console.error("BankRecon match PUT error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
