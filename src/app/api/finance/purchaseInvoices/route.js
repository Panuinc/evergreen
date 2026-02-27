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
        "id,number,vendorInvoiceNumber,invoiceDate,dueDate,vendorId,vendorNumber,vendorName," +
        "currencyCode,purchaser,totalAmountExcludingTax,totalTaxAmount,totalAmountIncludingTax,status",
      $orderby: "invoiceDate desc",
    };

    if (expand) {
      params.$expand = "purchaseInvoiceLines";
    }

    if (status !== "all") {
      params.$filter = `status eq '${status}'`;
    }

    const data = await bcApiGet("purchaseInvoices", params, { timeout: 120_000 });
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
