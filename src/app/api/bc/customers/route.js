import { withAuth } from "@/app/api/_lib/auth";

const PAGE_SIZE = 1000;

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  let allData = [];
  let from = 0;

  while (true) {
    const { data, error } = await auth.supabase
      .from("bcCustomers")
      .select(
        "id,number,displayName,phoneNumber,contact,balanceDue,balance,salespersonCode",
      )
      .order("number")
      .range(from, from + PAGE_SIZE - 1);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;

    allData = allData.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return Response.json(allData);
}
