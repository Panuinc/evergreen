import { withAuth } from "@/app/api/_lib/auth";
import { getComparisonRanges, filterByDateRange } from "@/lib/comparison";

function buildDashboard(assets, tickets, software, devices, incidents, access) {

  const totalAssets = assets.length;
  const openTickets = tickets.filter(
    (t) => t.itTicketStatus === "open" || t.itTicketStatus === "in_progress"
  ).length;
  const activeLicenses = software.filter(
    (s) => s.itSoftwareStatus === "active"
  ).length;
  const totalNetworkDevices = devices.length;
  const onlineDevices = devices.filter(
    (d) => d.itNetworkDeviceStatus === "online"
  ).length;
  const openIncidents = incidents.filter(
    (i) => i.itSecurityIncidentStatus === "open" || i.itSecurityIncidentStatus === "investigating"
  ).length;
  const pendingAccess = access.filter(
    (a) => a.itSystemAccessStatus === "pending"
  ).length;


  const now = new Date();
  const ticketTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = tickets.filter(
      (t) => t.itTicketCreatedAt && t.itTicketCreatedAt.startsWith(monthKey)
    ).length;
    ticketTrend.push({ month: monthKey, count });
  }


  const categoryCounts = {};
  assets.forEach((a) => {
    const cat = a.itAssetCategory || "other";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const assetByCategory = Object.entries(categoryCounts).map(
    ([category, count]) => ({ category, count })
  );


  const today = now.toISOString().split("T")[0];
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const licenseExpiry = [
    {
      bucket: "Expired",
      count: software.filter(
        (s) => s.itSoftwareExpiryDate && s.itSoftwareExpiryDate < today
      ).length,
    },
    {
      bucket: "< 30 Days",
      count: software.filter(
        (s) =>
          s.itSoftwareExpiryDate &&
          s.itSoftwareExpiryDate >= today &&
          s.itSoftwareExpiryDate < thirtyDaysLater
      ).length,
    },
    {
      bucket: "< 90 Days",
      count: software.filter(
        (s) =>
          s.itSoftwareExpiryDate &&
          s.itSoftwareExpiryDate >= thirtyDaysLater &&
          s.itSoftwareExpiryDate < ninetyDaysLater
      ).length,
    },
    {
      bucket: "OK",
      count: software.filter(
        (s) =>
          !s.itSoftwareExpiryDate || s.itSoftwareExpiryDate >= ninetyDaysLater
      ).length,
    },
  ];

  return {
    totalAssets,
    openTickets,
    activeLicenses,
    totalNetworkDevices,
    onlineDevices,
    openIncidents,
    pendingAccess,
    ticketTrend,
    assetByCategory,
    licenseExpiry,
  };
}

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const url = new URL(request.url);
  const compareMode = url.searchParams.get("compareMode");

  const [assetsRes, ticketsRes, softwareRes, devicesRes, incidentsRes, accessRes] = await Promise.all([
    supabase.from("itAsset").select("itAssetId, itAssetCategory, itAssetStatus").eq("isActive", true),
    supabase.from("itTicket").select("itTicketId, itTicketStatus, itTicketPriority, itTicketCategory, itTicketCreatedAt").eq("isActive", true),
    supabase.from("itSoftware").select("itSoftwareId, itSoftwareStatus, itSoftwareLicenseType, itSoftwareExpiryDate").eq("isActive", true),
    supabase.from("itNetworkDevice").select("itNetworkDeviceId, itNetworkDeviceStatus, itNetworkDeviceType").eq("isActive", true),
    supabase.from("itSecurityIncident").select("itSecurityIncidentId, itSecurityIncidentStatus, itSecurityIncidentSeverity, itSecurityIncidentCreatedAt").eq("isActive", true),
    supabase.from("itSystemAccess").select("itSystemAccessId, itSystemAccessStatus").eq("isActive", true),
  ]);

  if (assetsRes.error || ticketsRes.error || softwareRes.error || devicesRes.error || incidentsRes.error || accessRes.error) {
    return Response.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }

  const assets = assetsRes.data || [];
  const allTickets = ticketsRes.data || [];
  const software = softwareRes.data || [];
  const devices = devicesRes.data || [];
  const allIncidents = incidentsRes.data || [];
  const access = accessRes.data || [];


  if (!compareMode) {
    return Response.json(buildDashboard(assets, allTickets, software, devices, allIncidents, access));
  }


  const ranges = getComparisonRanges(compareMode);

  const curTickets = filterByDateRange(allTickets, "itTicketCreatedAt", ranges.current.start, ranges.current.end);
  const prevTickets = filterByDateRange(allTickets, "itTicketCreatedAt", ranges.previous.start, ranges.previous.end);
  const curIncidents = filterByDateRange(allIncidents, "itSecurityIncidentCreatedAt", ranges.current.start, ranges.current.end);
  const prevIncidents = filterByDateRange(allIncidents, "itSecurityIncidentCreatedAt", ranges.previous.start, ranges.previous.end);


  const current = buildDashboard(assets, curTickets, software, devices, curIncidents, access);
  const previous = buildDashboard(assets, prevTickets, software, devices, prevIncidents, access);

  return Response.json({
    compareMode,
    labels: { current: ranges.current.label, previous: ranges.previous.label },
    current,
    previous,
  });
}
