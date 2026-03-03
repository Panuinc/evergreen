import { withAuth } from "@/app/api/_lib/auth";
import { getComparisonRanges, filterByDateRange } from "@/lib/comparison";

function buildDashboard(leads, opportunities, orders, activities, stages) {
  // KPIs
  const totalLeads = leads?.length || 0;
  const newLeads = leads?.filter((l) => l.crmLeadStatus === "new").length || 0;
  const openOpportunities =
    opportunities?.filter(
      (o) =>
        !["closed_won", "closed_lost"].includes(o.crmOpportunityStage)
    ).length || 0;
  const wonDeals =
    opportunities?.filter((o) => o.crmOpportunityStage === "closed_won").length ||
    0;
  const lostDeals =
    opportunities?.filter((o) => o.crmOpportunityStage === "closed_lost").length ||
    0;
  const totalRevenue =
    opportunities
      ?.filter((o) => o.crmOpportunityStage === "closed_won")
      .reduce((sum, o) => sum + (parseFloat(o.crmOpportunityAmount) || 0), 0) || 0;
  const pipelineValue =
    opportunities
      ?.filter(
        (o) =>
          !["closed_won", "closed_lost"].includes(o.crmOpportunityStage)
      )
      .reduce((sum, o) => sum + (parseFloat(o.crmOpportunityAmount) || 0), 0) || 0;
  const weightedPipeline =
    opportunities
      ?.filter(
        (o) =>
          !["closed_won", "closed_lost"].includes(o.crmOpportunityStage)
      )
      .reduce(
        (sum, o) =>
          sum +
          (parseFloat(o.crmOpportunityAmount) || 0) *
            ((o.crmOpportunityProbability || 0) / 100),
        0
      ) || 0;

  // Pipeline by stage
  const pipelineByStage = (stages || []).map((stage) => {
    const stageOpps = opportunities?.filter(
      (o) => o.crmOpportunityStage === stage.crmPipelineStageName.toLowerCase().replace(/ /g, "_")
    ) || [];
    return {
      stage: stage.crmPipelineStageName,
      count: stageOpps.length,
      value: stageOpps.reduce(
        (sum, o) => sum + (parseFloat(o.crmOpportunityAmount) || 0),
        0
      ),
      color: stage.crmPipelineStageColor,
    };
  });

  // Revenue by month (last 6 months)
  const now = new Date();
  const revenueByMonth = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthName = d.toLocaleString("th-TH", { month: "short", year: "2-digit" });
    const monthOrders = orders?.filter((o) => {
      const od = new Date(o.crmOrderCreatedAt);
      return (
        od.getFullYear() === d.getFullYear() &&
        od.getMonth() === d.getMonth()
      );
    }) || [];
    revenueByMonth.push({
      month: monthName,
      key: monthKey,
      revenue: monthOrders.reduce(
        (sum, o) => sum + (parseFloat(o.crmOrderTotal) || 0),
        0
      ),
      count: monthOrders.length,
    });
  }

  // Top salespeople
  const salesByPerson = {};
  opportunities
    ?.filter((o) => o.crmOpportunityStage === "closed_won" && o.crmOpportunityAssignedTo)
    .forEach((o) => {
      const name = o.crmOpportunityAssignedTo;
      if (!salesByPerson[name]) salesByPerson[name] = { name, deals: 0, revenue: 0 };
      salesByPerson[name].deals++;
      salesByPerson[name].revenue += parseFloat(o.crmOpportunityAmount) || 0;
    });
  const topSalespeople = Object.values(salesByPerson)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    kpis: {
      totalLeads,
      newLeads,
      openOpportunities,
      wonDeals,
      lostDeals,
      totalRevenue,
      pipelineValue,
      weightedPipeline,
      winRate: wonDeals + lostDeals > 0
        ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100)
        : 0,
    },
    pipelineByStage,
    revenueByMonth,
    topSalespeople,
  };
}

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const url = new URL(request.url);
  const compareMode = url.searchParams.get("compareMode"); // "ytm" | "yty" | null

  // Fetch all data in parallel
  const [
    { data: leads },
    { data: opportunities },
    { data: orders },
    { data: activities },
    { data: stages },
  ] = await Promise.all([
    supabase.from("salesLead").select("crmLeadId, crmLeadStatus, crmLeadScore, crmLeadCreatedAt").eq("isActive", true),
    supabase
      .from("salesOpportunity")
      .select(
        "crmOpportunityId, crmOpportunityStage, crmOpportunityAmount, crmOpportunityProbability, crmOpportunityAssignedTo, crmOpportunityCreatedAt, crmOpportunityActualCloseDate"
      )
      .eq("isActive", true),
    supabase
      .from("salesOrder")
      .select("crmOrderId, crmOrderStatus, crmOrderTotal, crmOrderCreatedAt")
      .eq("isActive", true),
    supabase
      .from("salesActivity")
      .select("crmActivityId, crmActivityType, crmActivityStatus, crmActivitySubject, crmActivityDueDate, crmActivityCreatedAt")
      .eq("isActive", true)
      .order("crmActivityCreatedAt", { ascending: false })
      .limit(10),
    supabase
      .from("salesPipelineStage")
      .select("*")
      .order("crmPipelineStageOrder", { ascending: true }),
  ]);

  // ── No comparison mode: return as before ──
  if (!compareMode) {
    const result = buildDashboard(leads, opportunities, orders, activities, stages);
    return Response.json({
      ...result,
      recentActivities: activities || [],
    });
  }

  // ── Comparison mode: filter by date range ──
  const ranges = getComparisonRanges(compareMode);

  const curLeads = filterByDateRange(leads || [], "crmLeadCreatedAt", ranges.current.start, ranges.current.end);
  const curOpportunities = filterByDateRange(opportunities || [], "crmOpportunityCreatedAt", ranges.current.start, ranges.current.end);
  const curOrders = filterByDateRange(orders || [], "crmOrderCreatedAt", ranges.current.start, ranges.current.end);

  const prevLeads = filterByDateRange(leads || [], "crmLeadCreatedAt", ranges.previous.start, ranges.previous.end);
  const prevOpportunities = filterByDateRange(opportunities || [], "crmOpportunityCreatedAt", ranges.previous.start, ranges.previous.end);
  const prevOrders = filterByDateRange(orders || [], "crmOrderCreatedAt", ranges.previous.start, ranges.previous.end);

  const current = buildDashboard(curLeads, curOpportunities, curOrders, activities, stages);
  const previous = buildDashboard(prevLeads, prevOpportunities, prevOrders, activities, stages);

  return Response.json({
    compareMode,
    labels: { current: ranges.current.label, previous: ranges.previous.label },
    current: {
      ...current,
      recentActivities: activities || [],
    },
    previous: {
      ...previous,
      recentActivities: [],
    },
  });
}
