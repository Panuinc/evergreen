import { withAuth } from "@/app/api/_lib/auth";
import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";
import * as XLSX from "xlsx";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const supabase = getServiceSupabase();

    // Get statement
    const { data: stmt } = await supabase
      .from("bankStatement")
      .select("*")
      .eq("id", id)
      .single();

    if (!stmt) return Response.json({ error: "Not found" }, { status: 404 });

    // Get entries with matches
    const { data: entries } = await supabase
      .from("bankEntry")
      .select("*, bankMatch(*)")
      .eq("statementId", id)
      .order("lineNumber", { ascending: true });

    const wb = XLSX.utils.book_new();

    // Sheet 1: All entries
    const allRows = (entries || []).map((e) => ({
      "ลำดับ": e.lineNumber,
      "วันที่": e.txDate,
      "เวลา": e.txTime || "",
      "ช่องทาง": e.channel || "",
      "รายละเอียด": e.description || "",
      "ประเภท": e.txType || "",
      "ฝาก/ถอน": e.direction === "credit" ? "ฝาก" : "ถอน",
      "จำนวนเงิน": Number(e.amount),
      "ยอดคงเหลือ": Number(e.balance),
      "สถานะ Match": e.matchStatus,
      "Confidence": e.matchConfidence ? `${(e.matchConfidence * 100).toFixed(0)}%` : "",
      "วิธี Match": e.matchMethod || "",
      "Invoice": (e.bankMatch || []).map((m) => m.invoiceNumber).join(", "),
      "ลูกค้า": (e.bankMatch || []).map((m) => m.customerName).join(", "),
      "ยอด Match": (e.bankMatch || []).reduce((s, m) => s + Number(m.matchedAmount), 0) || "",
      "หมายเหตุ": e.matchNote || "",
    }));

    const ws1 = XLSX.utils.json_to_sheet(allRows);
    ws1["!cols"] = [
      { wch: 6 }, { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 35 },
      { wch: 18 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
      { wch: 10 }, { wch: 18 }, { wch: 20 }, { wch: 25 }, { wch: 14 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws1, "รายการทั้งหมด");

    // Sheet 2: Unmatched deposits
    const unmatched = (entries || []).filter(
      (e) => e.direction === "credit" && e.matchStatus === "unmatched",
    );
    const unmatchedRows = unmatched.map((e) => ({
      "ลำดับ": e.lineNumber,
      "วันที่": e.txDate,
      "รายละเอียด": e.description || "",
      "ประเภท": e.txType || "",
      "จำนวนเงิน": Number(e.amount),
    }));

    const ws2 = XLSX.utils.json_to_sheet(
      unmatchedRows.length > 0 ? unmatchedRows : [{ "ข้อมูล": "ไม่มีรายการที่ยังไม่ match" }],
    );
    XLSX.utils.book_append_sheet(wb, ws2, "ยังไม่ Match");

    // Sheet 3: Summary by customer
    const customerSummary = new Map();
    for (const e of entries || []) {
      if (e.direction !== "credit" || !e.bankMatch?.length) continue;
      for (const m of e.bankMatch) {
        const key = m.customerNumber || m.customerName || "ไม่ระบุ";
        if (!customerSummary.has(key)) {
          customerSummary.set(key, {
            customerNumber: m.customerNumber || "",
            customerName: m.customerName || "",
            totalMatched: 0,
            invoiceCount: 0,
          });
        }
        const s = customerSummary.get(key);
        s.totalMatched += Number(m.matchedAmount);
        s.invoiceCount++;
      }
    }

    const summaryRows = [...customerSummary.values()].map((s) => ({
      "เลขลูกค้า": s.customerNumber,
      "ชื่อลูกค้า": s.customerName,
      "จำนวน Invoice": s.invoiceCount,
      "ยอดรวม Match": s.totalMatched,
    }));

    const ws3 = XLSX.utils.json_to_sheet(
      summaryRows.length > 0 ? summaryRows : [{ "ข้อมูล": "ไม่มีข้อมูลสรุป" }],
    );
    XLSX.utils.book_append_sheet(wb, ws3, "สรุปตามลูกค้า");

    // Write to buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const fileName = `bank-recon-${stmt.bankCode}-${stmt.periodStart || "export"}.xlsx`;

    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    console.error("BankRecon export error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
