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

function parseDimensionsFromDesc(displayName) {
  const match = displayName?.match(
    /(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)/,
  );
  if (!match) return null;

  let v1 = parseFloat(match[1]);
  let v2 = parseFloat(match[2]);
  let v3 = parseFloat(match[3]);


  if (v3 < 1000) v3 = Math.round(v3 * 10);

  return {
    thickness: Math.round(v1),
    width: Math.round(v2),
    length: Math.round(v3),
  };
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
        "bcItemNo, bcItemDescription, bcItemInventory, bcItemUnitCost, bcItemGenProdPostingGroup",
      )
      .eq("bcItemGenProdPostingGroup", "RM")
      .or("bcItemBlocked.eq.false,bcItemBlocked.is.null")
      .order("bcItemNo")
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
    const coreType = getCoreType(item.bcItemNo);
    if (!coreType) continue;

    const dims = parseDimensionsFromDesc(item.bcItemDescription);
    grouped[coreType].push({
      code: item.bcItemNo,
      desc: item.bcItemDescription || item.bcItemNo,
      inventory: item.bcItemInventory ?? 0,
      unitCost: item.bcItemUnitCost ?? 0,
      ...(dims && { thickness: dims.thickness, width: dims.width, length: dims.length }),
    });
  }

  return Response.json(grouped);
}
