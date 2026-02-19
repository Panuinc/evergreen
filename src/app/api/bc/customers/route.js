import { withAuth } from "@/app/api/_lib/auth";
import { bcODataGet } from "@/lib/bcClient";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const rows = await bcODataGet("CustomerList", {
      $select: "No,Name,Phone_No,Contact,Balance_Due_LCY,Balance_LCY,Salesperson_Code",
      $orderby: "No asc",
    });

    const data = rows.map((c) => ({
      id: c.No,
      number: c.No,
      displayName: c.Name,
      phoneNumber: c.Phone_No,
      contact: c.Contact,
      balanceDue: c.Balance_Due_LCY,
      balance: c.Balance_LCY,
      salespersonCode: c.Salesperson_Code,
    }));

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
