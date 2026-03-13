import { withAuth } from "@/app/api/_lib/auth";
import { getComparisonRanges, filterByDateRange } from "@/lib/comparison";

function buildDashboard(assets) {

  const totalAssets = assets.length;

  const categoryCounts = {};
  assets.forEach((a) => {
    const cat = a.itAssetCategory || "other";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const assetByCategory = Object.entries(categoryCounts).map(
    ([category, count]) => ({ category, count })
  );

  return {
    totalAssets,
    assetByCategory,
  };
}

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const url = new URL(request.url);
  const compareMode = url.searchParams.get("compareMode");

  const assetsRes = await supabase.from("itAsset").select("itAssetId, itAssetCategory, itAssetStatus").eq("isActive", true);

  if (assetsRes.error) {
    return Response.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }

  const assets = assetsRes.data || [];

  if (!compareMode) {
    return Response.json(buildDashboard(assets));
  }

  const ranges = getComparisonRanges(compareMode);

  const current = buildDashboard(assets);
  const previous = buildDashboard(assets);

  return Response.json({
    compareMode,
    labels: { current: ranges.current.label, previous: ranges.previous.label },
    current,
    previous,
  });
}
