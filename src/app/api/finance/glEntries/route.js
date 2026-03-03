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
      glParams.$select = "postingDate,accountNumber,debitAmount,creditAmount";

      const [entries, accounts] = await Promise.all([
        bcApiGet("generalLedgerEntries", glParams, {
          timeout: 120_000,
          maxPageSize: 5000,
        }),
        bcApiGet("accounts", { $select: "number,displayName" }, {
          timeout: 30_000,
        }),
      ]);

      // Build account name lookup
      const nameMap = {};
      if (Array.isArray(accounts)) {
        for (const a of accounts) nameMap[a.number] = a.displayName;
      }

      // Aggregate by account + month
      const summary = {};
      for (const e of entries) {
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
