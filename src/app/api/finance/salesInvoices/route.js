import { withAuth } from "@/app/api/_lib/auth";
import { bcApiGet } from "@/lib/bcClient";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "Open";

    const expand = searchParams.get("expand") !== "false";

    const params = {
      $select:
        "id,number,externalDocumentNumber,invoiceDate,dueDate,customerId,customerNumber,customerName," +
        "currencyCode,salesperson,remainingAmount,totalAmountExcludingTax,totalTaxAmount,totalAmountIncludingTax,status",
      $orderby: "invoiceDate desc",
    };

    if (expand) {
      params.$expand = "salesInvoiceLines";
    }

    if (status !== "all") {
      params.$filter = `status eq '${status}'`;
    }

    const data = await bcApiGet("salesInvoices", params, { timeout: 120_000 });
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
