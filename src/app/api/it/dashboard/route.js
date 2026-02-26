import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const [assetsRes, ticketsRes, softwareRes, devicesRes, incidentsRes, accessRes] = await Promise.all([
    supabase.from("itAsset").select("itAssetId, itAssetCategory, itAssetStatus"),
    supabase.from("itTicket").select("itTicketId, itTicketStatus, itTicketPriority, itTicketCategory, itTicketCreatedAt"),
    supabase.from("itSoftware").select("itSoftwareId, itSoftwareStatus, itSoftwareLicenseType, itSoftwareExpiryDate"),
    supabase.from("itNetworkDevice").select("itNetworkDeviceId, itNetworkDeviceStatus, itNetworkDeviceType"),
    supabase.from("itSecurityIncident").select("itSecurityIncidentId, itSecurityIncidentStatus, itSecurityIncidentSeverity, itSecurityIncidentCreatedAt"),
    supabase.from("itSystemAccess").select("itSystemAccessId, itSystemAccessStatus"),
  ]);

  if (assetsRes.error || ticketsRes.error || softwareRes.error || devicesRes.error || incidentsRes.error || accessRes.error) {
    return Response.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }

  const assets = assetsRes.data || [];
  const tickets = ticketsRes.data || [];
  const software = softwareRes.data || [];
  const devices = devicesRes.data || [];
  const incidents = incidentsRes.data || [];
  const access = accessRes.data || [];

  // KPI Stats
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

  // Chart: Ticket Trend (last 6 months)
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

  // Chart: Asset by Category
  const categoryCounts = {};
  assets.forEach((a) => {
    const cat = a.itAssetCategory || "other";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const assetByCategory = Object.entries(categoryCounts).map(
    ([category, count]) => ({ category, count })
  );

  // Chart: License Expiry Overview
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

  return Response.json({
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
  });
}
