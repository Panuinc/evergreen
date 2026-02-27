import { withAuth } from "@/app/api/_lib/auth";

const FRAME_PREFIX_MAP = {
  "RM-14-01": "rubberwood",
  "RM-14-04": "sadao",
  "RM-16-19": "lvl",
};

const KNOWN_PREFIXES = Object.keys(FRAME_PREFIX_MAP);

function parseDimensionsFromDesc(displayName) {
  // Match "26x30x2040", "29x35x2580", "2.9x3.5x258" etc. in description
  const match = displayName?.match(
    /(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*x\s*(\d+\.?\d*)/,
  );
  if (!match) return null;

  let thickness = parseFloat(match[1]);
  let width = parseFloat(match[2]);
  let length = parseFloat(match[3]);

  // If length < 1000, it's likely in cm → convert to mm
  if (length < 1000) length = Math.round(length * 10);

  return {
    thickness: Math.round(thickness),
    width: Math.round(width),
    length: Math.round(length),
  };
}

function getFrameType(itemNumber) {
  for (const prefix of KNOWN_PREFIXES) {
    if (itemNumber?.startsWith(prefix)) return FRAME_PREFIX_MAP[prefix];
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

  const grouped = { rubberwood: [], sadao: [], lvl: [] };

  for (const item of allData) {
    const frameType = getFrameType(item.bcItemNumber);
    if (!frameType) continue;

    const dims = parseDimensionsFromDesc(item.bcItemDisplayName);
    if (!dims) continue;

    grouped[frameType].push({
      code: item.bcItemNumber,
      desc: item.bcItemDisplayName || item.bcItemNumber,
      thickness: dims.thickness,
      width: dims.width,
      length: dims.length,
      inventory: item.bcItemInventory ?? 0,
      unitCost: item.bcItemUnitCost ?? 0,
    });
  }

  return Response.json(grouped);
}
