import { withAuth } from "@/app/api/_lib/auth";
import { bcGet } from "@/lib/bcClient";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const data = await bcGet("/salesOrders", {
      $expand: "salesOrderLines",
      $filter: "number ge 'SO25'",
      $top: "10",
      $orderby: "number desc",
    });
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
