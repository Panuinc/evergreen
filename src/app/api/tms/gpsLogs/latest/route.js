import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  // Fetch all gpsLogs ordered by recordedAt desc, limit 100
  const { data: gpsLogs, error } = await supabase
    .from("gpsLogs")
    .select("*, vehicles(vehicleName, vehiclePlateNumber, vehicleStatus)")
    .order("gpsLogRecordedAt", { ascending: false })
    .limit(100);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Deduplicate to get latest entry per vehicle
  const latestByVehicle = {};
  for (const log of gpsLogs) {
    if (!latestByVehicle[log.gpsLogVehicleId]) {
      latestByVehicle[log.gpsLogVehicleId] = log;
    }
  }

  const result = Object.values(latestByVehicle);

  return Response.json(result);
}
