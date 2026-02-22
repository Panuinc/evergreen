import { getProjectDetail } from "@/lib/bciClient";
import { withAuth } from "@/app/api/_lib/auth";

export const GET = withAuth(async (_request, { params }) => {
  const { id } = await params;

  try {
    const detail = await getProjectDetail(id);
    return Response.json(detail);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});
