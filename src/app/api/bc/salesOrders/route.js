import { withAuth } from "@/app/api/_lib/auth";
import { bcGet } from "@/lib/bcClient";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const data = await bcGet("/salesOrders", {
      $expand: "salesOrderLines",
    });
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
