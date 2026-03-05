import { withAuth } from "@/app/api/_lib/auth";
import { bcApiGet } from "@/lib/bcClient";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start"); // YYYY-MM-DD
  const end = searchParams.get("end");     // YYYY-MM-DD
  const summarize = searchParams.get("summarize"); // "monthly" or null

  try {
    const glParams = {};
    if (start && end) {
      glParams.$filter = `postingDate ge ${start} and postingDate le ${end}`;
    }

    if (summarize === "monthly") {
      // Fetch GL entries with minimal fields, aggregate server-side
      glParams.$select = "postingDate,accountNumber,debitAmount,creditAmount,documentNumber";

      const [entries, accounts] = await Promise.all([
        bcApiGet("generalLedgerEntries", glParams, {
          timeout: 120_000,
          maxPageSize: 5000,
        }),
        bcApiGet("accounts", { $select: "number,displayName" }, {
          timeout: 30_000,
        }),
      ]);

      // ── Detect & exclude closing journal entry batches ──
      // BC's "Close Income Statement" batch creates entries with a single
      // documentNumber that touches many income-statement accounts (4x, 5x).
      // Regular journals rarely span both revenue + expense with 15+ accounts.
      const docAcctSets = {};
      for (const e of entries) {
        const p = e.accountNumber?.substring(0, 1);
        if (p !== "4" && p !== "5") continue; // income-statement only
        const doc = e.documentNumber;
        if (!doc) continue;
        if (!docAcctSets[doc]) docAcctSets[doc] = new Set();
        docAcctSets[doc].add(e.accountNumber);
      }
      const closingDocs = new Set();
      for (const [doc, accts] of Object.entries(docAcctSets)) {
        const arr = [...accts];
        const hasRev = arr.some((a) => a.startsWith("4"));
        const hasExp = arr.some((a) => a.startsWith("5"));
        if (hasRev && hasExp && accts.size >= 15) closingDocs.add(doc);
      }
      if (closingDocs.size) {
        console.log(`[glEntries] excluded ${closingDocs.size} closing batch(es):`, [...closingDocs]);
      }

      // Build account name lookup
      const nameMap = {};
      if (Array.isArray(accounts)) {
        for (const a of accounts) nameMap[a.number] = a.displayName;
      }

      // Aggregate by account + month (skip closing entries)
      const summary = {};
      for (const e of entries) {
        if (closingDocs.has(e.documentNumber)) continue; // skip closing batch
        const acct = e.accountNumber;
        const month = e.postingDate?.substring(5, 7); // "01"–"12"
        if (!acct || !month) continue;

        if (!summary[acct]) {
          summary[acct] = { name: nameMap[acct] || acct, months: {} };
        }
        if (!summary[acct].months[month]) {
          summary[acct].months[month] = { debit: 0, credit: 0 };
        }
        summary[acct].months[month].debit += e.debitAmount || 0;
        summary[acct].months[month].credit += e.creditAmount || 0;
      }

      return Response.json(summary);
    }

    // Default: return individual entries with account names
    glParams.$select =
      "postingDate,accountNumber,debitAmount,creditAmount,documentNumber";

    const [entries, accounts] = await Promise.all([
      bcApiGet("generalLedgerEntries", glParams, {
        timeout: 120_000,
        maxPageSize: 5000,
      }),
      bcApiGet("accounts", { $select: "number,displayName" }, {
        timeout: 30_000,
      }),
    ]);

    const nameMap = {};
    if (Array.isArray(accounts)) {
      for (const a of accounts) nameMap[a.number] = a.displayName;
    }

    const enriched = (Array.isArray(entries) ? entries : []).map((e) => ({
      ...e,
      accountName: nameMap[e.accountNumber] || e.accountNumber,
    }));

    return Response.json(enriched);
  } catch (e) {
    console.error("[glEntries] error:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
