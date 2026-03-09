import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;


  const { data: gpsLogs, error } = await supabase
    .from("tmsGpsLog")
    .select("*, tmsVehicle(tmsVehicleName, tmsVehiclePlateNumber, tmsVehicleStatus)")
    .order("tmsGpsLogRecordedAt", { ascending: false })
    .limit(100);

  if (error) return Response.json({ error: error.message }, { status: 500 });


  const latestByVehicle = {};
  for (const log of gpsLogs) {
    if (!latestByVehicle[log.tmsGpsLogVehicleId]) {
      latestByVehicle[log.tmsGpsLogVehicleId] = log;
    }
  }

  const result = Object.values(latestByVehicle);

  return Response.json(result);
}
