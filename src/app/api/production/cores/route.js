import { withAuth } from "@/app/api/_lib/auth";

const CORE_PREFIX_MAP = {
  "RM-16-07": "foam",
  "RM-16-08": "rockwool",
  "RM-16-11": "particle",
  "RM-16-12": "plywood",
  "RM-16-21": "honeycomb",
};

const KNOWN_PREFIXES = Object.keys(CORE_PREFIX_MAP);

function getCoreType(itemNumber) {
  for (const prefix of KNOWN_PREFIXES) {
    if (itemNumber?.startsWith(prefix)) return CORE_PREFIX_MAP[prefix];
  }
  return null;
}

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const PAGE_SIZE = 1000;
  let allData = [];
  let from = 0;

  while (true) {
    const { data, error } = await auth.supabase
      .from("bcItem")
      .select(
        "bcItemNumber, bcItemDisplayName, bcItemInventory, bcItemUnitCost, bcItemGeneralProductPostingGroupCode",
      )
      .eq("bcItemGeneralProductPostingGroupCode", "RM")
      .or("bcItemBlocked.eq.false,bcItemBlocked.is.null")
      .order("bcItemNumber")
      .range(from, from + PAGE_SIZE - 1);

    if (error)
      return Response.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;

    allData = allData.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const grouped = {
    foam: [],
    rockwool: [],
    particle: [],
    plywood: [],
    honeycomb: [],
  };

  for (const item of allData) {
    const coreType = getCoreType(item.bcItemNumber);
    if (!coreType) continue;

    grouped[coreType].push({
      code: item.bcItemNumber,
      desc: item.bcItemDisplayName || item.bcItemNumber,
      inventory: item.bcItemInventory ?? 0,
      unitCost: item.bcItemUnitCost ?? 0,
    });
  }

  return Response.json(grouped);
}
